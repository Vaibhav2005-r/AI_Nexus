"""Diagnostic: print the exact JSON schemas Pydantic generates for our LLM models."""
import json
import sys
sys.path.append(".")

from app.domain.llm_models import (
    PlannerResponse, DecomposerResponse, VerifierResponse, SynthesizerResponse
)

for name, model in [
    ("PlannerResponse", PlannerResponse),
    ("DecomposerResponse", DecomposerResponse),
    ("VerifierResponse", VerifierResponse),
    ("SynthesizerResponse", SynthesizerResponse),
]:
    schema = model.model_json_schema()
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    print(json.dumps(schema, indent=2))
