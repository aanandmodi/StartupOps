"""LangGraph workflow definition."""
import logging
import asyncio
from typing import Dict, Any

from langgraph.graph import StateGraph, END

from app.agents.state import AgentState
from app.agents.product import ProductAgent
from app.agents.tech import TechAgent
from app.agents.marketing import MarketingAgent
from app.agents.finance import FinanceAgent
from app.agents.advisor import AdvisorAgent

logger = logging.getLogger(__name__)

# Initialize Agents
product_agent = ProductAgent()
tech_agent = TechAgent()
marketing_agent = MarketingAgent()
finance_agent = FinanceAgent()
advisor_agent = AdvisorAgent()

async def product_node(state: AgentState) -> Dict[str, Any]:
    """Execute Product Agent."""
    logger.info("Graph: Running Product Node")
    start_input = {
        "goal": state["goal"],
        "domain": state["domain"],
        "team_size": state["team_size"]
    }
    output = await product_agent.run(start_input)
    await asyncio.sleep(10)  # Sequential delay to prevent rate limits
    return {"product_output": output, "logs": [f"Product Agent finished: {output.get('title', 'done')}"]}

async def tech_node(state: AgentState) -> Dict[str, Any]:
    """Execute Tech Agent."""
    logger.info("Graph: Running Tech Node")
    input_data = {
        "product_output": state["product_output"],
        "team_size": state["team_size"]
    }
    output = await tech_agent.run(input_data)
    await asyncio.sleep(10)  # Sequential delay to prevent rate limits
    return {"tech_output": output, "logs": ["Tech Agent finished"]}

async def marketing_node(state: AgentState) -> Dict[str, Any]:
    """Execute Marketing Agent."""
    logger.info("Graph: Running Marketing Node")
    # Extract timeline from product output or default
    timeline = state["product_output"].get("recommended_launch_timeline_days", 60)
    input_data = {
        "product_output": state["product_output"],
        "timeline_days": timeline,
        "domain": state["domain"]
    }
    output = await marketing_agent.run(input_data)
    await asyncio.sleep(10)  # Sequential delay to prevent rate limits
    return {"marketing_output": output, "logs": ["Marketing Agent finished"]}

async def finance_node(state: AgentState) -> Dict[str, Any]:
    """Execute Finance Agent."""
    logger.info("Graph: Running Finance Node")
    timeline = state["product_output"].get("recommended_launch_timeline_days", 60)
    tasks = state["product_output"].get("tasks", []) + state["tech_output"].get("tasks", [])
    input_data = {
        "tasks": tasks,
        "timeline_days": timeline,
        "team_size": state["team_size"]
    }
    output = await finance_agent.run(input_data)
    await asyncio.sleep(10)  # Sequential delay to prevent rate limits
    return {"finance_output": output, "logs": ["Finance Agent finished"]}

async def advisor_node(state: AgentState) -> Dict[str, Any]:
    """Execute Advisor Agent."""
    logger.info("Graph: Running Advisor Node")
    input_data = {
        "product_output": state["product_output"],
        "tech_output": state["tech_output"],
        "marketing_output": state["marketing_output"],
        "finance_output": state["finance_output"],
        "startup_goal": state["goal"],
        "team_size": state["team_size"]
    }
    output = await advisor_agent.run(input_data)
    return {"advisor_output": output, "logs": ["Advisor Agent finished"]}

# Create Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("product", product_node)
workflow.add_node("tech", tech_node)
workflow.add_node("marketing", marketing_node)
workflow.add_node("finance", finance_node)
workflow.add_node("advisor", advisor_node)

# Add Edges - FULLY SEQUENTIAL to avoid rate limits
# Product -> Tech -> Marketing -> Finance -> Advisor -> END
workflow.add_edge("product", "tech")
workflow.add_edge("tech", "marketing")
workflow.add_edge("marketing", "finance")
workflow.add_edge("finance", "advisor")
workflow.add_edge("advisor", END)

# Set Entry Point
workflow.set_entry_point("product")

# Compile
agent_graph = workflow.compile()

