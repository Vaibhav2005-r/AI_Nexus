import json
import time
import asyncio
from typing import Type, TypeVar, Optional
from pydantic import BaseModel, ValidationError
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from app.config import get_settings
from app.utils.logger import get_logger
from app.infrastructure.llm.base import BaseLLMClient, TransientInfrastructureError

logger = get_logger(__name__)
settings = get_settings()

T = TypeVar('T', bound=BaseModel)

class NvidiaClient(BaseLLMClient):
    def __init__(self, model: str = None):
        self.api_key = settings.NVIDIA_API_KEY
        self.model = model or settings.LLM_MODEL
        if self.api_key:
            self.client = ChatNVIDIA(
                model=self.model,
                api_key=self.api_key,
                temperature=settings.LLM_TEMPERATURE,
                top_p=0.95,
                max_completion_tokens=settings.LLM_MAX_TOKENS,
                timeout=settings.LLM_TIMEOUT,
            )
        else:
            self.client = None

    async def generate_structured(self, prompt: str, schema_model: Type[T], timeout_seconds: Optional[int] = None) -> T:
        if not self.client:
            logger.warning("NVIDIA API key not set, throwing error")
            raise ValueError("NVIDIA API key not configured")
            
        schema_dict = schema_model.model_json_schema()
        schema_str = json.dumps(schema_dict, indent=2)
        
        system_instruction = (
            "You are an expert structured data generator.\n"
            "You MUST output ONLY valid JSON that precisely matches the provided schema.\n"
            "Do NOT wrap the JSON in Markdown code blocks (e.g. ```json ... ```).\n"
            "Output the raw JSON object and absolutely nothing else.\n\n"
            f"REQUIRED SCHEMA:\n{schema_str}"
        )
        
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        
        max_retries = settings.LLM_RETRIES
        for attempt in range(max_retries):
            start_time = time.time()
            try:
                timeout_val = timeout_seconds or settings.LLM_TIMEOUT
                # We use asyncio.wait_for to enforce the per-request timeout
                response = await asyncio.wait_for(
                    self.client.ainvoke(
                        messages,
                        chat_template_kwargs={"enable_thinking": False}
                    ),
                    timeout=timeout_val
                )
                
                content = response.content.strip()
                
                # Strip markdown fences if present
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                parsed_json = json.loads(content)
                result = schema_model.model_validate(parsed_json)
                
                # Telemetry Logging
                latency_ms = int((time.time() - start_time) * 1000)
                usage = response.response_metadata.get("usage", {}) if hasattr(response, "response_metadata") else {}
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)
                
                logger.info("LLM Generation Success", 
                            provider="nvidia",
                            model=self.model,
                            latency_ms=latency_ms,
                            retries=attempt,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens)
                            
                return result
                
            except json.JSONDecodeError as je:
                # JSON Repair Prompt logic
                error_msg = f"JSON parsing failed: {str(je)}. You returned invalid JSON. Fix it."
                messages.append({"role": "assistant", "content": content if 'content' in locals() else ""})
                messages.append({"role": "user", "content": error_msg})
                
                logger.warning(f"NVIDIA API JSON Decode Error. Retrying (Attempt {attempt+1}/{max_retries})...")
                continue
                
            except ValidationError as ve:
                # Pydantic Schema Repair Prompt logic
                error_msg = f"Schema validation failed: {str(ve)}. Return valid JSON matching the schema."
                messages.append({"role": "assistant", "content": content if 'content' in locals() else ""})
                messages.append({"role": "user", "content": error_msg})
                
                logger.warning(f"NVIDIA API Schema Validation Error. Retrying (Attempt {attempt+1}/{max_retries})...")
                continue
                
            except asyncio.TimeoutError as e:
                is_transient = True
                error_msg = "timeout"
                
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt * 5
                    logger.warning(f"NVIDIA API transient error ({error_msg}). Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("NVIDIA structured generation failed due to transient infrastructure error after retries", error=str(e))
                    raise TransientInfrastructureError(f"NVIDIA API transient error: {str(e)}") from e
                    
            except Exception as e:
                error_msg = str(e).lower()
                is_transient = any(code in error_msg for code in ["429", "500", "502", "503", "timeout", "connection reset"])
                
                if is_transient:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt * 5
                        logger.warning(f"NVIDIA API transient error ({error_msg}). Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error("NVIDIA structured generation failed due to transient infrastructure error after retries", error=str(e))
                        raise TransientInfrastructureError(f"NVIDIA API transient error: {str(e)}") from e
                    
                logger.error("NVIDIA structured generation failed with non-transient error", error=str(e))
                raise e

    async def health_check(self) -> bool:
        if not self.client:
            return False
        try:
            messages = [{"role": "user", "content": "Say exactly the word 'OK'."}]
            response = await self.client.ainvoke(messages)
            return "ok" in response.content.lower()
        except Exception:
            return False
