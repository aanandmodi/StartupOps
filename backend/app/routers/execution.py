"""Execution API routes for generating artifacts."""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.execution import GeneratedArtifact, ExecutionLog
from app.routers.auth import require_auth, get_current_user
from app.services.executor import AgentExecutor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/execute", tags=["Execution"])


# ===== Schemas =====

class ExecuteRequest(BaseModel):
    """Request to execute an agent action."""
    agent_name: str
    action_type: str
    context: dict = {}


class ArtifactResponse(BaseModel):
    """Response containing a generated artifact."""
    id: int
    agent_name: str
    artifact_type: str
    title: str
    description: Optional[str]
    content: str
    language: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class ExecuteResponse(BaseModel):
    """Response from an execution request."""
    success: bool
    artifact_id: Optional[int] = None
    artifact_type: Optional[str] = None
    content: Optional[str] = None
    error: Optional[str] = None


# ===== Available Actions =====

AVAILABLE_ACTIONS = {
    "product": [
        {"name": "user_story", "label": "User Story", "description": "Generate a user story in standard format"},
        {"name": "prd_section", "label": "PRD Section", "description": "Generate a section for the Product Requirements Doc"},
        {"name": "figma_prompt", "label": "Figma Design Prompt", "description": "Generate a prompt for Figma AI/design tools"},
        {"name": "feature_spec", "label": "Feature Spec", "description": "Generate a detailed feature specification"},
    ],
    "tech": [
        {"name": "nextjs_component", "label": "Next.js Component", "description": "Generate a React/Next.js component"},
        {"name": "fastapi_route", "label": "FastAPI Route", "description": "Generate a FastAPI router with CRUD endpoints"},
        {"name": "database_model", "label": "Database Model", "description": "Generate a SQLAlchemy database model"},
        {"name": "api_spec", "label": "API Specification", "description": "Generate OpenAPI documentation"},
        {"name": "architecture", "label": "Architecture Doc", "description": "Generate system architecture documentation"},
    ],
    "marketing": [
        {"name": "social_post", "label": "Social Media Posts", "description": "Generate social media content"},
        {"name": "email_template", "label": "Email Template", "description": "Generate email templates (welcome, nurture, etc.)"},
        {"name": "landing_copy", "label": "Landing Page Copy", "description": "Generate landing page copywriting"},
        {"name": "content_calendar", "label": "Content Calendar", "description": "Generate a content calendar"},
    ],
    "finance": [
        {"name": "budget_template", "label": "Budget Template", "description": "Generate a startup budget breakdown"},
        {"name": "runway_projection", "label": "Runway Projection", "description": "Generate runway and burn rate analysis"},
        {"name": "pitch_financials", "label": "Pitch Financials", "description": "Generate pitch deck financial slides"},
    ],
    "advisor": [
        {"name": "meeting_agenda", "label": "Meeting Agenda", "description": "Generate meeting agendas"},
        {"name": "decision_framework", "label": "Decision Framework", "description": "Generate a decision-making framework"},
        {"name": "risk_assessment", "label": "Risk Assessment", "description": "Generate risk assessment and mitigation"},
        {"name": "weekly_priorities", "label": "Weekly Priorities", "description": "Generate weekly priority planning"},
    ],
}


# ===== Routes =====

@router.get("/actions")
async def list_available_actions():
    """List all available execution actions by agent."""
    return {"agents": AVAILABLE_ACTIONS}


@router.get("/actions/{agent_name}")
async def get_agent_actions(agent_name: str):
    """Get available actions for a specific agent."""
    if agent_name not in AVAILABLE_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_name}")
    
    return {
        "agent": agent_name,
        "actions": AVAILABLE_ACTIONS[agent_name]
    }


@router.post("/{startup_id}", response_model=ExecuteResponse)
async def execute_action(
    startup_id: int,
    request: ExecuteRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Execute an agent action and generate an artifact."""
    
    # Validate agent and action
    if request.agent_name not in AVAILABLE_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {request.agent_name}")
    
    valid_actions = [a["name"] for a in AVAILABLE_ACTIONS[request.agent_name]]
    if request.action_type not in valid_actions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid action '{request.action_type}' for agent '{request.agent_name}'"
        )
    
    # Execute
    executor = AgentExecutor(db)
    result = await executor.execute(
        startup_id=startup_id,
        agent_name=request.agent_name,
        action_type=request.action_type,
        context=request.context
    )
    
    return ExecuteResponse(
        success=result.success,
        artifact_id=result.artifact_id,
        artifact_type=result.artifact_type,
        content=result.content,
        error=result.error
    )


@router.get("/{startup_id}/artifacts", response_model=List[ArtifactResponse])
async def list_artifacts(
    startup_id: int,
    agent_name: Optional[str] = Query(None),
    artifact_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """List generated artifacts for a startup."""
    query = select(GeneratedArtifact).where(
        GeneratedArtifact.startup_id == startup_id
    )
    
    if agent_name:
        query = query.where(GeneratedArtifact.agent_name == agent_name)
    
    if artifact_type:
        query = query.where(GeneratedArtifact.artifact_type == artifact_type)
    
    query = query.order_by(desc(GeneratedArtifact.created_at)).limit(limit)
    
    result = await db.execute(query)
    artifacts = result.scalars().all()
    
    return [
        ArtifactResponse(
            id=a.id,
            agent_name=a.agent_name,
            artifact_type=a.artifact_type,
            title=a.title,
            description=a.description,
            content=a.content,
            language=a.language,
            created_at=a.created_at.isoformat()
        )
        for a in artifacts
    ]


@router.get("/{startup_id}/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    startup_id: int,
    artifact_id: int,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Get a specific artifact by ID."""
    result = await db.execute(
        select(GeneratedArtifact)
        .where(GeneratedArtifact.id == artifact_id)
        .where(GeneratedArtifact.startup_id == startup_id)
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return ArtifactResponse(
        id=artifact.id,
        agent_name=artifact.agent_name,
        artifact_type=artifact.artifact_type,
        title=artifact.title,
        description=artifact.description,
        content=artifact.content,
        language=artifact.language,
        created_at=artifact.created_at.isoformat()
    )


@router.delete("/{startup_id}/artifacts/{artifact_id}")
async def delete_artifact(
    startup_id: int,
    artifact_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Delete an artifact."""
    result = await db.execute(
        select(GeneratedArtifact)
        .where(GeneratedArtifact.id == artifact_id)
        .where(GeneratedArtifact.startup_id == startup_id)
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    await db.delete(artifact)
    await db.commit()
    
    return {"message": "Artifact deleted"}
