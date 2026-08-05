import time
from datetime import datetime
import uuid
from app.agents.state import ResearchState, AgentStepState, SubQueryState
from app.prompts.decomposer import DECOMPOSER_PROMPT_TEMPLATE
from app.infrastructure.gemini_client import GeminiClient
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def decomposer_node(state: ResearchState) -> dict:
    start_time = time.time()
    
    strategy_text = "\n".join([f"- {s}" for s in state.get("strategy", [])])
    
    prompt = DECOMPOSER_PROMPT_TEMPLATE.format(
        query=state["query"],
        strategy=strategy_text
    )
    
    client = GeminiClient()
    schema = {
        "type": "OBJECT",
        "properties": {
            "sub_queries": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {"type": "STRING"},
                        "target_agent": {"type": "STRING"}
                    },
                    "required": ["query", "target_agent"]
                }
            }
        },
        "required": ["sub_queries"]
    }
    
    result = await client.generate_structured(prompt, schema)
    
    if not result:
        logger.error("Decomposer received empty response from LLM")
        raise ValueError("AI failed to decompose the strategy. Please try again.")
        
    sub_queries = result.get("sub_queries", [])
    
    if not sub_queries:
        logger.error("Decomposer received invalid response format from LLM")
        raise ValueError("AI generated an invalid sub-query format.")
    
    raw_sub_queries = sub_queries
    sub_queries = []
    
    for sq in raw_sub_queries:
        sub_queries.append({
            "id": f"sq-{uuid.uuid4().hex[:6]}",
            "query": sq.get("query", ""),
            "target_agent": sq.get("target_agent", "web"),
            "status": "pending",
            "results_count": 0,
            "sources_found": []
        })
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    step: AgentStepState = {
        "id": f"s-{uuid.uuid4().hex[:8]}",
        "type": "decomposer",
        "title": "Task Decomposition into Sub-Queries",
        "description": "Generating parallel queries across specialized search indexes...",
        "status": "completed",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "duration_ms": duration_ms,
        "sub_queries": sub_queries,
        "details": None
    }
    
    logger.info("Decomposer finished", prompt_size=len(prompt), sub_queries_count=len(sub_queries))
    
    return {
        "sub_queries": sub_queries,
        "agent_steps": [step],
        "current_step_index": 1
    }
