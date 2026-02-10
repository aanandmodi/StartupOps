"""State definition for the agent graph."""
from typing import TypedDict, Annotated, List, Dict, Any, Optional
import operator

class AgentState(TypedDict):
    """
    Represents the state of the agent workflow.
    
    Attributes:
        startup_id: ID of the startup being processed
        goal: The main goal of the startup
        domain: The business domain
        team_size: Size of the team
        
        # Agent Outputs
        product_output: Output from the Product Agent
        tech_output: Output from the Tech Agent
        marketing_output: Output from the Marketing Agent
        finance_output: Output from the Finance Agent
        advisor_output: Output from the Advisor Agent
        
        # Accumulated Logs (optional, for debugging/tracing)
        logs: Annotated[List[str], operator.add]
    """
    startup_id: int
    goal: str
    domain: str
    team_size: int
    
    product_output: Dict[str, Any]
    tech_output: Dict[str, Any]
    marketing_output: Dict[str, Any]
    finance_output: Dict[str, Any]
    advisor_output: Dict[str, Any]
    
    # User Context
    user_id: Optional[int]
    user_tier: str
    
    logs: Annotated[List[str], operator.add]
