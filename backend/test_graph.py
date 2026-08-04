import asyncio
import json
from app.agents.graph import app_graph
from app.agents.state import ResearchState
import uuid

async def test():
    state = ResearchState(
        query="What are the recent advancements in solid state batteries?",
        depth="Fast",
        sources_filter=[],
        session_id=str(uuid.uuid4()),
        domain_mode="General",
        strategy=[],
        domain_constraints=[],
        sub_queries=[],
        raw_evidence=[],
        verified_claims=[],
        discarded_claims=[],
        contradictions=[],
        confidence_score=0.0,
        agreement_percentage=0.0,
        report_markdown="",
        citations=[],
        key_takeaways=[],
        chart_data=None,
        agent_steps=[],
        current_step_index=0,
        errors=[]
    )
    
    final_state = await app_graph.ainvoke(state)
    
    with open("test_out.json", "w") as f:
        # filter out agent_steps for brevity
        final_state.pop("agent_steps", None)
        json.dump(final_state, f, indent=2)

if __name__ == "__main__":
    asyncio.run(test())
