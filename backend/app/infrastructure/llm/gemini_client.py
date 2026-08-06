import asyncio
import json
import time
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from app.config import get_settings
from app.utils.logger import get_logger
from app.infrastructure.llm.base import BaseLLMClient, TransientInfrastructureError

logger = get_logger(__name__)
settings = get_settings()

T = TypeVar('T', bound=BaseModel)

class GeminiClient(BaseLLMClient):
    def __init__(self, model: str = None):
        self.api_key = settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def generate_structured(self, prompt: str, schema_model: Type[T], timeout_seconds: Optional[int] = None) -> T:
        if not self.client:
            logger.warning("Gemini API key not set, throwing error")
            raise ValueError("Gemini API key not configured")
            
        max_retries = settings.LLM_RETRIES
        for attempt in range(max_retries):
            start_time = time.time()
            try:
                schema_dict = schema_model.model_json_schema()
                
                # Gemini Developer API rejects additionalProperties
                def strip_additional_properties(schema):
                    if isinstance(schema, dict):
                        schema.pop("additionalProperties", None)
                        for key, value in schema.items():
                            strip_additional_properties(value)
                    elif isinstance(schema, list):
                        for item in schema:
                            strip_additional_properties(item)
                            
                strip_additional_properties(schema_dict)
                
                config_params = {
                    "response_mime_type": "application/json",
                    "response_schema": schema_dict,
                    "temperature": settings.LLM_TEMPERATURE
                }
                
                timeout_val = timeout_seconds or settings.LLM_TIMEOUT
                response = await asyncio.wait_for(
                    self.client.aio.models.generate_content(
                        model=self.model,
                        contents=prompt,
                        config=types.GenerateContentConfig(**config_params)
                    ),
                    timeout=timeout_val
                )
                
                parsed_json = json.loads(response.text)
                return schema_model.model_validate(parsed_json)
                
            except (asyncio.TimeoutError, TimeoutError) as e:
                is_transient = True
                error_msg = "timeout"
                
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt * 5
                    logger.warning(f"Gemini API transient error ({error_msg}). Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("Gemini structured generation failed due to transient infrastructure error after retries", error=str(e))
                    raise TransientInfrastructureError(f"Gemini API transient error: {str(e)}") from e
                    
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check for permanent quota errors first
                is_permanent_quota = ("quota" in error_msg and ("exhausted" in error_msg or "exceeded" in error_msg)) or "billing disabled" in error_msg
                if is_permanent_quota:
                    logger.error("Gemini structured generation failed due to PERMANENT quota exhaustion or billing error", error=str(e))
                    raise e
                    
                is_transient = any(code in error_msg for code in ["429", "500", "502", "503", "timeout", "connection reset"])
                
                if is_transient:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt * 5  # 5s, 10s, 20s
                        logger.warning(f"Gemini API error ({error_msg}). Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error("Gemini structured generation failed due to transient infrastructure error after retries", error=str(e))
                        raise TransientInfrastructureError(f"Gemini API transient error: {str(e)}") from e
                    
                logger.error("Gemini structured generation failed with non-transient error", error=str(e))
                raise e

    async def health_check(self) -> bool:
        if not self.client:
            return False
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents="Say exactly the word 'OK'."
            )
            return "ok" in response.text.lower()
        except Exception:
            return False
