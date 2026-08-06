import asyncio
import time
import json
import statistics
import os
import sys

# Ensure we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agents.graph import app_graph as graph
from app.infrastructure.llm.factory import LLMFactory
from app.config import get_settings

settings = get_settings()

QUERIES = [
    "Analyze the correlation between extreme weather events and infrastructure degradation in India high-risk zones.",
    "What are the long-term economic impacts of remote work on commercial real estate in tier 1 US cities?",
    "Explain the recent advancements in solid-state batteries for electric vehicles and their market readiness.",
    "Compare the effectiveness of carbon taxation vs cap-and-trade systems in reducing industrial emissions.",
    "Assess the current state and future potential of CRISPR-Cas9 in treating genetic disorders."
]

async def run_single_research(query: str, run_id: str):
    state = {
        "query": query,
        "depth": "Deep",
        "domain_mode": "General",
        "sources_filter": ["Google Web", "ArXiv Papers"]
    }
    
    start_time = time.time()
    try:
        final_state = await graph.ainvoke(state)
        total_duration = time.time() - start_time
        
        steps = final_state.get("agent_steps", [])
        
        latencies = {}
        for step in steps:
            if step["type"] == "planner":
                latencies["Planner"] = step.get("duration_ms", 0)
            elif step["type"] == "decomposer":
                latencies["Decomposer"] = step.get("duration_ms", 0)
            elif step["type"] == "search": 
                latencies["Search"] = step.get("duration_ms", 0)
            elif step["type"] == "verifier":
                latencies["Verifier"] = step.get("duration_ms", 0)
                latencies["Claims_Verified"] = step.get("details", {}).get("claimsVerified", 0)
                latencies["Hallucinations"] = step.get("details", {}).get("hallucinationsDiscarded", 0)
            elif step["type"] == "synthesizer":
                latencies["Synthesizer"] = step.get("duration_ms", 0)
        
        latencies["Total"] = int(total_duration * 1000)
        return {"run_id": run_id, "success": True, "latencies": latencies}
    except Exception as e:
        return {"run_id": run_id, "success": False, "error": str(e)}

async def run_sequential_benchmarks():
    print("Starting Sequential Benchmarks (n=3)...")
    results = []
    
    test_queries = QUERIES[:3]
    
    for i, query in enumerate(test_queries):
        print(f"--- Sequential Run {i+1}/3 ---")
        res = await run_single_research(query, f"seq_{i+1}")
        if res["success"]:
            print(f"Success! Total Time: {res['latencies']['Total']} ms")
        else:
            print(f"Failed! Error: {res['error']}")
        results.append(res)
        
    return results

async def run_concurrent_load_test():
    print("\nStarting Concurrent Load Test (n=2)...")
    tasks = []
    for i, query in enumerate(QUERIES[:2]):
        print(f"Queuing Concurrent Run {i+1}/2...")
        tasks.append(run_single_research(query, f"conc_{i+1}"))
        
    results = await asyncio.gather(*tasks)
    
    for res in results:
        if res["success"]:
            print(f"Concurrent Run {res['run_id']} Success! Time: {res['latencies']['Total']} ms")
        else:
            print(f"Concurrent Run {res['run_id']} Failed! Error: {res['error']}")
            
    return results

async def main():
    print(f"LLM Provider: {settings.LLM_PROVIDER}")
    print(f"LLM Timeout: {settings.LLM_TIMEOUT}")
    print(f"Gemini Model: {settings.GEMINI_MODEL}")
    print(f"NVIDIA Model: {settings.LLM_MODEL}")
    print(f"Verifier Max Sources: {settings.VERIFIER_MAX_SOURCES}")
    
    seq_results = await run_sequential_benchmarks()
    conc_results = await run_concurrent_load_test()
    
    report = {
        "sequential": seq_results,
        "concurrent": conc_results
    }
    
    with open("load_test_results.json", "w") as f:
        json.dump(report, f, indent=2)
        
    print("\n✅ All tests complete! Results saved to load_test_results.json")

if __name__ == "__main__":
    asyncio.run(main())
