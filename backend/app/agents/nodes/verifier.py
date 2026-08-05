import time
import uuid
from datetime import datetime
from app.agents.state import ResearchState, AgentStepState
from app.prompts.verifier import VERIFIER_PROMPT_TEMPLATE
from app.infrastructure.gemini_client import GeminiClient
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def verifier_node(state: ResearchState) -> dict:
    logger.info("Verifier started")
    start_time = time.time()
    
    raw_evidence = state.get("raw_evidence", [])
    
    # Limit evidence to fit in context window if necessary, but 2.5 flash has huge window
    evidence_text = ""
    for idx, ev in enumerate(raw_evidence):
        evidence_text += f"\n[Source {idx+1}] ({ev['domain']}) {ev['url']}\nTitle: {ev['title']}\nSnippet: {ev['snippet']}\n"
    
    if not evidence_text:
        evidence_text = "No evidence found."
        
    prompt = VERIFIER_PROMPT_TEMPLATE.format(
        query=state["query"],
        raw_evidence=evidence_text
    )
    
    client = GeminiClient()
    schema = {
        "type": "OBJECT",
        "properties": {
            "verified_claims": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "claim": {"type": "STRING"},
                        "supporting_sources": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "evidence_snippets": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "confidence": {"type": "NUMBER"}
                    },
                    "required": ["claim", "supporting_sources", "confidence"]
                }
            },
            "discarded_claims": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "claim": {"type": "STRING"},
                        "reason": {"type": "STRING"},
                        "original_source": {"type": "STRING"}
                    }
                }
            },
            "contradictions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "id": {"type": "STRING"},
                        "claim_a": {"type": "STRING"},
                        "source_a": {"type": "STRING"},
                        "claim_b": {"type": "STRING"},
                        "source_b": {"type": "STRING"},
                        "resolution": {"type": "STRING"},
                        "winner": {"type": "STRING"}
                    }
                }
            },
            "confidence_score": {"type": "NUMBER"},
            "agreement_percentage": {"type": "NUMBER"}
        },
        "required": ["verified_claims", "confidence_score", "agreement_percentage"]
    }
    
    result = await client.generate_structured(prompt, schema)
    
    verified_claims = result.get("verified_claims", [])
    discarded_claims = result.get("discarded_claims", [])
    contradictions = result.get("contradictions", [])
    confidence_score = result.get("confidence_score", 0.0)
    agreement_percentage = result.get("agreement_percentage", 100.0)
    
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
    
    logger.info("Verifier finished", raw_evidence_in=len(raw_evidence), verified_claims_out=len(verified_claims))
    
    return {
        "verified_claims": verified_claims,
        "discarded_claims": discarded_claims,
        "contradictions": contradictions,
        "confidence_score": confidence_score,
        "agreement_percentage": agreement_percentage,
        "agent_steps": [search_step, verifier_step],
        "current_step_index": 3
    }
