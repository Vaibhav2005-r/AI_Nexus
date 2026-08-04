import json
from google import genai
from google.genai import types
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def generate_structured(self, prompt: str, schema: dict = None) -> dict:
        import os
        is_mock = os.getenv("USE_MOCK_LLM", str(settings.USE_MOCK_LLM)).lower() in ("true", "1", "t")
        
        # Fallback: check .env file directly to defeat uvicorn/os.environ caching
        if not is_mock and os.path.exists(".env"):
            with open(".env", "r") as f:
                content = f.read()
                if "USE_MOCK_LLM=true" in content.lower():
                    is_mock = True

        logger.info(f"Checking mock mode in generate_structured: {is_mock}")
        
        if is_mock:
            logger.info("USE_MOCK_LLM is true, returning mock data")
            import asyncio
            await asyncio.sleep(1) # simulate network latency
            return self._get_mock_response(schema or {}, prompt)

        if not self.client:
            logger.warning("Gemini API key not set, returning mock empty dict")
            return {}
            
        for attempt in range(3):
            try:
                config_params = {
                    "temperature": 0.2,
                    "response_mime_type": "application/json"
                }
                if schema:
                    config_params["response_schema"] = schema
    
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(**config_params)
                )
                
                return json.loads(response.text)
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    logger.warning("Gemini API Rate Limit (429) hit, waiting 15 seconds before retry...")
                    import asyncio
                    await asyncio.sleep(15)
                    continue
                logger.error("Gemini structured generation failed", error=str(e))
                return {}

    async def generate_text(self, prompt: str) -> str:
        import os
        is_mock = os.getenv("USE_MOCK_LLM", str(settings.USE_MOCK_LLM)).lower() in ("true", "1", "t")
        
        # Fallback: check .env file directly
        if not is_mock and os.path.exists(".env"):
            with open(".env", "r") as f:
                if "USE_MOCK_LLM=true" in f.read().lower():
                    is_mock = True
                    
        if is_mock:
            logger.info("USE_MOCK_LLM is true, returning mock text")
            return "This is a mock text response."
            
        if not self.client:
            logger.warning("Gemini API key not set")
            return ""
            
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            return response.text
        except Exception as e:
            logger.error("Gemini text generation failed", error=str(e))
            return ""

    def _get_mock_response(self, schema: dict, prompt: str = "") -> dict:
        import re
        topic = "Solid State Batteries"
        match = re.search(r'Query:\s*"(.*?)"', prompt)
        if match:
            topic = match.group(1).title()
            
        props = schema.get("properties", {})
        
        if "strategy" in props:
            return {
                "strategy": [
                    f"Analyze recent breakthroughs in {topic}.",
                    f"Compare key metrics and historical developments of {topic}.",
                    f"Identify key challenges and future timelines for {topic}."
                ],
                "domain_constraints": [
                    f"Focus on peer-reviewed research regarding {topic}.",
                    "Include data from top tier sources."
                ]
            }
        elif "sub_queries" in props:
            return {
                "sub_queries": [
                    {
                        "query": f"{topic} latest advancements 2024",
                        "target_agent": "web"
                    },
                    {
                        "query": f"{topic} fundamental constraints and analysis",
                        "target_agent": "academic"
                    }
                ]
            }
        elif "verified_claims" in props:
            return {
                "verified_claims": [
                    {
                        "claim": f"{topic} offers significant advancements over traditional methods according to recent empirical studies.",
                        "supporting_sources": ["https://example.com/source1", "arxiv.org/abs/example"],
                        "evidence_snippets": [f"Research shows {topic} prevents common failures..."],
                        "confidence": 0.95
                    }
                ],
                "discarded_claims": [],
                "contradictions": [],
                "confidence_score": 0.9,
                "agreement_percentage": 100.0
            }
        elif "report_markdown" in props:
            return {
                "report_markdown": f"# {topic} Research Report\n\n{topic} represents a significant leap forward in this domain. By utilizing new methodologies, it dramatically reduces risks and improves efficiency [1].\n\n## Key Advancements\nRecent studies indicate a theoretical improvement of up to 50% compared to conventional approaches [2].\n\n## New Developments & Delta Analysis\n### New Papers\nSeveral new papers on {topic} have been published since the last research session.\n### Emerging Trends\nThere is a massive influx of capital towards {topic} commercialization.",
                "citations": [
                    {
                        "id": 1,
                        "title": f"Safety improvements in {topic}",
                        "url": "https://example.com/safety",
                        "domain": "example.com",
                        "snippet": f"{topic} prevents catastrophic failures...",
                        "credibility_score": 0.9,
                        "credibility_label": "High"
                    },
                    {
                        "id": 2,
                        "title": f"Theoretical limits of {topic}",
                        "url": "https://arxiv.org/abs/example",
                        "domain": "arxiv.org",
                        "snippet": "Theoretical models predict 50% increase...",
                        "credibility_score": 0.95,
                        "credibility_label": "High"
                    }
                ],
                "key_takeaways": [
                    f"{topic} improves safety and reliability.",
                    f"It offers higher performance metrics.",
                    "Scaling at production levels remains a hurdle."
                ],
                "chart_data": None
            }
            
        return {}
