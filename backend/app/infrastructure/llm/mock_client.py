import re
from typing import Type, TypeVar
from pydantic import BaseModel
from app.infrastructure.llm.base import BaseLLMClient
from app.domain.llm_models import PlannerResponse, DecomposerResponse, VerifierResponse, SynthesizerResponse, SubQuery, VerifiedClaim, CitationModel

T = TypeVar('T', bound=BaseModel)

class MockClient(BaseLLMClient):
    async def generate_structured(self, prompt: str, schema_model: Type[T]) -> T:
        import asyncio
        await asyncio.sleep(1) # simulate network latency
        
        topic = "Solid State Batteries"
        match = re.search(r'(?i)query:\s*"(.*?)"', prompt)
        if match:
            topic = match.group(1).title()
            
        if schema_model == PlannerResponse:
            return PlannerResponse(
                strategy=[
                    f"Analyze recent breakthroughs in {topic}.",
                    f"Compare key metrics and historical developments of {topic}.",
                    f"Identify key challenges and future timelines for {topic}."
                ],
                domain_constraints=[
                    f"Focus on peer-reviewed research regarding {topic}.",
                    "Include data from top tier sources."
                ]
            )
            
        elif schema_model == DecomposerResponse:
            return DecomposerResponse(
                sub_queries=[
                    SubQuery(query=f"{topic} latest advancements 2024", target_agent="web"),
                    SubQuery(query=f"{topic} fundamental constraints and analysis", target_agent="academic")
                ]
            )
            
        elif schema_model == VerifierResponse:
            return VerifierResponse(
                verified_claims=[
                    VerifiedClaim(
                        claim=f"{topic} offers significant advancements over traditional methods according to recent empirical studies.",
                        supporting_sources=["https://example.com/source1", "arxiv.org/abs/example"],
                        evidence_snippets=[f"Research shows {topic} prevents common failures..."],
                        confidence=0.95
                    )
                ],
                discarded_claims=[],
                contradictions=[],
                confidence_score=0.9,
                agreement_percentage=100.0
            )
            
        elif schema_model == SynthesizerResponse:
            report_text = f"# {topic} Research Report\n\n{topic} represents a significant leap forward in this domain. By utilizing new methodologies, it dramatically reduces risks and improves efficiency [1].\n\n## Key Advancements\nRecent studies indicate a theoretical improvement of up to 50% compared to conventional approaches [2]."
            
            if "=== PAST RESEARCH ON THIS TOPIC ===" in prompt:
                report_text += f"\n\n## New Developments & Delta Analysis\n### New Papers\nSeveral new papers on {topic} have been published since the last research session.\n### Emerging Trends\nThere is a massive influx of capital towards {topic} commercialization."
                
            return SynthesizerResponse(
                report_markdown=report_text,
                citations=[
                    CitationModel(
                        id=1,
                        title=f"Safety improvements in {topic}",
                        url="https://example.com/safety",
                        domain="example.com",
                        snippet=f"{topic} prevents catastrophic failures...",
                        credibility_score=0.9,
                        credibility_label="High"
                    ),
                    CitationModel(
                        id=2,
                        title=f"Theoretical limits of {topic}",
                        url="https://arxiv.org/abs/example",
                        domain="arxiv.org",
                        snippet="Theoretical models predict 50% increase...",
                        credibility_score=0.95,
                        credibility_label="High"
                    )
                ],
                key_takeaways=[
                    f"{topic} improves safety and reliability.",
                    f"It offers higher performance metrics.",
                    "Scaling at production levels remains a hurdle."
                ],
                chart_data=None
            )
            
        raise ValueError(f"Unknown schema model requested in MockClient: {schema_model}")
        
    async def health_check(self) -> bool:
        return True
