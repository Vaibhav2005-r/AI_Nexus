import asyncio
from app.agents.state import ResearchState
from app.infrastructure.tavily_client import TavilyClient
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def web_search_node(state: ResearchState) -> dict:
    logger.info("Web Search started")
    sub_queries = [sq for sq in state.get("sub_queries", []) if sq["target_agent"] == "web"]
    
    if not sub_queries:
        return {"raw_evidence": []}
        
    client = TavilyClient()
    
    # We execute all web queries concurrently
    tasks = []
    for sq in sub_queries:
        tasks.append(client.search(sq["query"], max_results=5))
        
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_evidence = []
    errors = []
    for i, res in enumerate(results):
        if isinstance(res, list):
            all_evidence.extend(res)
        elif isinstance(res, Exception):
            errors.append(str(res))
            
    logger.info("Web Search finished", web_queries=len(sub_queries), web_evidence_count=len(all_evidence))
    
    output = {"raw_evidence": all_evidence}
    
    if errors:
        import uuid, time
        from datetime import datetime
        error_step = {
            "id": f"s-{uuid.uuid4().hex[:8]}",
            "type": "search",
            "title": "Web Search Partially Failed",
            "description": f"Failed to complete some web queries. Errors: {errors[0]}",
            "status": "failed",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "duration_ms": 0,
            "sub_queries": None,
            "details": None
        }
        output["agent_steps"] = [error_step]
            
    return output
