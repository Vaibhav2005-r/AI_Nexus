from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# Planner
class PlannerResponse(BaseModel):
    strategy: List[str]
    domain_constraints: List[str]

# Decomposer
class SubQuery(BaseModel):
    query: str
    target_agent: str

class DecomposerResponse(BaseModel):
    sub_queries: List[SubQuery]

# Verifier
class VerifiedClaim(BaseModel):
    claim: str
    supporting_sources: List[str]
    evidence_snippets: Optional[List[str]] = None
    confidence: float

class DiscardedClaim(BaseModel):
    claim: str
    reason: str
    original_source: str

class Contradiction(BaseModel):
    id: str
    claim_a: str
    source_a: str
    claim_b: str
    source_b: str
    resolution: str
    winner: str

class VerifierResponse(BaseModel):
    verified_claims: List[VerifiedClaim]
    discarded_claims: Optional[List[DiscardedClaim]] = None
    contradictions: Optional[List[Contradiction]] = None
    confidence_score: float
    agreement_percentage: float

# Synthesizer
class CitationModel(BaseModel):
    id: int
    title: str
    url: str
    domain: str
    snippet: str
    credibility_score: float
    credibility_label: str
    publish_date: Optional[str] = None
    author: Optional[str] = None

class ChartDataLine(BaseModel):
    key: str
    color: str
    name: str

class ChartDataPoint(BaseModel):
    pass # Flexible schema based on chart configuration

class ChartDataModel(BaseModel):
    type: str
    title: str
    description: str
    xAxisKey: str
    linesOrBars: List[ChartDataLine]
    data: List[Dict[str, Any]]

class SynthesizerResponse(BaseModel):
    report_markdown: str
    citations: List[CitationModel]
    key_takeaways: List[str]
    chart_data: Optional[ChartDataModel] = None
