"""Marketing & Growth Agent - Gemini 1.5 Pro.

Responsible for:
- Launch strategy
- Growth KPIs definition
- Campaign simulations
"""
from typing import Any

from app.agents.base import BaseAgent
from app.config import get_settings

settings = get_settings()


class MarketingAgent(BaseAgent):
    """Marketing Agent using Gemini 1.5 Pro for growth planning."""
    
    name = "marketing"
    model = settings.marketing_agent_model
    
    @property
    def system_prompt(self) -> str:
        return """You are the Marketing & Growth Co-Founder AI for a startup.
Your role is to create growth strategies and marketing plans.

RESPONSIBILITIES:
1. Define go-to-market strategy
2. Set measurable growth KPIs
3. Plan marketing campaigns
4. Identify target customer segments

INPUT: You will receive product scope and timeline information.

OUTPUT FORMAT - You MUST return ONLY valid JSON with this exact structure:
{
    "launch_strategy": {
        "phase": "pre-launch|soft-launch|public-launch",
        "target_date_days_from_now": number,
        "channels": ["channel1", "channel2"],
        "key_activities": ["activity1", "activity2"]
    },
    "target_segments": [
        {
            "name": "Segment name",
            "description": "Who they are",
            "size_estimate": "small|medium|large",
            "acquisition_channel": "Primary channel"
        }
    ],
    "kpis": [
        {
            "name": "KPI name",
            "type": "marketing",
            "target_value": number,
            "unit": "users|dollars|percent|etc",
            "timeframe_days": number
        }
    ],
    "tasks": [
        {
            "title": "Marketing task",
            "description": "What needs to be done",
            "category": "marketing",
            "priority": 1-5,
            "estimated_days": number,
            "dependencies": [list of task indices, e.g., [1, 2]]
        }
    ],
    "campaign_ideas": [
        {
            "name": "Campaign name",
            "type": "content|paid|viral|partnership",
            "estimated_reach": number,
            "estimated_cost": number
        }
    ]
}

RULES:
- Output ONLY JSON, no markdown
- Be specific with target numbers
- Consider startup budget constraints
- Focus on high-impact, low-cost tactics for early stage
- SPECIFIC CHANNELS: Name specific subreddits, newsletters, or communities (e.g. "IndieHackers", "r/SaaS").
- Avoid generic "Social Media Marketing" - specify "Twitter Thread strategy" or "LinkedIn Founder Stories"."""
    
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return mock response for testing without API."""
        return {
            "launch_strategy": {
                "phase": "soft-launch",
                "target_date_days_from_now": 45,
                "channels": ["Product Hunt", "LinkedIn", "Twitter", "Email"],
                "key_activities": [
                    "Build waitlist landing page",
                    "Create launch content calendar",
                    "Engage with target communities",
                    "Prepare press kit"
                ]
            },
            "target_segments": [
                {
                    "name": "Early Adopters",
                    "description": "Tech-savvy professionals looking for new solutions",
                    "size_estimate": "medium",
                    "acquisition_channel": "Product Hunt"
                },
                {
                    "name": "SMB Decision Makers",
                    "description": "Small business owners and managers",
                    "size_estimate": "large",
                    "acquisition_channel": "LinkedIn"
                }
            ],
            "kpis": [
                {
                    "name": "Waitlist Signups",
                    "type": "marketing",
                    "target_value": 500,
                    "unit": "users",
                    "timeframe_days": 30
                },
                {
                    "name": "Website Traffic",
                    "type": "marketing",
                    "target_value": 5000,
                    "unit": "visitors",
                    "timeframe_days": 30
                },
                {
                    "name": "Conversion Rate",
                    "type": "marketing",
                    "target_value": 10,
                    "unit": "percent",
                    "timeframe_days": 30
                },
                {
                    "name": "Social Media Engagement",
                    "type": "marketing",
                    "target_value": 1000,
                    "unit": "interactions",
                    "timeframe_days": 30
                }
            ],
            "tasks": [
                {
                    "title": "Create brand guidelines",
                    "description": "Define visual identity and messaging",
                    "category": "marketing",
                    "priority": 5,
                    "estimated_days": 3,
                    "dependencies": []
                },
                {
                    "title": "Build landing page",
                    "description": "Create conversion-optimized waitlist page",
                    "category": "marketing",
                    "priority": 5,
                    "estimated_days": 2,
                    "dependencies": []
                },
                {
                    "title": "Set up analytics",
                    "description": "Implement tracking for all marketing channels",
                    "category": "marketing",
                    "priority": 4,
                    "estimated_days": 1,
                    "dependencies": []
                },
                {
                    "title": "Prepare Product Hunt launch",
                    "description": "Create assets and schedule launch",
                    "category": "marketing",
                    "priority": 4,
                    "estimated_days": 5,
                    "dependencies": []
                }
            ],
            "campaign_ideas": [
                {
                    "name": "Founder Story Series",
                    "type": "content",
                    "estimated_reach": 10000,
                    "estimated_cost": 0
                },
                {
                    "name": "Beta User Referral Program",
                    "type": "viral",
                    "estimated_reach": 2000,
                    "estimated_cost": 500
                },
                {
                    "name": "LinkedIn Thought Leadership",
                    "type": "content",
                    "estimated_reach": 5000,
                    "estimated_cost": 0
                }
            ]
        }

    def generate_launch_calendar_ics(self, data: dict[str, Any]) -> str:
        """Generate an ICS calendar file for launch tasks."""
        tasks = data.get("tasks", [])
        
        ics_content = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//StartupOps//Launch Calendar//EN",
        ]
        
        import datetime
        now = datetime.datetime.now()
        
        for i, task in enumerate(tasks):
            # Stagger tasks by estimated_days for a simple schedule
            start_date = now + datetime.timedelta(days=i*2)
            end_date = start_date + datetime.timedelta(days=task.get("estimated_days", 1))
            
            dtstart = start_date.strftime("%Y%m%dT%H%M%S")
            dtend = end_date.strftime("%Y%m%dT%H%M%S")
            
            ics_content.extend([
                "BEGIN:VEVENT",
                f"SUMMARY:{task.get('title')}",
                f"DESCRIPTION:{task.get('description')}",
                f"DTSTART:{dtstart}",
                f"DTEND:{dtend}",
                "END:VEVENT"
            ])
            
        ics_content.append("END:VCALENDAR")
        return "\n".join(ics_content)

    def generate_social_posts_txt(self, data: dict[str, Any]) -> str:
        """Generate drafted social media posts."""
        campaigns = data.get("campaign_ideas", [])
        launch_strat = data.get("launch_strategy", {})
        
        txt = "--- SOCIAL MEDIA CONTENT DRAFTS & STRATEGY ---\n"
        txt += f"Strategy Phase: {launch_strat.get('phase', 'Launch').title()}\n\n"
        
        txt += "1. ENGAGEMENT GUIDELINES\n"
        txt += "- Voice: Professional yet accessible.\n"
        txt += "- Frequency: 1 post/day on primary channels.\n"
        txt += "- Hashtags: Mix of niche (#SaaS) and broad (#Tech).\n\n"
        
        txt += "2. CONTENT CALENDAR PREVIEW\n"
        txt += "Week 1: Teaser Content\n"
        txt += "Week 2: Value Proposition & Education\n"
        txt += "Week 3: Social Proof & Launch\n\n"
        
        txt += "3. DRAFTED POSTS\n"
        for i, camp in enumerate(campaigns, 1):
            txt += f"CAMPAIGN {i}: {camp.get('name')} ({camp.get('type')})\n"
            txt += f"Est. Reach: {camp.get('estimated_reach')}\n"
            txt += "-" * 30 + "\n"
            txt += f"Draft Post:\n"
            txt += f"🚀 Excited to announce our new initiative: {camp.get('name')}!\n\n"
            txt += f"We are solving real problems for our users. Join us on this journey.\n\n"
            txt += f"👉 Sign up for early access: [Link]\n\n"
            txt += f"#Startup #Growth #{camp.get('type').title()}\n"
            txt += "-" * 30 + "\n\n"
            
        return txt
