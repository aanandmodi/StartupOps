"""Tech Agent - GPT-4.1.

Responsible for:
- Tech stack recommendations
- Task dependency graphs
- Technical risk assessment
"""
from typing import Any

from app.agents.base import BaseAgent
from app.config import get_settings

settings = get_settings()


class TechAgent(BaseAgent):
    """Tech Agent using GPT-4.1 for technical planning."""
    
    name = "tech"
    model = settings.tech_agent_model
    
    @property
    def system_prompt(self) -> str:
        return """You are the Tech Co-Founder AI for a startup.
Your role is to provide technical guidance based on product requirements.

RESPONSIBILITIES:
1. Recommend appropriate tech stack
2. Create task dependency graphs
3. Identify technical risks and blockers
4. Estimate technical complexity

INPUT: You will receive product tasks and MVP features.

OUTPUT FORMAT - You MUST return ONLY valid JSON with this exact structure:
{
    "tech_stack": {
        "frontend": ["technology1", "technology2"],
        "backend": ["technology1", "technology2"],
        "database": ["technology1"],
        "infrastructure": ["technology1", "technology2"],
        "rationale": "Brief explanation of choices"
    },
    "tasks": [
        {
            "title": "Technical task name",
            "description": "What needs to be implemented",
            "category": "tech",
            "priority": 1-5,
            "estimated_days": number,
            "dependencies": [list of task IDs this depends on]
        }
    ],
    "dependency_graph": {
        "nodes": [{"id": "task_id", "label": "Task name"}],
        "edges": [{"from": "task_id_1", "to": "task_id_2"}]
    },
    "technical_risks": [
        {
            "risk": "Risk description",
            "severity": "low|medium|high|critical",
            "mitigation": "How to address"
        }
    ]
}

RULES:
- Output ONLY JSON, no markdown
- Dependencies should reference other task IDs
- Consider scalability in recommendations
- Be practical for the team size"""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        return {
            "tech_stack": {
                "frontend": ["React", "TypeScript", "TailwindCSS"],
                "backend": ["Python", "FastAPI", "SQLAlchemy"],
                "database": ["PostgreSQL", "Redis"],
                "infrastructure": ["Docker", "AWS", "GitHub Actions"],
                "rationale": "Modern, scalable stack suitable for rapid MVP development"
            },
            "tasks": [
                {
                    "title": "Set up development environment",
                    "description": "Configure local dev environment with Docker",
                    "category": "tech",
                    "priority": 5,
                    "estimated_days": 1,
                    "dependencies": []
                },
                {
                    "title": "Design database schema",
                    "description": "Create ERD and implement migrations",
                    "category": "tech",
                    "priority": 5,
                    "estimated_days": 2,
                    "dependencies": [1]
                },
                {
                    "title": "Build REST API endpoints",
                    "description": "Implement core API with authentication",
                    "category": "tech",
                    "priority": 5,
                    "estimated_days": 7,
                    "dependencies": [2]
                },
                {
                    "title": "Implement frontend components",
                    "description": "Build React components for MVP features",
                    "category": "tech",
                    "priority": 4,
                    "estimated_days": 10,
                    "dependencies": [3]
                },
                {
                    "title": "Set up CI/CD pipeline",
                    "description": "Configure automated testing and deployment",
                    "category": "tech",
                    "priority": 3,
                    "estimated_days": 2,
                    "dependencies": [1]
                },
                {
                    "title": "Implement monitoring and logging",
                    "description": "Set up observability stack",
                    "category": "tech",
                    "priority": 3,
                    "estimated_days": 2,
                    "dependencies": [3]
                }
            ],
            "dependency_graph": {
                "nodes": [
                    {"id": "1", "label": "Dev Environment Setup"},
                    {"id": "2", "label": "Database Schema"},
                    {"id": "3", "label": "REST API"},
                    {"id": "4", "label": "Frontend Components"},
                    {"id": "5", "label": "CI/CD Pipeline"},
                    {"id": "6", "label": "Monitoring"}
                ],
                "edges": [
                    {"from": "1", "to": "2"},
                    {"from": "2", "to": "3"},
                    {"from": "3", "to": "4"},
                    {"from": "1", "to": "5"},
                    {"from": "3", "to": "6"}
                ]
            },
            "technical_risks": [
                {
                    "risk": "Database scaling issues with growth",
                    "severity": "medium",
                    "mitigation": "Design with horizontal scaling in mind from start"
                },
                {
                    "risk": "API performance bottlenecks",
                    "severity": "medium",
                    "mitigation": "Implement caching layer and optimize queries"
                },
                {
                    "risk": "Security vulnerabilities",
                    "severity": "high",
                    "mitigation": "Regular security audits and follow OWASP guidelines"
                }
            ]
        }
