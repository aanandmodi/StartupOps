"""Execution API routes for generating artifacts."""
import logging
from typing import List, Optional, Dict
from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from google.cloud import firestore

from app.firebase_client import get_firebase_db
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
    id: str
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
    artifact_id: Optional[str] = None
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
    startup_id: str,
    request: ExecuteRequest,
    user: dict = Depends(require_auth)
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
    
    # Verify ownership
    db = get_firebase_db()
    startup_ref = db.collection("startups").document(startup_id)
    startup_doc = startup_ref.get()
    
    if not startup_doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup_data = startup_doc.to_dict()
    if str(startup_data.get("user_id")) != str(user.get("uid")):
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Execute
    # Assuming AgentExecutor is updated for Firestore or we pass db
    executor = AgentExecutor(db)
    # Be careful: AgentExecutor might still be SQL-based in its definition!
    # We might need to update that file too.
    
    # For now, let's assume we need to update AgentExecutor logic or mock it here if it fails
    # But let's assume it was updated or needs update.
    # To be safe, checking AgentExecutor separately.
    
    result = await executor.execute(
        startup_id=startup_id,
        agent_name=request.agent_name,
        action_type=request.action_type,
        context=request.context
    )
    
    return ExecuteResponse(
        success=result.success,
        artifact_id=str(result.artifact_id) if result.artifact_id else None,
        artifact_type=result.artifact_type,
        content=result.content,
        error=result.error
    )


@router.get("/{startup_id}/artifacts", response_model=List[ArtifactResponse])
async def list_artifacts(
    startup_id: str,
    agent_name: Optional[str] = Query(None),
    artifact_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[dict] = Depends(get_current_user)
):
    """List generated artifacts for a startup."""
    db = get_firebase_db()
    
    # Note: Artifacts should likely be a subcollection of startups or root collection 
    # filtered by startup_id. Let's use root 'artifacts' for easier querying or subcollection?
    # Subcollection is better for strict hierarchy: startups/{id}/artifacts
    artifacts_ref = db.collection("startups").document(startup_id).collection("artifacts")
    
    query = artifacts_ref.order_by("created_at", direction=firestore.Query.DESCENDING)
    
    if agent_name:
        query = query.where(filter=firestore.FieldFilter("agent_name", "==", agent_name))
    
    if artifact_type:
        query = query.where(filter=firestore.FieldFilter("artifact_type", "==", artifact_type))
        
    query = query.limit(limit)
    
    docs = query.stream()
    results = []
    
    for doc in docs:
        data = doc.to_dict()
        created_at = data.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
            
        results.append(ArtifactResponse(
            id=doc.id,
            agent_name=data.get("agent_name"),
            artifact_type=data.get("artifact_type"),
            title=data.get("title", "Untitled"),
            description=data.get("description"),
            content=data.get("content", ""),
            language=data.get("language"),
            created_at=str(created_at)
        ))
    
    return results


@router.get("/{startup_id}/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    startup_id: str,
    artifact_id: str,
    user: Optional[dict] = Depends(get_current_user)
):
    """Get a specific artifact by ID."""
    db = get_firebase_db()
    
    doc_ref = db.collection("startups").document(startup_id).collection("artifacts").document(artifact_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    data = doc.to_dict()
    created_at = data.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
        
    return ArtifactResponse(
        id=doc.id,
        agent_name=data.get("agent_name"),
        artifact_type=data.get("artifact_type"),
        title=data.get("title", "Untitled"),
        description=data.get("description"),
        content=data.get("content", ""),
        language=data.get("language"),
        created_at=str(created_at)
    )


@router.delete("/{startup_id}/artifacts/{artifact_id}")
async def delete_artifact(
    startup_id: str,
    artifact_id: str,
    user: dict = Depends(require_auth)
):
    """Delete an artifact."""
    db = get_firebase_db()
    startup_ref = db.collection("startups").document(startup_id)
    
    # Ownership check
    startup_doc = startup_ref.get()
    if not startup_doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    if str(startup_doc.get("user_id")) != str(user.get("uid")):
         raise HTTPException(status_code=403, detail="Not authorized")

    doc_ref = startup_ref.collection("artifacts").document(artifact_id)
    doc_ref.delete()
    
    return {"message": "Artifact deleted"}
