"""Product Agent - Claude 3.5 Sonnet.

Responsible for:
- MVP task list generation
- Feature prioritization
- Timeline estimation
"""
from typing import Any

from app.agents.base import BaseAgent
from app.config import get_settings

settings = get_settings()


class ProductAgent(BaseAgent):
    """Product Agent using Claude 3.5 Sonnet for product planning."""
    
    name = "product"
    model = settings.product_agent_model
    
    @property
    def system_prompt(self) -> str:
        return """You are the Product Co-Founder AI for a startup.
Your role is to create actionable product plans based on the startup's goal and domain.

RESPONSIBILITIES:
1. Break down the startup goal into MVP features
2. Prioritize features based on value and complexity
3. Estimate development timelines
4. Identify product risks

OUTPUT FORMAT - You MUST return ONLY valid JSON with this exact structure:
{
    "mvp_features": [
        {
            "title": "Feature name",
            "description": "Brief description",
            "priority": 1-5 (5=highest),
            "complexity": "low|medium|high",
            "estimated_days": number
        }
    ],
    "tasks": [
        {
            "title": "Task name",
            "description": "What needs to be done",
            "category": "product",
            "priority": 1-5,
            "estimated_days": number,
            "dependencies": []
        }
    ],
    "product_risks": [
        {
            "risk": "Risk description",
            "mitigation": "How to address it"
        }
    ],
    "recommended_launch_timeline_days": number
}

RULES:
- Output ONLY JSON, no markdown, no explanations
- Be specific and actionable
- Consider team size in your estimates
- Focus on MVP - minimal viable product"""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        goal = input_data.get("goal", "Build a SaaS product")
        domain = input_data.get("domain", "Technology")
        team_size = input_data.get("team_size", 3)
        
        return {
            "mvp_features": [
                {
                    "title": "User Authentication",
                    "description": "Secure login and registration system",
                    "priority": 5,
                    "complexity": "medium",
                    "estimated_days": 5
                },
                {
                    "title": "Core Dashboard",
                    "description": f"Main interface for {domain} operations",
                    "priority": 5,
                    "complexity": "high",
                    "estimated_days": 10
                },
                {
                    "title": "Data Management",
                    "description": "CRUD operations for primary entities",
                    "priority": 4,
                    "complexity": "medium",
                    "estimated_days": 7
                },
                {
                    "title": "Reporting Module",
                    "description": "Basic analytics and reporting",
                    "priority": 3,
                    "complexity": "medium",
                    "estimated_days": 5
                }
            ],
            "tasks": [
                {
                    "title": "Define user personas and journey maps",
                    "description": "Create detailed user personas based on target market",
                    "category": "product",
                    "priority": 5,
                    "estimated_days": 2,
                    "dependencies": []
                },
                {
                    "title": "Create wireframes and mockups",
                    "description": "Design UI/UX for all MVP features",
                    "category": "product",
                    "priority": 5,
                    "estimated_days": 4,
                    "dependencies": []
                },
                {
                    "title": "Write product requirements document",
                    "description": "Detailed PRD for development team",
                    "category": "product",
                    "priority": 4,
                    "estimated_days": 3,
                    "dependencies": []
                },
                {
                    "title": "Set up user feedback channels",
                    "description": "Implement feedback collection mechanisms",
                    "category": "product",
                    "priority": 3,
                    "estimated_days": 2,
                    "dependencies": []
                }
            ],
            "product_risks": [
                {
                    "risk": "Feature creep during development",
                    "mitigation": "Strict MVP scope definition and regular reviews"
                },
                {
                    "risk": "User adoption challenges",
                    "mitigation": "Early user testing and iterative feedback loops"
                }
            ],
            "recommended_launch_timeline_days": max(30, 60 // team_size * 2)
        }
