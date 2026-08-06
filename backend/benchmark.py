import asyncio
import time
import json
import statistics
import os
import sys

# Ensure we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agents.graph import build_research_graph
from app.infrastructure.llm.factory import LLMFactory

async def run_benchmark():
    print("Starting AI Nexus Benchmark...")
    print("LLM Provider:", os.getenv("LLM_PROVIDER", "nvidia"))
    print("Fallback:", os.getenv("LLM_FALLBACK_PROVIDER", "gemini"))
    print("Verifier Max Sources:", os.getenv("VERIFIER_MAX_SOURCES", "10"))
    
    graph = build_research_graph()
    
    queries = [
        "Analyze the correlation between extreme weather events and infrastructure degradation in India high-risk zones.",
        "What are the long-term economic impacts of remote work on commercial real estate in tier 1 US cities?",
        "Explain the recent advancements in solid-state batteries for electric vehicles and their market readiness.",
        "Compare the effectiveness of carbon taxation vs cap-and-trade systems in reducing industrial emissions.",
        "Assess the current state and future potential of CRISPR-Cas9 in treating genetic disorders."
    ]
    
    results = []
    
    for i, query in enumerate(queries):
        print(f"\n--- Run {i+1}/5 ---")
        print(f"Query: {query}")
        
        state = {"query": query}
        start_time = time.time()
        
        try:
            final_state = await graph.ainvoke(state)
            total_duration = time.time() - start_time
            
            steps = final_state.get("agent_steps", [])
            
            # Extract latencies
            latencies = {}
            for step in steps:
                if step["type"] == "planner":
                    latencies["Planner"] = step.get("duration_ms", 0)
                elif step["type"] == "decomposer":
                    latencies["Decomposer"] = step.get("duration_ms", 0)
                elif step["type"] == "search": # We grouped them
                    latencies["Search"] = step.get("duration_ms", 0)
                elif step["type"] == "verifier":
                    latencies["Verifier"] = step.get("duration_ms", 0)
                    latencies["Claims_Verified"] = step.get("details", {}).get("claimsVerified", 0)
                    latencies["Hallucinations"] = step.get("details", {}).get("hallucinationsDiscarded", 0)
                elif step["type"] == "synthesizer":
                    latencies["Synthesizer"] = step.get("duration_ms", 0)
            
            latencies["Total"] = int(total_duration * 1000)
            results.append(latencies)
            print(f"Success! Total Time: {latencies['Total']} ms")
            print(f"Latencies: {latencies}")
            
        except Exception as e:
            print(f"Run {i+1} failed: {str(e)}")
            import traceback
            traceback.print_exc()

    print("\n--- Benchmark Complete ---")
    print(json.dumps(results, indent=2))
    
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_benchmark())
