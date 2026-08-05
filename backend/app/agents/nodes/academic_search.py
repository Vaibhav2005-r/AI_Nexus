import asyncio
from app.agents.state import ResearchState
from app.infrastructure.arxiv_client import ArxivClient
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def academic_search_node(state: ResearchState) -> dict:
    logger.info("Academic Search started")
    sub_queries = [sq for sq in state.get("sub_queries", []) if sq["target_agent"] == "academic"]
    
    if not sub_queries:
        return {"raw_evidence": []}
        
    client = ArxivClient()
    
    # We execute all academic queries concurrently
    tasks = []
    for sq in sub_queries:
        tasks.append(client.search(sq["query"], max_results=3))
        
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_evidence = []
    errors = []
    for i, res in enumerate(results):
        if isinstance(res, list):
            all_evidence.extend(res)
        elif isinstance(res, Exception):
            errors.append(str(res))
            
    logger.info("Academic Search finished", academic_evidence_count=len(all_evidence), academic_queries=len(sub_queries), academic_sources=len(set(e.get("url") for e in all_evidence)))
    
    output = {"raw_evidence": all_evidence}
    
    if errors:
        import uuid, time
        from datetime import datetime
        error_step = {
            "id": f"s-{uuid.uuid4().hex[:8]}",
            "type": "search",
            "title": "Academic Search Partially Failed",
            "description": f"Failed to complete some academic queries. Errors: {errors[0]}",
            "status": "failed",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "duration_ms": 0,
            "sub_queries": None,
            "details": None
        }
        output["agent_steps"] = [error_step]
            
    return output
