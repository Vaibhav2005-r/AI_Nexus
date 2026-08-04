import time
from datetime import datetime
import uuid
from app.agents.state import ResearchState, AgentStepState
from app.prompts.planner import PLANNER_PROMPT_TEMPLATE
from app.infrastructure.gemini_client import GeminiClient
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def planner_node(state: ResearchState) -> dict:
    start_time = time.time()
    
    from app.infrastructure.qdrant_store import memory_manager
    past_research = memory_manager.retrieve_past_research(state["query"])
    
    past_research_context = ""
    if past_research:
        context_chunks = "\n".join([f"- {res['text']} (Session: {res['session_id']})" for res in past_research])
        past_research_context = f"=== PAST RESEARCH ON THIS TOPIC ===\n{context_chunks}\n==================================="
        logger.info("Injected past research into planner", chunks_found=len(past_research))
        
    prompt = PLANNER_PROMPT_TEMPLATE.format(
        domain_mode=state.get("domain_mode", "General"),
        query=state["query"],
        depth=state["depth"],
        past_research_context=past_research_context
    )
    
    client = GeminiClient()
    schema = {
        "type": "OBJECT",
        "properties": {
            "strategy": {"type": "ARRAY", "items": {"type": "STRING"}},
            "domain_constraints": {"type": "ARRAY", "items": {"type": "STRING"}}
        },
        "required": ["strategy", "domain_constraints"]
    }
    
    result = await client.generate_structured(prompt, schema)
    
    strategy = result.get("strategy", [])
    domain_constraints = result.get("domain_constraints", [])
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    step: AgentStepState = {
        "id": f"s-{uuid.uuid4().hex[:8]}",
        "type": "planner",
        "title": "Strategy Formulation & Knowledge Mapping",
        "description": "Analyzing research objective and establishing domain constraints...",
        "status": "completed",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "duration_ms": duration_ms,
        "sub_queries": None,
        "details": {
            "strategy": strategy,
            "domain_constraints": domain_constraints
        }
    }
    
    logger.info("Planner finished", strategy_count=len(strategy), constraints_count=len(domain_constraints))
    
    return {
        "strategy": strategy,
        "domain_constraints": domain_constraints,
        "agent_steps": [step],
        "current_step_index": 0
    }
