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
            "dependencies": [list of task indices, e.g., [1, 2]]
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
- Be practical for the team size
- RECOMMEND SPECIFIC TOOLS: Do not say "Database", say "PostgreSQL" or "Supabase".
- If domain involves AI/Web3, specify relevant frameworks (e.g., LangChain, Solidity)."""
    
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

    def generate_architecture_md(self, data: dict[str, Any]) -> str:
        """Generate a detailed Architecture Document (Markdown)."""
        stack = data.get("tech_stack", {})
        tasks = data.get("tasks", [])
        risks = data.get("technical_risks", [])
        
        md = "# Technical Architecture & Stack Strategy\n\n"
        
        md += "## 1. High-Level Stack Overview\n"
        md += "| Component | Technologies | Rationale |\n"
        md += "| :--- | :--- | :--- |\n"
        md += f"| **Frontend** | {', '.join(stack.get('frontend', []))} | Modern, reactive UI |\n"
        md += f"| **Backend** | {', '.join(stack.get('backend', []))} | Scalable API layer |\n"
        md += f"| **Database** | {', '.join(stack.get('database', []))} | Data persistence |\n"
        md += f"| **DevOps** | {', '.join(stack.get('infrastructure', []))} | Deployment & CI/CD |\n"
        md += f"\n**Architecture Rationale:** {stack.get('rationale', 'N/A')}\n\n"
        
        md += "## 2. System Architecture Diagram\n"
        md += "```mermaid\n"
        md += "graph TD\n"
        md += "    User[User Client] --> CDN[CDN/Edge]\n"
        md += "    CDN --> FE[Frontend App]\n"
        md += "    FE --> API[API Gateway/LB]\n"
        md += "    API --> BE[Backend Service]\n"
        md += "    BE --> DB[(Database)]\n"
        md += "    BE --> Cache[(Redis Cache)]\n"
        md += "    BE --> Worker[Background Workers]\n"
        md += "```\n\n"
        
        md += "## 3. Database Schema Proposal\n"
        md += "- **Users Table**: `id, email, password_hash, role, created_at`\n"
        md += "- **Tenants/Orgs Table**: `id, name, subscription_tier, owner_id`\n"
        md += "- **Core Entity Table**: `id, org_id, data_payload, status, metadata`\n"
        md += "- **Analytics/Logs**: `id, event_type, payload, timestamp`\n\n"
        
        md += "## 4. API Endpoint Plan\n"
        md += "| Method | Endpoint | Description |\n"
        md += "| :--- | :--- | :--- |\n"
        md += "| POST | `/auth/register` | User registration |\n"
        md += "| POST | `/auth/login` | JWT Authentication |\n"
        md += "| GET | `/api/dashboard` | Main dashboard data aggregate |\n"
        md += "| POST | `/api/entity` | Create primary resource |\n\n"
        
        md += "## 5. Development Roadmap (Tech)\n"
        for task in tasks:
            md += f"- [ ] **{task.get('title')}** ({task.get('estimated_days')} days)\n"
            md += f"  - {task.get('description')}\n"
            
        md += "\n## 6. Technical Risk Assessment\n"
        for risk in risks:
            md += f"- **Risk ({risk.get('severity').upper()}):** {risk.get('risk')}\n"
            md += f"  - *Mitigation:* {risk.get('mitigation')}\n"
            
        md += "\n---\n*Generated by StartupOps Tech Agent*"
        return md
