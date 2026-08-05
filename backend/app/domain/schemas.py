from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from app.domain.models import ResearchSession

class ResearchRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    depth: Literal["Fast", "Deep", "Exhaustive"] = "Deep"
    deep_web_enabled: bool = Field(False, alias="deepWebEnabled")
    sources_filter: List[str] = Field(default_factory=lambda: ["Google Web", "ArXiv Papers"], alias="sourcesFilter")
    domain_mode: Literal["Academic", "Business", "Healthcare", "Legal", "Technology", "General"] = Field("General", alias="domainMode")

class FollowUpRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=1000)

class SessionListResponse(BaseModel):
    sessions: List[ResearchSession]
    total: int

class GlobalStatsResponse(BaseModel):
    total_sessions: int
    total_sources_analyzed: int
    total_facts_verified: int
    average_credibility: float
