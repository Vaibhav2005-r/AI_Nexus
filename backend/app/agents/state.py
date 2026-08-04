from typing import TypedDict, Annotated, Optional, Literal, List, Dict, Any
from operator import add

class SubQueryState(TypedDict):
    id: str
    query: str
    target_agent: Literal["web", "academic", "news", "vector"]
    status: Literal["pending", "running", "completed", "failed"]
    results_count: int
    sources_found: List[str]

class EvidenceItem(TypedDict):
    source_agent: str
    title: str
    url: str
    domain: str
    snippet: str
    raw_content: Optional[str]
    publish_date: Optional[str]
    author: Optional[str]
    relevance_score: float
    metadata: Dict[str, Any]

class VerifiedClaim(TypedDict):
    claim: str
    supporting_sources: List[str]
    evidence_snippets: List[str]
    confidence: float

class DiscardedClaim(TypedDict):
    claim: str
    reason: str
    original_source: str

class ContradictionState(TypedDict):
    id: str
    claim_a: str
    source_a: str
    claim_b: str
    source_b: str
    resolution: str
    winner: Literal["a", "b", "neither"]

class AgentStepState(TypedDict):
    id: str
    type: str
    title: str
    description: str
    status: str
    timestamp: Optional[str]
    duration_ms: Optional[int]
    sub_queries: Optional[List[SubQueryState]]
    details: Optional[Dict[str, Any]]

class ResearchState(TypedDict):
    # Input
    query: str
    depth: Literal["Fast", "Deep", "Exhaustive"]
    sources_filter: List[str]
    session_id: str
    domain_mode: str
    
    # Planner output
    strategy: List[str]
    domain_constraints: List[str]
    
    # Decomposer output
    sub_queries: List[SubQueryState]
    
    # Search output (reducer: append from parallel agents)
    raw_evidence: Annotated[List[EvidenceItem], add]
    
    # Verifier output
    verified_claims: List[VerifiedClaim]
    discarded_claims: List[DiscardedClaim]
    contradictions: List[ContradictionState]
    confidence_score: float
    agreement_percentage: float
    
    # Report output
    report_markdown: str
    citations: List[Dict[str, Any]]
    key_takeaways: List[str]
    chart_data: Optional[Dict[str, Any]]
    
    # Trace (for SSE streaming)
    agent_steps: Annotated[List[AgentStepState], add]
    current_step_index: int
    errors: List[str]
    metrics: Dict[str, Any]
