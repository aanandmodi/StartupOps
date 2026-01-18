"""Agent Executor Service - Enables agents to generate real work artifacts."""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import GeneratedArtifact, ExecutionLog, ArtifactType, ExecutionStatus
from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent

logger = logging.getLogger(__name__)


@dataclass
class ExecutionResult:
    """Result of an agent execution."""
    success: bool
    artifact_id: Optional[int] = None
    artifact_type: Optional[str] = None
    content: Optional[str] = None
    error: Optional[str] = None


class AgentExecutor:
    """
    Executor service that enables agents to generate real work outputs.
    
    Each agent has specific generation capabilities:
    - Product: User stories, PRD sections, Figma prompts
    - Tech: Code scaffolding, architecture docs, API specs
    - Marketing: Social posts, email templates, landing page copy
    - Finance: Budget templates, financial projections, pitch deck slides
    - Advisor: Meeting agendas, decision frameworks, risk assessments
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.agents = {
            "product": ProductAgent(),
            "tech": TechAgent(),
            "marketing": MarketingAgent(),
            "finance": FinanceAgent(),
            "advisor": AdvisorAgent(),
        }
    
    async def execute(
        self,
        startup_id: int,
        agent_name: str,
        action_type: str,
        context: Dict[str, Any]
    ) -> ExecutionResult:
        """Execute an agent action and generate an artifact."""
        
        if agent_name not in self.agents:
            return ExecutionResult(success=False, error=f"Unknown agent: {agent_name}")
        
        # Create execution log
        log = ExecutionLog(
            startup_id=startup_id,
            agent_name=agent_name,
            action_type=action_type,
            status=ExecutionStatus.RUNNING,
            input_data=context
        )
        self.db.add(log)
        await self.db.flush()
        
        try:
            # Route to specific generator
            result = await self._route_execution(agent_name, action_type, context)
            
            if result.success and result.content:
                # Save artifact
                artifact = GeneratedArtifact(
                    startup_id=startup_id,
                    agent_name=agent_name,
                    artifact_type=result.artifact_type or action_type,
                    title=context.get("title", f"{action_type.replace('_', ' ').title()}"),
                    description=context.get("description"),
                    content=result.content,
                    language=context.get("language"),
                    file_extension=context.get("file_extension"),
                    metadata=context.get("metadata")
                )
                self.db.add(artifact)
                await self.db.flush()
                result.artifact_id = artifact.id
                
                # Update log
                log.status = ExecutionStatus.SUCCESS
                log.output_data = {"artifact_id": artifact.id}
                log.completed_at = datetime.utcnow()
            else:
                log.status = ExecutionStatus.FAILED
                log.error_message = result.error
                log.completed_at = datetime.utcnow()
            
            await self.db.commit()
            return result
            
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            log.status = ExecutionStatus.FAILED
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            await self.db.commit()
            return ExecutionResult(success=False, error=str(e))
    
    async def _route_execution(
        self,
        agent_name: str,
        action_type: str,
        context: Dict[str, Any]
    ) -> ExecutionResult:
        """Route execution to the appropriate generator."""
        
        generators = {
            "product": {
                "user_story": self._generate_user_story,
                "prd_section": self._generate_prd_section,
                "figma_prompt": self._generate_figma_prompt,
                "feature_spec": self._generate_feature_spec,
            },
            "tech": {
                "nextjs_component": self._generate_nextjs_component,
                "fastapi_route": self._generate_fastapi_route,
                "database_model": self._generate_database_model,
                "api_spec": self._generate_api_spec,
                "architecture": self._generate_architecture_doc,
            },
            "marketing": {
                "social_post": self._generate_social_post,
                "email_template": self._generate_email_template,
                "landing_copy": self._generate_landing_copy,
                "content_calendar": self._generate_content_calendar,
            },
            "finance": {
                "budget_template": self._generate_budget_template,
                "runway_projection": self._generate_runway_projection,
                "pitch_financials": self._generate_pitch_financials,
            },
            "advisor": {
                "meeting_agenda": self._generate_meeting_agenda,
                "decision_framework": self._generate_decision_framework,
                "risk_assessment": self._generate_risk_assessment,
                "weekly_priorities": self._generate_weekly_priorities,
            },
        }
        
        agent_generators = generators.get(agent_name, {})
        generator = agent_generators.get(action_type)
        
        if not generator:
            return ExecutionResult(
                success=False, 
                error=f"Unknown action {action_type} for agent {agent_name}"
            )
        
        return await generator(context)
    
    # ===== PRODUCT AGENT GENERATORS =====
    
    async def _generate_user_story(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a user story in standard format."""
        feature = context.get("feature", "new feature")
        user_type = context.get("user_type", "user")
        goal = context.get("goal", "accomplish their task")
        
        content = f"""# User Story: {feature}

## Story
**As a** {user_type}
**I want to** {feature}
**So that** {goal}

## Acceptance Criteria
- [ ] User can access the feature from the main navigation
- [ ] Feature works on mobile and desktop
- [ ] Loading states are shown during async operations
- [ ] Error states are handled gracefully
- [ ] Success confirmation is displayed

## Technical Notes
- Requires backend API endpoint
- Should integrate with existing auth system
- Consider caching for performance

## Design Considerations
- Follow existing UI patterns
- Ensure accessibility (WCAG 2.1)
- Support dark mode

## Priority
Medium

## Estimated Effort
3 story points
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.USER_STORY,
            content=content
        )
    
    async def _generate_prd_section(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a PRD section."""
        section = context.get("section", "Feature Overview")
        feature = context.get("feature", "New Feature")
        
        content = f"""# {section}: {feature}

## Overview
This document outlines the requirements for {feature}.

## Problem Statement
Users currently lack the ability to {feature.lower()}, which impacts their productivity and experience.

## Proposed Solution
Implement a comprehensive solution that allows users to:
1. Access the feature easily
2. Complete their goal efficiently
3. Track their progress

## Success Metrics
- User adoption rate: 50% within first month
- Task completion rate: 80%
- User satisfaction score: 4.5/5

## Timeline
- Phase 1: Research & Design (1 week)
- Phase 2: Development (2 weeks)
- Phase 3: Testing & Launch (1 week)

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Technical complexity | High | Break into smaller chunks |
| User adoption | Medium | Clear onboarding flow |
| Performance | Low | Implement caching |
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_figma_prompt(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a prompt for Figma design."""
        screen = context.get("screen", "Dashboard")
        style = context.get("style", "modern, dark mode")
        
        content = f"""# Figma Design Prompt: {screen}

## Screen Type
{screen}

## Design Style
{style}

## Detailed Prompt for AI Design Tools (Figma AI, Galileo, etc.):

---

Create a {style} design for a {screen} screen with the following specifications:

**Layout:**
- Full-width responsive layout
- Sidebar navigation on the left (240px)
- Main content area with proper padding (24px)
- Card-based components with subtle shadows

**Color Palette:**
- Background: #0a0a0f (deep dark)
- Card background: #1a1a2e with 0.1 opacity white border
- Primary accent: #6366f1 (indigo)
- Text primary: #ffffff
- Text secondary: #9ca3af

**Typography:**
- Font family: Inter or SF Pro
- Headings: 24px bold
- Body: 14px regular
- Small text: 12px medium

**Components to Include:**
- Header with logo and user avatar
- Navigation sidebar with icons
- Main stat cards (4 in a row)
- Data visualization (chart or graph)
- Action buttons with hover states
- Empty states and loading skeletons

**Interactions:**
- Smooth hover transitions (0.2s ease)
- Subtle scale on card hover (1.02)
- Focus states for accessibility

**Export Settings:**
- 1440px desktop, 768px tablet, 375px mobile
- 2x assets for retina displays

---

Copy this prompt into Figma AI or your preferred design tool.
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.FIGMA_PROMPT,
            content=content
        )
    
    async def _generate_feature_spec(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a feature specification."""
        feature = context.get("feature", "Feature")
        
        content = f"""# Feature Specification: {feature}

## Summary
{feature} enables users to accomplish their goals more efficiently.

## Functional Requirements
1. FR-001: System shall allow users to create new items
2. FR-002: System shall validate input before submission
3. FR-003: System shall provide real-time feedback
4. FR-004: System shall support undo/redo operations

## Non-Functional Requirements
- Performance: Page load < 2 seconds
- Availability: 99.9% uptime
- Security: All data encrypted at rest and in transit

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{feature.lower().replace(' ', '-')} | List all items |
| POST | /api/{feature.lower().replace(' ', '-')} | Create new item |
| PUT | /api/{feature.lower().replace(' ', '-')}/{{id}} | Update item |
| DELETE | /api/{feature.lower().replace(' ', '-')}/{{id}} | Delete item |

## Data Model
```json
{{
  "id": "string (uuid)",
  "name": "string",
  "description": "string",
  "status": "draft | active | archived",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}}
```
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    # ===== TECH AGENT GENERATORS =====
    
    async def _generate_nextjs_component(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a Next.js React component."""
        name = context.get("name", "Component")
        description = context.get("description", "A reusable component")
        
        content = f'''\"use client\";

import {{ useState }} from \"react\";
import {{ motion }} from \"framer-motion\";
import {{ cn }} from \"@/lib/utils\";

interface {name}Props {{
  className?: string;
  title?: string;
  onAction?: () => void;
}}

/**
 * {name} Component
 * {description}
 */
export function {name}({{ className, title, onAction }}: {name}Props) {{
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {{
    setIsLoading(true);
    try {{
      onAction?.();
    }} finally {{
      setIsLoading(false);
    }}
  }};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={{cn(
        "p-6 rounded-xl bg-white/5 border border-white/10",
        "hover:bg-white/10 transition-colors",
        className
      )}}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {{title || \"{name}\"}}
      </h3>
      
      <div className="space-y-4">
        {{/* Add your component content here */}}
        <p className="text-muted-foreground">
          {description}
        </p>
        
        <button
          onClick={{handleAction}}
          disabled={{isLoading}}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {{isLoading ? \"Loading...\" : \"Action\"}}
        </button>
      </div>
    </motion.div>
  );
}}
'''
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.CODE,
            content=content
        )
    
    async def _generate_fastapi_route(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a FastAPI route."""
        resource = context.get("resource", "items")
        
        content = f'''"""API routes for {resource}."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db

router = APIRouter(prefix="/{resource}", tags=["{resource.title()}"])


# ===== Schemas =====

class {resource.title().replace("_", "")}Base(BaseModel):
    name: str
    description: Optional[str] = None


class {resource.title().replace("_", "")}Create({resource.title().replace("_", "")}Base):
    pass


class {resource.title().replace("_", "")}Response({resource.title().replace("_", "")}Base):
    id: int
    
    class Config:
        from_attributes = True


# ===== Routes =====

@router.get("/", response_model=List[{resource.title().replace("_", "")}Response])
async def list_{resource}(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all {resource}."""
    # TODO: Replace with actual model query
    return []


@router.post("/", response_model={resource.title().replace("_", "")}Response)
async def create_{resource.rstrip("s")}(
    data: {resource.title().replace("_", "")}Create,
    db: AsyncSession = Depends(get_db)
):
    """Create a new {resource.rstrip("s")}."""
    # TODO: Implement creation logic
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{{id}}", response_model={resource.title().replace("_", "")}Response)
async def get_{resource.rstrip("s")}(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific {resource.rstrip("s")} by ID."""
    # TODO: Implement get logic
    raise HTTPException(status_code=404, detail="{resource.title()} not found")


@router.put("/{{id}}", response_model={resource.title().replace("_", "")}Response)
async def update_{resource.rstrip("s")}(
    id: int,
    data: {resource.title().replace("_", "")}Create,
    db: AsyncSession = Depends(get_db)
):
    """Update a {resource.rstrip("s")}."""
    # TODO: Implement update logic
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/{{id}}")
async def delete_{resource.rstrip("s")}(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a {resource.rstrip("s")}."""
    # TODO: Implement delete logic
    return {{"message": "{resource.title()} deleted"}}
'''
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.CODE,
            content=content
        )
    
    async def _generate_database_model(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a SQLAlchemy database model."""
        model_name = context.get("name", "Item")
        fields = context.get("fields", ["name", "description"])
        
        field_lines = "\n".join([
            f"    {field}: Mapped[str] = mapped_column(String(255), nullable=True)"
            for field in fields
        ])
        
        content = f'''"""Database model for {model_name}."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class {model_name}(Base):
    """{model_name} database model."""
    
    __tablename__ = "{model_name.lower()}s"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
{field_lines}
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<{model_name}(id={{self.id}})>"
'''
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.CODE,
            content=content
        )
    
    async def _generate_api_spec(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate OpenAPI spec documentation."""
        api_name = context.get("name", "API")
        
        content = f"""# {api_name} API Specification

## Base URL
`https://api.example.com/v1`

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Endpoints

### List Resources
`GET /resources`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |

**Response:**
```json
{{
  "data": [...],
  "meta": {{
    "total": 100,
    "page": 1,
    "limit": 20
  }}
}}
```

### Create Resource
`POST /resources`

**Body:**
```json
{{
  "name": "string",
  "description": "string"
}}
```

### Get Resource
`GET /resources/{{id}}`

### Update Resource
`PUT /resources/{{id}}`

### Delete Resource
`DELETE /resources/{{id}}`

## Error Responses
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_architecture_doc(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate architecture documentation."""
        system_name = context.get("name", "System")
        
        content = f"""# {system_name} Architecture

## Overview
High-level architecture documentation for {system_name}.

## System Components

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway   │
│   (Next.js)     │     │   (FastAPI)     │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │ Database  │           │  AI Services  │
              │ (Postgres)│           │  (Groq/OpenAI)│
              └───────────┘           └───────────────┘
```

## Technology Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy
- **Database:** PostgreSQL (primary), SQLite (dev)
- **AI:** Groq API, LangChain, LangGraph
- **Auth:** JWT, OAuth2 (Google, GitHub)

## Data Flow
1. User makes request to frontend
2. Frontend calls backend API
3. API authenticates and validates request
4. Business logic processes data
5. Response returned to user

## Security Considerations
- All API endpoints require authentication
- Passwords hashed with bcrypt
- HTTPS enforced in production
- Rate limiting on all endpoints

## Scaling Strategy
- Horizontal scaling for API servers
- Read replicas for database
- CDN for static assets
- Redis for caching
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.ARCHITECTURE,
            content=content
        )
    
    # ===== MARKETING AGENT GENERATORS =====
    
    async def _generate_social_post(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate social media posts."""
        platform = context.get("platform", "Twitter/X")
        topic = context.get("topic", "product launch")
        tone = context.get("tone", "professional but friendly")
        
        content = f"""# Social Media Post: {topic}

## Platform: {platform}
## Tone: {tone}

---

### Post 1 (Announcement)
🚀 Big news! We're launching something that will change the way you {topic.lower()}.

After months of building with our AI co-founders, we're ready to share it with you.

Drop a 👀 if you want early access!

#startup #buildinpublic #AI

---

### Post 2 (Value Proposition)
Stop spending hours on {topic.lower()}.

Our AI-powered solution helps you:
✅ Save 10+ hours per week
✅ Make data-driven decisions
✅ Focus on what matters

Ready to try it? Link in bio 🔗

---

### Post 3 (Social Proof)
"This tool changed how we operate our startup."

That's what our beta users are saying about our {topic} solution.

Join 500+ founders who are already building smarter.

🎯 Try it free today

---

### Hashtags to Use
#startup #founders #AI #productivity #buildinpublic #tech
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.SOCIAL_POST,
            content=content
        )
    
    async def _generate_email_template(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate email templates."""
        email_type = context.get("type", "welcome")
        product = context.get("product", "StartupOps")
        
        content = f"""# Email Template: {email_type.title()}

## Subject Lines (A/B Test)
1. Welcome to {product} - Let's build something amazing 🚀
2. You're in! Here's how to get started with {product}
3. Your AI co-founders are ready to meet you

---

## Email Body

**Preheader:** Your startup journey starts now

---

Hi {{{{first_name}}}},

Welcome to {product}! 🎉

You've just unlocked access to 5 AI co-founders who are ready to help you build your startup:

🎯 **Product Co-Founder** - MVP planning & features
⚙️ **Tech Co-Founder** - Architecture & code
📣 **Marketing Co-Founder** - Growth strategies
💰 **Finance Co-Founder** - Budget & runway
🧠 **Strategic Advisor** - Guidance & priorities

**Here's how to get started:**

1. **Create your first startup** - Tell us your idea
2. **Chat with your co-founders** - Ask them anything
3. **Execute your plan** - Turn ideas into action

[Get Started Now →]({{{{cta_url}}}})

Have questions? Just reply to this email - we read every message.

Building the future together,
The {product} Team

---

## Footer
You received this email because you signed up for {product}.
[Unsubscribe]({{{{unsubscribe_url}}}}) | [Manage Preferences]({{{{preferences_url}}}})

© 2026 {product}. All rights reserved.
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.EMAIL_TEMPLATE,
            content=content
        )
    
    async def _generate_landing_copy(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate landing page copy."""
        product = context.get("product", "StartupOps")
        tagline = context.get("tagline", "Your AI Co-Founders")
        
        content = f"""# Landing Page Copy: {product}

## Hero Section

### Headline
**{product}: {tagline}**

### Subheadline
5 AI agents that work together to plan, build, and grow your startup. Like having a full founding team, powered by AI.

### CTA Button
Start Building for Free →

---

## Problem Section

### Headline
Building a Startup Alone is Hard

### Body
- You're wearing 10 hats at once
- Strategic decisions pile up
- No one to bounce ideas off
- Everything takes 10x longer than it should

---

## Solution Section

### Headline
Meet Your AI Founding Team

### Cards

**🎯 Product Co-Founder**
Plans your MVP, prioritizes features, writes user stories. Like having a seasoned PM by your side.

**⚙️ Tech Co-Founder**
Designs your architecture, scaffolds code, chooses your stack. Technical decisions, made easy.

**📣 Marketing Co-Founder**
Creates growth strategies, writes copy, plans campaigns. Your startup's voice, amplified.

**💰 Finance Co-Founder**
Tracks runway, builds budgets, forecasts growth. Numbers that make sense.

**🧠 Strategic Advisor**
Monitors health, spots risks, keeps you on track. The mentor every founder needs.

---

## Social Proof

### Headline
Join 1,000+ Founders Building Smarter

### Testimonials
"It's like having a Y Combinator partner available 24/7."
— Sarah, Founder @ TechStartup

"Save me 20 hours per week on planning and strategy."
— Marcus, Solo Founder

---

## CTA Section

### Headline
Start Building Your Startup Today

### Subheadline
No credit card required. Get your AI co-founders in 60 seconds.

### Button
Get Started Free →
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_content_calendar(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a content calendar."""
        weeks = context.get("weeks", 4)
        
        content = f"""# Content Calendar ({weeks} Weeks)

## Week 1: Awareness

| Day | Platform | Content Type | Topic |
|-----|----------|--------------|-------|
| Mon | Twitter | Thread | Product announcement |
| Tue | LinkedIn | Article | Problem we're solving |
| Wed | Twitter | Poll | User research |
| Thu | Blog | Long-form | Behind the scenes |
| Fri | Twitter | Meme | Founder life |

## Week 2: Education

| Day | Platform | Content Type | Topic |
|-----|----------|--------------|-------|
| Mon | Twitter | Tips | 5 ways to use the product |
| Tue | LinkedIn | Case study | Customer success |
| Wed | YouTube | Tutorial | Getting started guide |
| Thu | Twitter | Thread | Industry insights |
| Fri | Newsletter | Digest | Weekly roundup |

## Week 3: Engagement

| Day | Platform | Content Type | Topic |
|-----|----------|--------------|-------|
| Mon | Twitter | AMA | Q&A with founders |
| Tue | LinkedIn | Poll | Industry trends |
| Wed | Twitter | Giveaway | Free premium access |
| Thu | Blog | Interview | Expert collaboration |
| Fri | Twitter | Celebration | User milestones |

## Week 4: Conversion

| Day | Platform | Content Type | Topic |
|-----|----------|--------------|-------|
| Mon | All | Launch | New feature announcement |
| Tue | Email | Nurture | Benefits reminder |
| Wed | Twitter | Testimonials | Social proof |
| Thu | LinkedIn | ROI | Value proposition |
| Fri | All | Promo | Limited time offer |

## Content Pillars
1. **Educational** (40%) - How-tos, tutorials, tips
2. **Inspirational** (25%) - Success stories, founder journey
3. **Promotional** (20%) - Product features, offers
4. **Engaging** (15%) - Polls, memes, community
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    # ===== FINANCE AGENT GENERATORS =====
    
    async def _generate_budget_template(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a budget template."""
        months = context.get("months", 12)
        
        content = f"""# Startup Budget Template ({months} Months)

## Monthly Budget Overview

| Category | Monthly | Annual |
|----------|---------|--------|
| **Team** | $15,000 | $180,000 |
| **Infrastructure** | $2,000 | $24,000 |
| **Marketing** | $3,000 | $36,000 |
| **Operations** | $1,500 | $18,000 |
| **Legal/Admin** | $500 | $6,000 |
| **Buffer (15%)** | $3,300 | $39,600 |
| **TOTAL** | $25,300 | $303,600 |

---

## Team Breakdown

| Role | Monthly Cost |
|------|--------------|
| Founder Salary | $5,000 |
| Developer (Full-time) | $6,000 |
| Designer (Part-time) | $2,500 |
| Marketing (Part-time) | $1,500 |
| **Subtotal** | $15,000 |

---

## Infrastructure

| Item | Monthly Cost |
|------|--------------|
| Cloud Hosting (AWS/Vercel) | $500 |
| Database (Supabase/Neon) | $100 |
| AI APIs (Groq/OpenAI) | $1,000 |
| Dev Tools & SaaS | $300 |
| Domain & SSL | $100 |
| **Subtotal** | $2,000 |

---

## Marketing

| Channel | Monthly Budget |
|---------|----------------|
| Paid Ads (Meta/Google) | $1,500 |
| Content Creation | $500 |
| Influencer/Partnerships | $500 |
| Events/Communities | $300 |
| Tools (Analytics, Email) | $200 |
| **Subtotal** | $3,000 |

---

## Runway Calculation

With $303,600 annual budget:
- If raised $500K: **19.8 months** runway
- If raised $1M: **39.6 months** runway
- If raised $250K: **9.9 months** runway

**Recommendation:** Aim for 18-24 months runway for seed stage.
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.SPREADSHEET,
            content=content
        )
    
    async def _generate_runway_projection(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate runway projection."""
        current_cash = context.get("cash", 500000)
        monthly_burn = context.get("burn", 25000)
        
        months_runway = current_cash / monthly_burn
        
        content = f"""# Runway Projection

## Current Status
- **Cash on Hand:** ${current_cash:,}
- **Monthly Burn Rate:** ${monthly_burn:,}
- **Current Runway:** {months_runway:.1f} months

---

## Monthly Projection

| Month | Starting Cash | Burn | Revenue | Ending Cash |
|-------|---------------|------|---------|-------------|
| 1 | ${current_cash:,} | ${monthly_burn:,} | $0 | ${current_cash - monthly_burn:,} |
| 2 | ${current_cash - monthly_burn:,} | ${monthly_burn:,} | $500 | ${current_cash - (2*monthly_burn) + 500:,} |
| 3 | ${current_cash - (2*monthly_burn) + 500:,} | ${monthly_burn:,} | $1,000 | ${current_cash - (3*monthly_burn) + 1500:,} |
| 4 | - | ${monthly_burn:,} | $2,000 | - |
| 5 | - | ${monthly_burn:,} | $4,000 | - |
| 6 | - | ${monthly_burn:,} | $8,000 | - |

---

## Scenarios

### Conservative (No Revenue Growth)
- Runway: **{months_runway:.0f} months**
- Cash-out date: Month {int(months_runway)}

### Moderate (10% MoM Revenue Growth)
- Break-even: Month 18
- Runway: **Extended to 24+ months**

### Optimistic (20% MoM Revenue Growth)
- Break-even: Month 12
- Cash-positive: Month 15

---

## Recommendations

1. **Start fundraising at 6 months runway** (Month {int(months_runway - 6)})
2. **Reduce burn by 20%** if no traction by Month 6
3. **Focus on revenue** - $10K MRR extends runway significantly
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_pitch_financials(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate pitch deck financial slides."""
        raise_amount = context.get("raise", 1000000)
        
        content = f"""# Pitch Deck: Financial Slides

## Slide 1: The Ask

### Raising ${raise_amount / 1000000:.1f}M Seed Round

**Use of Funds:**
- 50% Engineering (hire 2 devs)
- 25% Go-to-market
- 15% Operations
- 10% Buffer

**Milestones this round:**
- Launch public product
- Reach $50K MRR
- 1,000 paying customers

---

## Slide 2: Business Model

### Revenue Streams

| Tier | Price | Target % |
|------|-------|----------|
| Free | $0/mo | 70% |
| Pro | $29/mo | 25% |
| Team | $99/mo | 5% |

**Unit Economics:**
- CAC: $50
- LTV: $450
- LTV/CAC: 9x ✅

---

## Slide 3: Financial Projections

| Year | ARR | Customers | Team |
|------|-----|-----------|------|
| 2026 | $500K | 1,500 | 5 |
| 2027 | $2M | 5,000 | 12 |
| 2028 | $8M | 15,000 | 25 |

**Key Assumptions:**
- 15% monthly growth Year 1
- 50% gross margins
- $100 blended ARPU by Year 2

---

## Slide 4: Cap Table (Post-Round)

| Holder | % Ownership |
|--------|-------------|
| Founders | 70% |
| Seed Investors | 20% |
| Employee Pool | 10% |

**Valuation:** ${raise_amount * 5 / 1000000:.0f}M post-money
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    # ===== ADVISOR AGENT GENERATORS =====
    
    async def _generate_meeting_agenda(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a meeting agenda."""
        meeting_type = context.get("type", "Weekly Sync")
        duration = context.get("duration", 30)
        
        content = f"""# Meeting Agenda: {meeting_type}

## Meeting Details
- **Duration:** {duration} minutes
- **Date:** [Insert Date]
- **Attendees:** [List attendees]

---

## Agenda

### 1. Check-in (2 min)
- Quick wins from last week
- Any blockers to address?

### 2. Key Updates ({duration // 3} min)
- Product progress
- Key metrics review
- Customer feedback

### 3. Priorities Discussion ({duration // 3} min)
- This week's top 3 priorities
- Resource allocation
- Dependencies to resolve

### 4. Decisions Needed ({duration // 4} min)
- [Decision 1]: Options A, B, C
- [Decision 2]: Go/No-go
- Assign owners and deadlines

### 5. Action Items (3 min)
- Review assigned tasks
- Confirm next meeting

---

## Pre-Meeting Prep
- [ ] Review last week's action items
- [ ] Update team on your progress
- [ ] Prepare any discussion topics

## Post-Meeting
- [ ] Share meeting notes
- [ ] Update task tracker
- [ ] Schedule follow-ups
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.MEETING_AGENDA,
            content=content
        )
    
    async def _generate_decision_framework(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a decision framework."""
        decision = context.get("decision", "Strategic Decision")
        
        content = f"""# Decision Framework: {decision}

## Decision Statement
**What decision needs to be made?**
{decision}

---

## Options Analysis

### Option A: [Name]
| Criteria | Score (1-5) |
|----------|-------------|
| Cost | 4 |
| Speed | 3 |
| Risk | 2 |
| Impact | 5 |
| **Total** | **14** |

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

---

### Option B: [Name]
| Criteria | Score (1-5) |
|----------|-------------|
| Cost | 3 |
| Speed | 4 |
| Risk | 3 |
| Impact | 4 |
| **Total** | **14** |

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

---

## Recommendation

Based on the analysis: **Option [A/B]**

**Rationale:**
- [Key reason 1]
- [Key reason 2]

**Risks to monitor:**
- [Risk 1]
- [Risk 2]

**Success metrics:**
- [Metric 1]
- [Metric 2]

---

## Decision Log
- **Decision:** [Final choice]
- **Made by:** [Name]
- **Date:** [Date]
- **Review date:** [Date]
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_risk_assessment(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate a risk assessment."""
        project = context.get("project", "Startup")
        
        content = f"""# Risk Assessment: {project}

## Risk Matrix

| ID | Risk | Probability | Impact | Score | Mitigation |
|----|------|-------------|--------|-------|------------|
| R1 | Technical debt | High | Medium | 🟡 12 | Regular refactoring sprints |
| R2 | Key person dependency | Medium | High | 🟡 12 | Document processes |
| R3 | Runway depletion | Low | Critical | 🔴 15 | Start fundraising early |
| R4 | Competition | Medium | Medium | 🟢 9 | Focus on differentiation |
| R5 | Regulatory changes | Low | Medium | 🟢 6 | Legal monitoring |

---

## Scoring Guide
- Probability: Low(1) / Medium(3) / High(5)
- Impact: Low(1) / Medium(3) / High(5) / Critical(7)
- Score = Probability × Impact
- 🔴 High (15+) | 🟡 Medium (10-14) | 🟢 Low (<10)

---

## Top Risks Action Plan

### R3: Runway Depletion (Critical)
**Current Status:** 12 months runway
**Target:** 18+ months

**Actions:**
1. Begin investor outreach Month 6
2. Reduce non-essential spend by 15%
3. Focus on revenue-generating features

**Owner:** CEO
**Review Date:** Monthly

---

### R1: Technical Debt (High)
**Current Status:** Growing backlog
**Target:** <20% of sprint capacity

**Actions:**
1. Dedicate 20% of each sprint to debt
2. Implement code review standards
3. Automate testing

**Owner:** CTO
**Review Date:** Weekly

---

## Review Schedule
- Weekly: Technical risks
- Monthly: Financial risks
- Quarterly: All risks
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
    
    async def _generate_weekly_priorities(self, context: Dict[str, Any]) -> ExecutionResult:
        """Generate weekly priorities."""
        week = context.get("week", "This Week")
        
        content = f"""# Weekly Priorities: {week}

## 🎯 Focus Areas

### Must Do (Critical)
1. [ ] **[Priority 1]** - Owner: [Name]
   - Deadline: [Day]
   - Success criteria: [Criteria]
   
2. [ ] **[Priority 2]** - Owner: [Name]
   - Deadline: [Day]
   - Success criteria: [Criteria]

3. [ ] **[Priority 3]** - Owner: [Name]
   - Deadline: [Day]
   - Success criteria: [Criteria]

---

### Should Do (Important)
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

---

### Could Do (Nice to Have)
- [ ] [Task 1]
- [ ] [Task 2]

---

## 📊 Key Metrics to Watch
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Active Users | 100 | 85 | 🟡 |
| Revenue | $5K | $4.5K | 🟡 |
| NPS Score | 50 | 55 | 🟢 |

---

## 🚧 Blockers
- [Blocker 1]: [Who can help]
- [Blocker 2]: [Who can help]

---

## 📅 Key Meetings
| Day | Time | Meeting | Participants |
|-----|------|---------|--------------|
| Mon | 10am | Team Standup | All |
| Wed | 2pm | Product Review | Product, Eng |
| Fri | 4pm | Week Retro | All |

---

## 📝 Notes from Last Week
- What worked: [Summary]
- What didn't: [Summary]
- Learnings: [Summary]
"""
        return ExecutionResult(
            success=True,
            artifact_type=ArtifactType.DOCUMENT,
            content=content
        )
