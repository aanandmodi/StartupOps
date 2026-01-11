"""Advisor / Decision Agent - Claude Instant.

Responsible for:
- Execution health scoring
- Drift detection
- Alert generation
- Actionable recommendations
"""
from typing import Any

from app.agents.base import BaseAgent
from app.config import get_settings

settings = get_settings()


class AdvisorAgent(BaseAgent):
    """Advisor Agent using Claude Instant for strategic oversight."""
    
    name = "advisor"
    model = settings.advisor_agent_model
    
    @property
    def system_prompt(self) -> str:
        return """You are the Advisor / Decision AI for a startup.
Your role is to provide strategic oversight by analyzing all agent outputs.

RESPONSIBILITIES:
1. Calculate execution health score (0-100)
2. Detect drift from plans
3. Generate alerts for risks
4. Provide actionable recommendations

INPUT: You will receive outputs from Product, Tech, Marketing, and Finance agents,
plus current task statuses and KPIs.

OUTPUT FORMAT - You MUST return ONLY valid JSON with this exact structure:
{
    "execution_health": {
        "score": number (0-100),
        "status": "healthy|at_risk|critical",
        "summary": "Brief health assessment"
    },
    "drift_analysis": {
        "detected": boolean,
        "areas": [
            {
                "area": "product|tech|marketing|finance|timeline",
                "severity": "low|medium|high",
                "description": "What's drifting",
                "impact": "Potential consequences"
            }
        ]
    },
    "alerts": [
        {
            "severity": "info|warning|critical",
            "message": "Alert message",
            "recommended_action": "What to do"
        }
    ],
    "recommendations": [
        {
            "priority": 1-5,
            "area": "product|tech|marketing|finance|operations",
            "recommendation": "Specific action to take",
            "expected_impact": "What this will improve"
        }
    ],
    "key_decisions_needed": [
        {
            "decision": "What needs to be decided",
            "deadline_days": number,
            "options": ["option1", "option2"]
        }
    ]
}

RULES:
- Output ONLY JSON, no markdown, no code blocks, no intro/outro text.
- Start the output with { and end with }.
- Be direct and actionable
- Prioritize by urgency and impact
- Consider resource constraints in recommendations"""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        # Analyze task statuses if available
        tasks = input_data.get("tasks", [])
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        total = len(tasks) if tasks else 10
        
        # Calculate base health score
        if total > 0:
            completion_rate = (completed / total) * 100
            health_score = min(85, 50 + completion_rate * 0.5)
        else:
            health_score = 75
        
        return {
            "execution_health": {
                "score": round(health_score),
                "status": "healthy" if health_score >= 70 else ("at_risk" if health_score >= 40 else "critical"),
                "summary": "Startup is on track with minor areas needing attention"
            },
            "drift_analysis": {
                "detected": True,
                "areas": [
                    {
                        "area": "timeline",
                        "severity": "low",
                        "description": "Marketing tasks may take longer than estimated",
                        "impact": "Possible 1-week delay in launch"
                    },
                    {
                        "area": "finance",
                        "severity": "medium",
                        "description": "Burn rate slightly higher than projected",
                        "impact": "May reduce runway by 2 weeks"
                    }
                ]
            },
            "alerts": [
                {
                    "severity": "info",
                    "message": "Consider starting user research earlier",
                    "recommended_action": "Schedule 5 user interviews this week"
                },
                {
                    "severity": "warning",
                    "message": "Technical dependencies creating bottleneck",
                    "recommended_action": "Parallelize frontend and backend work where possible"
                },
                {
                    "severity": "info",
                    "message": "Marketing content calendar not yet started",
                    "recommended_action": "Begin content creation for launch preparation"
                }
            ],
            "recommendations": [
                {
                    "priority": 5,
                    "area": "tech",
                    "recommendation": "Set up automated testing early to prevent technical debt",
                    "expected_impact": "Reduce bugs by 40% and speed up iterations"
                },
                {
                    "priority": 4,
                    "area": "marketing",
                    "recommendation": "Start building email list before product launch",
                    "expected_impact": "Have 500+ potential users at launch"
                },
                {
                    "priority": 4,
                    "area": "product",
                    "recommendation": "Define success metrics for MVP features",
                    "expected_impact": "Clear go/no-go criteria for each feature"
                },
                {
                    "priority": 3,
                    "area": "finance",
                    "recommendation": "Apply to startup programs for free credits",
                    "expected_impact": "Save $2,000-5,000 on infrastructure costs"
                }
            ],
            "key_decisions_needed": [
                {
                    "decision": "Choose primary launch platform",
                    "deadline_days": 14,
                    "options": ["Product Hunt", "Hacker News", "Direct outreach"]
                },
                {
                    "decision": "Finalize pricing strategy",
                    "deadline_days": 21,
                    "options": ["Freemium", "Free trial", "Paid only"]
                }
            ]
        }
