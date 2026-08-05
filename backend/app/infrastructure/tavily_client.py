import httpx
from typing import List, Dict, Any
from app.domain.interfaces import SearchProvider
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

class TavilyClient(SearchProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.TAVILY_API_KEY
        self.base_url = "https://api.tavily.com/search"

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("Tavily API key not set, returning mock data")
            return []

        async with httpx.AsyncClient() as client:
            payload = {
                "api_key": self.api_key,
                "query": query,
                "search_depth": "advanced",
                "max_results": max_results,
                "include_raw_content": True
            }
            try:
                response = await client.post(self.base_url, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                results = []
                for item in data.get("results", []):
                    raw_content = item.get("raw_content", "")
                    if raw_content:
                        # Truncate raw content to roughly 2000 chars to protect token budget
                        raw_content = raw_content[:2000] + ("..." if len(raw_content) > 2000 else "")
                    
                    results.append({
                        "source_agent": "web_search",
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "domain": item.get("url", "").split("/")[2] if item.get("url") else "unknown",
                        "snippet": item.get("content", ""),
                        "raw_content": raw_content or None,
                        "publish_date": None,
                        "author": None,
                        "relevance_score": item.get("score", 0.0),
                        "metadata": {}
                    })
                return results
            except Exception as e:
                logger.error("Tavily search failed", error=str(e))
                return []
