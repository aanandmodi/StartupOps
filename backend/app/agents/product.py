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
    "core_concept": {
        "problem_statement": "Clear definition of the problem",
        "solution_overview": "How we solve it",
        "value_proposition": "Why it matters",
        "elevator_pitch": "One sentence summary"
    },
    "mvp_features": [
        {
            "title": "Feature name",
            "description": "Brief description",
            "priority": 1-5 (5=highest),
            "complexity": "low|medium|high",
            "estimated_days": number,
            "user_stories": ["As a X, I want Y, so that Z"]
        }
    ],
    "tasks": [
        {
            "title": "Task name",
            "description": "What needs to be done",
            "acceptance_criteria": ["Criteria 1", "Criteria 2"],
            "category": "product",
            "priority": 1-5,
            "estimated_days": number,
            "dependencies": [list of task indices, e.g., [1, 2]]
        }
    ],
    "success_metrics": [
        {
            "metric": "Metric name",
            "target": "Target value",
            "timeline": "When to achieve"
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
- Focus on MVP - minimal viable product
- AVOID generic features like "Login" unless critical. Focus on unique value props.
- Tailor language strictly to the "{domain}" domain."""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        goal = input_data.get("goal", "Build a SaaS product")
        domain = input_data.get("domain", "Technology")
        team_size = input_data.get("team_size", 3)
        
        return {
            "core_concept": {
                "problem_statement": f"Market lacks a unified solution for {domain} management.",
                "solution_overview": f"AI-driven platform optimizing {domain} workflows by 40%.",
                "value_proposition": "Automate tedious tasks and focus on growth.",
                "elevator_pitch": f"We help {domain} professionals save time with AI automation."
            },
            "mvp_features": [
                {
                    "title": "User Authentication",
                    "description": "Secure login and registration system",
                    "priority": 5,
                    "complexity": "medium",
                    "estimated_days": 5,
                    "user_stories": [
                        "As a user, I want to sign up with email so I can access the platform",
                        "As a user, I want to reset my password if I forget it"
                    ]
                },
                {
                    "title": "Core Dashboard",
                    "description": f"Main interface for {domain} operations",
                    "priority": 5,
                    "complexity": "high",
                    "estimated_days": 10,
                    "user_stories": [
                        "As a user, I want to see key metrics at a glance",
                        "As a user, I want to navigate easily between modules"
                    ]
                },
                {
                    "title": "Data Management",
                    "description": "CRUD operations for primary entities",
                    "priority": 4,
                    "complexity": "medium",
                    "estimated_days": 7,
                    "user_stories": [
                        "As a user, I want to add new records",
                        "As a user, I want to edit existing entries"
                    ]
                },
                {
                    "title": "Reporting Module",
                    "description": "Basic analytics and reporting",
                    "priority": 3,
                    "complexity": "medium",
                    "estimated_days": 5,
                    "user_stories": [
                        "As a user, I want to export monthly reports",
                        "As a user, I want to view trends over time"
                    ]
                }
            ],
            "tasks": [
                {
                    "title": "Define user personas and journey maps",
                    "description": "Create detailed user personas based on target market",
                    "acceptance_criteria": ["3 key personas defined", "Journey map for onboarding complete"],
                    "category": "product",
                    "priority": 5,
                    "estimated_days": 2,
                    "dependencies": []
                },
                {
                    "title": "Create wireframes and mockups",
                    "description": "Design UI/UX for all MVP features",
                    "acceptance_criteria": ["Figma files for all core screens", "Mobile responsive design variations"],
                    "category": "product",
                    "priority": 5,
                    "estimated_days": 4,
                    "dependencies": []
                },
                {
                    "title": "Write product requirements document",
                    "description": "Detailed PRD for development team",
                    "acceptance_criteria": ["PRD approved by stakeholders", "Technical constraints identified"],
                    "category": "product",
                    "priority": 4,
                    "estimated_days": 3,
                    "dependencies": []
                },
                {
                    "title": "Set up user feedback channels",
                    "description": "Implement feedback collection mechanisms",
                    "acceptance_criteria": ["Feedback form live", "Intercom/Support integrated"],
                    "category": "product",
                    "priority": 3,
                    "estimated_days": 2,
                    "dependencies": []
                }
            ],
            "success_metrics": [
                {
                    "metric": "Daily Active Users (DAU)",
                    "target": "500",
                    "timeline": "3 months post-launch"
                },
                {
                    "metric": "Customer Retention Rate",
                    "target": "90%",
                    "timeline": "6 months post-launch"
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

    def generate_prd_markdown(self, data: dict[str, Any]) -> str:
        """Generate a Markdown PRD from the product data."""
        core = data.get("core_concept", {})
        mvp_features = data.get("mvp_features", [])
        tasks = data.get("tasks", [])
        risks = data.get("product_risks", [])
        metrics = data.get("success_metrics", [])
        timeline = data.get("recommended_launch_timeline_days", 30)
        
        md = f"# Product Requirements Document (MVP)\n\n"
        md += f"**Target Launch:** {timeline} days\n\n"
        
        md += "## 1. Executive Summary\n"
        md += f"**Problem:** {core.get('problem_statement', 'N/A')}\n\n"
        md += f"**Solution:** {core.get('solution_overview', 'N/A')}\n\n"
        md += f"**Value Proposition:** {core.get('value_proposition', 'N/A')}\n\n"
        md += f"> **Elevator Pitch:** {core.get('elevator_pitch', 'N/A')}\n\n"
        
        md += "## 2. Success Metrics\n"
        md += "| Metric | Target | Timeline |\n"
        md += "| :--- | :--- | :--- |\n"
        for m in metrics:
            md += f"| {m.get('metric')} | {m.get('target')} | {m.get('timeline')} |\n"
        md += "\n"
        
        md += "## 3. MVP Features\n"
        for feature in mvp_features:
            md += f"### {feature.get('title')}\n"
            md += f"- **Description:** {feature.get('description')}\n"
            md += f"- **Priority:** {feature.get('priority')}/5 | **Complexity:** {feature.get('complexity')} | **Est. Days:** {feature.get('estimated_days')}\n"
            
            stories = feature.get("user_stories", [])
            if stories:
                md += "- **User Stories:**\n"
                for story in stories:
                    md += f"  - {story}\n"
            md += "\n"
            
        md += "## 4. Implementation Tasks\n"
        for task in tasks:
            md += f"- [ ] **{task.get('title')}** ({task.get('estimated_days')} days)\n"
            md += f"  - {task.get('description')}\n"
            criteria = task.get("acceptance_criteria", [])
            if criteria:
                md += "  - *Acceptance Criteria:*\n"
                for c in criteria:
                    md += f"    - {c}\n"
            
        md += "\n## 5. Risk Assessment\n"
        for risk in risks:
            md += f"- **Risk:** {risk.get('risk')}\n"
            md += f"  - *Mitigation:* {risk.get('mitigation')}\n"
            
        md += "\n---\n*Generated by StartupOps Product Agent*"
        return md
