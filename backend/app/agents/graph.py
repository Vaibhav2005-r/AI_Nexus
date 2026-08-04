from langgraph.graph import StateGraph, END
from app.agents.state import ResearchState
from app.agents.nodes.planner import planner_node
from app.agents.nodes.decomposer import decomposer_node
from app.agents.nodes.web_search import web_search_node
from app.agents.nodes.academic_search import academic_search_node
from app.agents.nodes.verifier import verifier_node
from app.agents.nodes.synthesizer import synthesizer_node

# Create the graph
graph = StateGraph(ResearchState)

# Add nodes
graph.add_node("planner", planner_node)
graph.add_node("decomposer", decomposer_node)
graph.add_node("web_search", web_search_node)
graph.add_node("academic_search", academic_search_node)
graph.add_node("verifier", verifier_node)
graph.add_node("synthesizer", synthesizer_node)

# Define routing
def route_search(state: ResearchState) -> list[str]:
    # Fan out to both search agents unconditionally for Phase 1
    return ["web_search", "academic_search"]

# Add edges
graph.add_edge("planner", "decomposer")
graph.add_conditional_edges("decomposer", route_search, ["web_search", "academic_search"])
graph.add_edge(["web_search", "academic_search"], "verifier")
graph.add_edge("verifier", "synthesizer")
graph.add_edge("synthesizer", END)

# Set entry point
graph.set_entry_point("planner")

# Compile the graph
app_graph = graph.compile()
