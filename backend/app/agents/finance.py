"""Finance & Operations Agent - GPT-4o-mini.

Responsible for:
- Budget allocation
- Burn rate calculation
- Runway prediction
"""
from typing import Any

from app.agents.base import BaseAgent
from app.config import get_settings

settings = get_settings()


class FinanceAgent(BaseAgent):
    """Finance Agent using GPT-4o-mini for financial planning."""
    
    name = "finance"
    model = settings.finance_agent_model
    
    @property
    def system_prompt(self) -> str:
        return """You are the Finance & Operations Co-Founder AI for a startup.
Your role is to manage financial planning and operational efficiency.

RESPONSIBILITIES:
1. Create budget allocations
2. Calculate burn rate
3. Predict runway
4. Identify cost optimization opportunities

INPUT: You will receive tasks, timeline, and team size information.

OUTPUT FORMAT - You MUST return ONLY valid JSON with this exact structure:
{
    "budget_allocation": {
        "total_estimated": number,
        "currency": "USD",
        "breakdown": [
            {
                "category": "engineering|marketing|operations|infrastructure|other",
                "amount": number,
                "percentage": number
            }
        ]
    },
    "burn_rate": {
        "monthly": number,
        "weekly": number,
        "primary_costs": ["cost1", "cost2"]
    },
    "runway": {
        "months": number,
        "risk_level": "low|medium|high",
        "recommendation": "Brief advice"
    },
    "kpis": [
        {
            "name": "Financial KPI name",
            "type": "finance",
            "target_value": number,
            "unit": "dollars|percent|ratio",
            "timeframe_days": number
        }
    ],
    "tasks": [
        {
            "title": "Operations task",
            "description": "What needs to be done",
            "category": "finance",
            "priority": 1-5,
            "estimated_days": number,
            "dependencies": []
        }
    ],
    "cost_optimizations": [
        {
            "area": "Where to optimize",
            "potential_savings": number,
            "recommendation": "How to save"
        }
    ]
}

RULES:
- Output ONLY JSON, no markdown
- Be conservative with estimates
- Consider startup stage constraints
- Account for hidden costs (tools, services, etc.)"""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        team_size = input_data.get("team_size", 3)
        timeline_days = input_data.get("timeline_days", 60)
        
        monthly_salary_per_person = 8000
        monthly_salary_total = team_size * monthly_salary_per_person
        
        return {
            "budget_allocation": {
                "total_estimated": monthly_salary_total * 3 + 15000,
                "currency": "USD",
                "breakdown": [
                    {
                        "category": "engineering",
                        "amount": monthly_salary_total * 3 * 0.6,
                        "percentage": 55
                    },
                    {
                        "category": "marketing",
                        "amount": 5000,
                        "percentage": 15
                    },
                    {
                        "category": "infrastructure",
                        "amount": 3000,
                        "percentage": 10
                    },
                    {
                        "category": "operations",
                        "amount": 4000,
                        "percentage": 12
                    },
                    {
                        "category": "other",
                        "amount": 3000,
                        "percentage": 8
                    }
                ]
            },
            "burn_rate": {
                "monthly": monthly_salary_total + 5000,
                "weekly": (monthly_salary_total + 5000) / 4,
                "primary_costs": [
                    "Salaries and contractor fees",
                    "Cloud infrastructure (AWS/GCP)",
                    "SaaS tools and subscriptions",
                    "Marketing spend"
                ]
            },
            "runway": {
                "months": 6,
                "risk_level": "medium",
                "recommendation": "Secure seed funding within 3 months or focus on revenue generation"
            },
            "kpis": [
                {
                    "name": "Monthly Burn Rate",
                    "type": "finance",
                    "target_value": monthly_salary_total + 5000,
                    "unit": "dollars",
                    "timeframe_days": 30
                },
                {
                    "name": "Cost per Feature",
                    "type": "finance",
                    "target_value": 5000,
                    "unit": "dollars",
                    "timeframe_days": 30
                },
                {
                    "name": "Runway Months",
                    "type": "finance",
                    "target_value": 6,
                    "unit": "months",
                    "timeframe_days": 90
                }
            ],
            "tasks": [
                {
                    "title": "Set up financial tracking",
                    "description": "Implement expense tracking and reporting",
                    "category": "finance",
                    "priority": 5,
                    "estimated_days": 2,
                    "dependencies": []
                },
                {
                    "title": "Create investor pitch deck",
                    "description": "Prepare materials for fundraising",
                    "category": "finance",
                    "priority": 4,
                    "estimated_days": 5,
                    "dependencies": []
                },
                {
                    "title": "Establish vendor relationships",
                    "description": "Negotiate contracts with key service providers",
                    "category": "finance",
                    "priority": 3,
                    "estimated_days": 3,
                    "dependencies": []
                }
            ],
            "cost_optimizations": [
                {
                    "area": "Cloud Infrastructure",
                    "potential_savings": 500,
                    "recommendation": "Use reserved instances and auto-scaling"
                },
                {
                    "area": "SaaS Tools",
                    "potential_savings": 300,
                    "recommendation": "Consolidate tools and use startup programs"
                }
            ]
        }
