from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal, Dict, Any
from app.domain.enums import StepStatus, AgentStepType, SessionStatus, CredibilityLabel

class SubQuery(BaseModel):
    id: str
    query: str
    status: StepStatus
    results_count: Optional[int] = Field(None, alias="resultsCount")
    sources_found: Optional[List[str]] = Field(None, alias="sourcesFound")
    
    model_config = ConfigDict(populate_by_name=True)

class StepDetails(BaseModel):
    strategy: Optional[List[str]] = None
    sources_scanned: Optional[int] = Field(None, alias="sourcesScanned")
    claims_verified: Optional[int] = Field(None, alias="claimsVerified")
    hallucinations_discarded: Optional[int] = Field(None, alias="hallucinationsDiscarded")
    confidence_score: Optional[float] = Field(None, alias="confidenceScore")
    logs: Optional[List[str]] = None

    model_config = ConfigDict(populate_by_name=True)

class AgentStep(BaseModel):
    id: str
    type: AgentStepType
    title: str
    description: str
    status: StepStatus
    timestamp: Optional[str] = None
    duration_ms: Optional[int] = Field(None, alias="durationMs")
    sub_queries: Optional[List[SubQuery]] = Field(None, alias="subQueries")
    details: Optional[StepDetails] = None

    model_config = ConfigDict(populate_by_name=True)

class SourceCitation(BaseModel):
    id: int
    title: str
    url: str
    domain: str
    favicon: Optional[str] = None
    snippet: str
    credibility_score: float = Field(alias="credibilityScore")
    credibility_label: CredibilityLabel = Field(alias="credibilityLabel")
    publish_date: Optional[str] = Field(None, alias="publishDate")
    author: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class ChartLineOrBar(BaseModel):
    key: str
    name: str
    color: str

class ResearchChartConfig(BaseModel):
    type: Literal["line", "bar", "area"]
    title: str
    description: str
    x_axis_key: str = Field(alias="xAxisKey")
    lines_or_bars: List[ChartLineOrBar] = Field(alias="linesOrBars")
    data: List[Dict[str, Any]]

    model_config = ConfigDict(populate_by_name=True)

class ResearchMetrics(BaseModel):
    total_time_seconds: float = Field(alias="totalTimeSeconds")
    sources_analyzed: int = Field(alias="sourcesAnalyzed")
    facts_verified: int = Field(alias="factsVerified")
    overall_credibility: float = Field(alias="overallCredibility")
    previous_credibility: Optional[float] = Field(None, alias="previousCredibility")

    model_config = ConfigDict(populate_by_name=True)

class ResearchSession(BaseModel):
    id: str
    title: str
    prompt: str
    created_at: str = Field(alias="createdAt")
    time_category: Literal["Today", "Previous 7 Days", "Older"] = Field(alias="timeCategory")
    depth: Literal["Fast", "Deep", "Exhaustive"]
    sources_filter: List[str] = Field(alias="sourcesFilter")
    deep_web_enabled: bool = Field(alias="deepWebEnabled")
    status: SessionStatus
    current_step_index: int = Field(alias="currentStepIndex")
    steps: List[AgentStep]
    report_markdown: Optional[str] = Field(None, alias="reportMarkdown")
    citations: List[SourceCitation] = Field(default_factory=list)
    chart_data: Optional[ResearchChartConfig] = Field(None, alias="chartData")
    key_takeaways: Optional[List[str]] = Field(None, alias="keyTakeaways")
    metrics: Optional[ResearchMetrics] = None
    contradictions: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(populate_by_name=True)
