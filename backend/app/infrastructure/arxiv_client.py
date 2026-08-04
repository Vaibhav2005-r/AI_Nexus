import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from app.domain.interfaces import SearchProvider
from app.utils.logger import get_logger

logger = get_logger(__name__)

class ArxivClient(SearchProvider):
    def __init__(self):
        self.base_url = "https://export.arxiv.org/api/query"

    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            params = {
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": max_results
            }
            try:
                response = await client.get(self.base_url, params=params, timeout=30.0)
                response.raise_for_status()
                
                root = ET.fromstring(response.text)
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                
                results = []
                for entry in root.findall("atom:entry", ns):
                    title = entry.find("atom:title", ns).text
                    if title:
                        title = title.replace("\n", " ").strip()
                    
                    summary = entry.find("atom:summary", ns).text
                    if summary:
                        summary = summary.replace("\n", " ").strip()
                        
                    url = entry.find("atom:id", ns).text
                    published = entry.find("atom:published", ns).text
                    
                    authors = [author.find("atom:name", ns).text for author in entry.findall("atom:author", ns)]
                    
                    results.append({
                        "source_agent": "academic_search",
                        "title": title,
                        "url": url,
                        "domain": "arxiv.org",
                        "snippet": summary,
                        "raw_content": None,
                        "publish_date": published[:10] if published else None,
                        "author": ", ".join(authors) if authors else None,
                        "relevance_score": 1.0,  # ArXiv doesn't provide scores by default
                        "metadata": {}
                    })
                return results
            except Exception as e:
                logger.error("ArXiv search failed", error=str(e))
                return []
