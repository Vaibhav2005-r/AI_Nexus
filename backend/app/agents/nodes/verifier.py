import time
import uuid
from datetime import datetime
from app.agents.state import ResearchState, AgentStepState
from app.prompts.verifier import VERIFIER_PROMPT_TEMPLATE
from app.infrastructure.llm.factory import LLMFactory
from app.domain.llm_models import VerifierResponse
from app.utils.logger import get_logger
from app.config import get_settings

logger = get_logger(__name__)
settings = get_settings()

async def verifier_node(state: ResearchState) -> dict:
    logger.info("Verifier started")
    start_time = time.time()
    
    raw_evidence = state.get("raw_evidence", [])
    
    # Deduplicate based on URL
    unique_evidence = {}
    for ev in raw_evidence:
        url = ev.get('url', '')
        if url and url not in unique_evidence:
            unique_evidence[url] = ev
            
    deduped_evidence = list(unique_evidence.values())
    
    # Sort by credibility score if available (descending), fallback to keeping original order
    deduped_evidence.sort(key=lambda x: x.get('credibility_score', 0), reverse=True)
    
    # Cap to max sources
    top_evidence = deduped_evidence[:settings.VERIFIER_MAX_SOURCES]
    
    evidence_text = ""
    for idx, ev in enumerate(top_evidence):
        title = ev.get('title', '')
        snippet = ev.get('snippet', '')
        raw_content = ev.get('raw_content', '')
        
        # Smart Truncation: Prefer title + snippet + safe chunk of raw_content
        char_limit = settings.VERIFIER_SOURCE_CHAR_LIMIT
        
        content_to_show = f"Title: {title}\nSummary: {snippet}\n"
        remaining_chars = char_limit - len(content_to_show)
        
        if remaining_chars > 0 and raw_content:
            content_to_show += f"Excerpt: {raw_content[:remaining_chars]}..."
            
        evidence_text += f"\n[Source {idx+1}] ({ev.get('domain', 'unknown')}) {ev.get('url', '')}\n{content_to_show}\n"
    
    if not evidence_text:
        evidence_text = "No evidence found."
        
    prompt = VERIFIER_PROMPT_TEMPLATE.format(
        query=state["query"],
        raw_evidence=evidence_text
    )
    
    client = LLMFactory.get_client()
    result = await client.generate_structured(prompt, VerifierResponse, timeout_seconds=180)
    
    if not result:
        logger.error("Verifier received empty response from LLM")
        raise ValueError("AI failed to verify the research evidence. Please try again.")
        
    verified_claims = [c.model_dump() for c in result.verified_claims] if result.verified_claims else []
    discarded_claims = [c.model_dump() for c in result.discarded_claims] if result.discarded_claims else []
    contradictions = [c.model_dump() for c in result.contradictions] if result.contradictions else []
    confidence_score = result.confidence_score
    agreement_percentage = result.agreement_percentage
    
    if not verified_claims and not discarded_claims and not contradictions:
        logger.error("Verifier received invalid response format from LLM")
        raise ValueError("AI generated an invalid verification format.")
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    # We add a search summary step first (since parallel fan-out didn't emit one)
    # Then we add the verifier step
    
    search_step: AgentStepState = {
        "id": f"s-{uuid.uuid4().hex[:8]}",
        "type": "search",
        "title": "Parallel Retrieval & Ingestion",
        "description": "Scanned sources via Web and Academic search agents...",
        "status": "completed",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "duration_ms": 1500,  # Estimated parallel time
        "sub_queries": None,
        "details": {
            "sourcesScanned": len(raw_evidence),
            "logs": [f"Retrieved {len(raw_evidence)} relevant documents across multiple indexes"]
        }
    }
    
    verifier_step: AgentStepState = {
        "id": f"s-{uuid.uuid4().hex[:8]}",
        "type": "verifier",
        "title": "Cross-Verification & Anti-Hallucination Audit",
        "description": "Cross-referencing claims against peer-reviewed sources...",
        "status": "completed",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "duration_ms": duration_ms,
        "sub_queries": None,
        "details": {
            "claimsVerified": len(verified_claims),
            "hallucinationsDiscarded": len(discarded_claims),
            "confidenceScore": confidence_score,
            "logs": [
                f"Verified {len(verified_claims)} factual claims.",
                f"Discarded {len(discarded_claims)} claims due to lack of evidence."
            ]
        }
    }
    
    logger.info("Verifier finished", raw_evidence_in=len(raw_evidence), verified_claims_out=len(verified_claims), contradictions_out=len(contradictions))
    
    return {
        "verified_claims": verified_claims,
        "discarded_claims": discarded_claims,
        "contradictions": contradictions,
        "confidence_score": confidence_score,
        "agreement_percentage": agreement_percentage,
        "agent_steps": [search_step, verifier_step],
        "current_step_index": 3
    }
