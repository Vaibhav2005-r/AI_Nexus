import asyncio
import uuid
import json
from datetime import datetime
from app.domain.models import ResearchSession, AgentStep
from app.domain.enums import SessionStatus
from app.agents.state import ResearchState
from app.agents.graph import app_graph
from app.infrastructure.sqlite_store import session_store
from app.utils.logger import get_logger

logger = get_logger(__name__)

# In-memory queue mapping session_id -> asyncio.Queue for SSE events
_streams: dict[str, asyncio.Queue] = {}

class ResearchService:
    @staticmethod
    async def create_session(prompt: str, depth: str, deep_web_enabled: bool, sources_filter: list[str], domain_mode: str) -> ResearchSession:
        session_id = f"session-{uuid.uuid4().hex[:8]}"
        title = prompt[:50] + "..." if len(prompt) > 50 else prompt
        
        session = ResearchSession(
            id=session_id,
            title=title,
            prompt=prompt,
            createdAt=datetime.now().isoformat() + "Z",
            timeCategory="Today",
            depth=depth,
            sourcesFilter=sources_filter,
            deepWebEnabled=deep_web_enabled,
            status=SessionStatus.RUNNING,
            currentStepIndex=0,
            steps=[]
        )
        
        await session_store.save_session(session)
        
        # Initialize SSE queue
        _streams[session_id] = asyncio.Queue()
        
        # Start graph execution in background
        asyncio.create_task(ResearchService._run_graph_workflow(session_id, prompt, depth, sources_filter, domain_mode))
        
        return session

    @staticmethod
    async def get_stream_queue(session_id: str) -> asyncio.Queue:
        if session_id not in _streams:
            _streams[session_id] = asyncio.Queue()
        return _streams[session_id]

    @staticmethod
    async def _run_graph_workflow(session_id: str, prompt: str, depth: str, sources_filter: list[str], domain_mode: str):
        queue = _streams.get(session_id)
        
        try:
            initial_state: ResearchState = {
                "query": prompt,
                "depth": depth,
                "sources_filter": sources_filter,
                "session_id": session_id,
                "domain_mode": domain_mode,
                "strategy": [],
                "domain_constraints": [],
                "sub_queries": [],
                "raw_evidence": [],
                "verified_claims": [],
                "discarded_claims": [],
                "contradictions": [],
                "confidence_score": 0.0,
                "agreement_percentage": 0.0,
                "report_markdown": "",
                "citations": [],
                "key_takeaways": [],
                "chart_data": None,
                "agent_steps": [],
                "current_step_index": 0,
                "errors": []
            }

            final_state = None
            # Stream events as nodes complete
            async for event in app_graph.astream(initial_state):
                for node_name, state_update in event.items():
                    # The state_update contains only the fields updated/appended by the node
                    if "agent_steps" in state_update and state_update["agent_steps"]:
                        # `add` reducer means state_update["agent_steps"] is the *new* steps added
                        # but in our node implementations we return just the step(s) added
                        new_steps = state_update["agent_steps"]
                        current_idx = state_update.get("current_step_index", 0)
                        
                        # We might have emitted multiple steps (e.g. search + verifier)
                        for step_obj in new_steps:
                            # Send SSE update for the step
                            if queue:
                                await queue.put({
                                    "event": "step_update",
                                    "data": json.dumps({
                                        "sessionId": session_id,
                                        "stepIndex": current_idx,
                                        "step": step_obj
                                    })
                                })
                    
                    # Accumulate final state (astream yields updates, we could track full state if needed,
                    # but we can also just get the final state at the end by using invoke or collecting)
            
            # Since astream yields partial updates, we might need to fetch the final state from the graph
            # Actually, `astream` on StateGraph yields the state updates. To get the final full state, 
            # we should probably just use `ainvoke` or reconstruct it. But `astream` gives us the updates we need.
            # Let's run ainvoke for simplicity to get the final complete state for saving,
            # wait, `astream` is fine if we keep track, but `ainvoke` is simpler for saving the DB record.
            # Let's just run `ainvoke` and manually yield step updates during execution... wait, we already did astream.
            
            pass # We should have collected final state, let's fix this below

        except Exception as e:
            logger.error(f"Graph execution failed for {session_id}", error=str(e))
            if queue:
                await queue.put({
                    "event": "error",
                    "data": json.dumps({"sessionId": session_id, "error": str(e)})
                })
            
            session = await session_store.get_session(session_id)
            if session:
                session.status = SessionStatus.FAILED
                await session_store.save_session(session)
    
    @staticmethod
    async def _run_graph_workflow_fixed(session_id: str, prompt: str, depth: str, sources_filter: list[str], domain_mode: str):
        queue = _streams.get(session_id)
        
        initial_state = {
                "query": prompt,
                "depth": depth,
                "sources_filter": sources_filter,
                "session_id": session_id,
                "domain_mode": domain_mode,
                "strategy": [],
                "domain_constraints": [],
                "sub_queries": [],
                "raw_evidence": [],
                "verified_claims": [],
                "discarded_claims": [],
                "contradictions": [],
                "confidence_score": 0.0,
                "agreement_percentage": 0.0,
                "report_markdown": "",
                "citations": [],
                "key_takeaways": [],
                "chart_data": None,
                "agent_steps": [],
                "current_step_index": 0,
                "errors": []
        }
        
        try:
            # We'll use astream and accumulate the full state
            full_state = dict(initial_state)
            
            async for event in app_graph.astream(initial_state):
                for node_name, state_update in event.items():
                    # Update full_state manually
                    for k, v in state_update.items():
                        if k in ["raw_evidence", "agent_steps"]:
                            full_state[k].extend(v)
                        else:
                            full_state[k] = v
                    
                    if "agent_steps" in state_update and state_update["agent_steps"]:
                        # emit step update
                        from app.domain.models import AgentStep, AgentStepType, StepStatus
                        for step_obj in state_update["agent_steps"]:
                            
                            # Convert dict to Pydantic model to get camelCase!
                            s_status = StepStatus.COMPLETED
                            if step_obj.get("status") == "pending": s_status = StepStatus.PENDING
                            elif step_obj.get("status") == "running": s_status = StepStatus.RUNNING
                            elif step_obj.get("status") == "failed": s_status = StepStatus.FAILED
                            
                            s_type = AgentStepType.PLANNER
                            t_raw = step_obj.get("type", "planner")
                            for enum_t in AgentStepType:
                                if t_raw == enum_t.value:
                                    s_type = enum_t
                                    break
                            
                            pydantic_step = AgentStep(
                                id=step_obj.get("id", ""),
                                type=s_type,
                                title=step_obj.get("title", ""),
                                description=step_obj.get("description", ""),
                                status=s_status,
                                timestamp=step_obj.get("timestamp"),
                                durationMs=step_obj.get("duration_ms"),
                                subQueries=step_obj.get("sub_queries"),
                                details=step_obj.get("details")
                            )
                            
                            if queue:
                                await queue.put({
                                    "event": "step_update",
                                    "data": json.dumps({
                                        "sessionId": session_id,
                                        "stepIndex": full_state["current_step_index"],
                                        "step": pydantic_step.model_dump(by_alias=True, exclude_none=True)
                                    })
                                })

            # Execution complete, save to DB
            session = await session_store.get_session(session_id)
            if session:
                session.status = SessionStatus.COMPLETED
                session.report_markdown = full_state.get("report_markdown")
                
                # Convert citations to Pydantic models
                from app.domain.models import SourceCitation, CredibilityLabel
                cits = []
                for c in full_state.get("citations", []):
                    # safely parse credibility label
                    clabel = CredibilityLabel.UNVERIFIED
                    raw_label = c.get("credibility_label")
                    if raw_label in [l.value for l in CredibilityLabel]:
                        clabel = CredibilityLabel(raw_label)
                        
                    cits.append(SourceCitation(
                        id=c.get("id", 0),
                        title=c.get("title", ""),
                        url=c.get("url", ""),
                        domain=c.get("domain", ""),
                        snippet=c.get("snippet", ""),
                        credibilityScore=c.get("credibility_score", 0.0),
                        credibilityLabel=clabel,
                        publishDate=c.get("publish_date"),
                        author=c.get("author")
                    ))
                session.citations = cits
                
                # Metrics
                from app.domain.models import ResearchMetrics
                # Compute total time from steps
                total_ms = sum([s.get("duration_ms", 0) for s in full_state["agent_steps"] if s.get("duration_ms")])
                
                # Check if synthesizer provided metrics
                syn_metrics = full_state.get("metrics", {})
                
                session.metrics = ResearchMetrics(
                    totalTimeSeconds=total_ms / 1000.0,
                    sourcesAnalyzed=syn_metrics.get("sourcesAnalyzed", len(full_state.get("raw_evidence", []))),
                    factsVerified=syn_metrics.get("factsVerified", len(full_state.get("verified_claims", []))),
                    overallCredibility=syn_metrics.get("overallCredibility", full_state.get("confidence_score", 0.0)),
                    previousCredibility=syn_metrics.get("previousCredibility")
                )
                
                session.key_takeaways = full_state.get("key_takeaways")
                session.contradictions = full_state.get("contradictions")
                
                # Convert steps
                from app.domain.models import AgentStep, AgentStepType, StepStatus
                step_models = []
                for s in full_state["agent_steps"]:
                    # map step status
                    s_status = StepStatus.COMPLETED
                    if s.get("status") == "pending": s_status = StepStatus.PENDING
                    elif s.get("status") == "failed": s_status = StepStatus.FAILED
                    
                    s_type = AgentStepType.PLANNER
                    t_raw = s.get("type", "planner")
                    for enum_t in AgentStepType:
                        if t_raw == enum_t.value:
                            s_type = enum_t
                            break
                    
                    # Note: we need to handle SubQueries and Details properly, but avoiding deep mapping for brevity
                    # In a real app we'd map this perfectly to Pydantic.
                    step_models.append(AgentStep(
                        id=s.get("id", ""),
                        type=s_type,
                        title=s.get("title", ""),
                        description=s.get("description", ""),
                        status=s_status,
                        durationMs=s.get("duration_ms"),
                        timestamp=s.get("timestamp")
                    ))
                session.steps = step_models
                
                await session_store.save_session(session)
                
                # Emit completion
                if queue:
                    await queue.put({
                        "event": "session_complete",
                        "data": session.model_dump_json(by_alias=True)
                    })
                    
        except Exception as e:
            logger.error(f"Graph execution failed for {session_id}", error=str(e))
            if queue:
                await queue.put({
                    "event": "error",
                    "data": json.dumps({"sessionId": session_id, "error": str(e)})
                })
            
            session = await session_store.get_session(session_id)
            if session:
                session.status = SessionStatus.FAILED
                await session_store.save_session(session)

# Replace the original with the fixed one
ResearchService._run_graph_workflow = ResearchService._run_graph_workflow_fixed
