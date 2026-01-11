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
            "dependencies": [list of task indices, e.g., [1, 2]]
        }
    ],
    "cost_optimizations": [
        {
            "area": "Where to optimize",
            "potential_savings": number,
            "recommendation": "How to save"
        }
    ],
    "headcount_assumptions": [
        {
            "role": "Role title",
            "count": number,
            "salary_monthly": number
        }
    ],
    "monthly_forecast": [
        {
            "month": 1,
            "revenue_projected": number,
            "expense_projected": number,
            "cash_balance": number
        }
    ]
}

RULES:
- Output ONLY JSON, no markdown
- Be conservative with estimates
- Consider startup stage constraints
- Account for hidden costs (tools, services, etc.)
- INCLUDE DOMAIN SPECIFICS: e.g., "GPU Cloud Costs" for AI, "Gas Fees/Audit" for Web3."""
    
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
            ],
            "headcount_assumptions": [
                {"role": "Founders", "count": 2, "salary_monthly": 0},
                {"role": "Senior Engineer", "count": 1, "salary_monthly": 12000},
                {"role": "Marketing Lead", "count": 1, "salary_monthly": 8000}
            ],
            "monthly_forecast": [
                {"month": 1, "revenue_projected": 0, "expense_projected": 25000, "cash_balance": 475000},
                {"month": 2, "revenue_projected": 1000, "expense_projected": 26000, "cash_balance": 450000},
                {"month": 3, "revenue_projected": 2500, "expense_projected": 27000, "cash_balance": 425500},
                {"month": 4, "revenue_projected": 5000, "expense_projected": 28000, "cash_balance": 402500},
                {"month": 5, "revenue_projected": 8000, "expense_projected": 30000, "cash_balance": 380500},
                {"month": 6, "revenue_projected": 12000, "expense_projected": 32000, "cash_balance": 360500}
            ]
        }

    def generate_budget_csv(self, data: dict[str, Any]) -> str:
        """Generate a CSV budget from the finance data."""
        budget = data.get("budget_allocation", {})
        breakdown = budget.get("breakdown", [])
        currency = budget.get("currency", "USD")
        headcount = data.get("headcount_assumptions", [])
        forecast = data.get("monthly_forecast", [])
        
        csv_content = f"1. BUDGET ALLOCATION\nCategory,Amount ({currency}),Percentage\n"
        for item in breakdown:
            csv_content += f"{item.get('category').title()},{item.get('amount')},{item.get('percentage')}%\n"
        csv_content += f"TOTAL,{budget.get('total_estimated')},100%\n\n"
        
        csv_content += "2. HEADCOUNT ASSUMPTIONS\nRole,Count,Monthly Salary\n"
        for role in headcount:
            csv_content += f"{role.get('role')},{role.get('count')},{role.get('salary_monthly')}\n"
        csv_content += "\n"
        
        csv_content += "3. 6-MONTH PROJECTED FORECAST\nMonth,Revenue,Expenses,Cash Balance\n"
        for m in forecast:
            csv_content += f"{m.get('month')},{m.get('revenue_projected')},{m.get('expense_projected')},{m.get('cash_balance')}\n"
        csv_content += "\n"
        
        burn_rate = data.get("burn_rate", {})
        csv_content += "4. BURN RATE METRICS\n"
        csv_content += f"Monthly Burn,{burn_rate.get('monthly')},\n"
        csv_content += f"Weekly Burn,{burn_rate.get('weekly')},\n"
        
        return csv_content
