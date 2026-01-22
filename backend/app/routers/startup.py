"""Startup API routes using Firestore (Legacy Singular Router)."""
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from google.cloud import firestore

from app.firebase_client import get_firebase_db
from app.routers.auth import get_current_user, require_auth
from app.schemas import StartupCreate, StartupResponse, StartupDashboard
from app.schemas.startup import ExecutionHealth
from app.schemas.task import TaskResponse
from app.schemas.kpi import KPIResponse
from app.schemas.alert import AlertResponse
from app.services.orchestrator import AgentOrchestrator
from app.services.drift_engine import DriftEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/startup", tags=["Startup"])


@router.post("/create", response_model=dict)
async def create_startup(
    startup_data: StartupCreate,
    user: dict = Depends(require_auth)
):
    """
    Create a new startup and trigger full agent orchestration.
    """
    logger.info(f"Creating new startup: {startup_data.domain}")
    db = get_firebase_db()
    
    # Create startup record
    startup_ref = db.collection("startups").document() # Auto ID
    
    new_startup = {
        "user_id": user["uid"],
        "goal": startup_data.goal,
        "domain": startup_data.domain,
        "team_size": startup_data.team_size,
        "created_at": datetime.utcnow(),
        "status": "initializing"
    }
    startup_ref.set(new_startup)
    
    logger.info(f"Startup created with ID: {startup_ref.id} for user {user['uid']}")
    
    # Run agent orchestration synchronously (or could be background)
    orchestrator = AgentOrchestrator(db)
    try:
        results = await orchestrator.run_full_orchestration(startup_ref.id, new_startup)
        
        # Update status
        startup_ref.update({"status": "active"})
        
        return {
            "startup_id": startup_ref.id,
            "status": "success",
            "message": "Startup created and agents executed successfully",
            "agent_summary": {
                "product": "completed" if "product" in results else "failed",
                "tech": "completed" if "tech" in results else "failed",
                "marketing": "completed" if "marketing" in results else "failed",
                "finance": "completed" if "finance" in results else "failed",
                "advisor": "completed" if "advisor" in results else "failed",
            }
        }
    except Exception as e:
        logger.error(f"Orchestration failed: {e}")
        startup_ref.update({"status": "error", "error": str(e)})
        return {
            "startup_id": startup_ref.id,
            "status": "partial",
            "message": f"Startup created but orchestration failed: {str(e)}",
        }


@router.get("/{startup_id}/dashboard", response_model=StartupDashboard)
async def get_dashboard(
    startup_id: str,
    user: dict = Depends(require_auth)
):
    """
    Get full dashboard data for a startup.
    """
    db = get_firebase_db()
    
    startup_ref = db.collection("startups").document(startup_id)
    doc = startup_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    startup_data = doc.to_dict()
    
    # Verify ownership
    owner_id = str(startup_data.get("user_id"))
    current_uid = str(user.get("uid"))
    
    if owner_id != current_uid:
        raise HTTPException(status_code=403, detail="Not authorized to access this dashboard")
        
    # Add ID manually as it's not in the data
    startup_data["id"] = doc.id
    
    # Fetch subcollections
    # Tasks
    tasks = []
    tasks_stream = startup_ref.collection("tasks").stream()
    for t in tasks_stream:
        td = t.to_dict()
        td["id"] = t.id
        td["startup_id"] = startup_id
        tasks.append(td)
        
    # KPIs
    kpis = []
    kpis_stream = startup_ref.collection("kpis").stream()
    for k in kpis_stream:
        kd = k.to_dict()
        kd["id"] = k.id
        kd["startup_id"] = startup_id
        kpis.append(kd)
        
    # Alerts
    alerts = []
    alerts_stream = startup_ref.collection("alerts").where(filter=firestore.FieldFilter("is_active", "==", True)).stream()
    for a in alerts_stream:
        ad = a.to_dict()
        ad["id"] = a.id
        ad["startup_id"] = startup_id
        alerts.append(ad)
    
    # Mock Execution Health for now (DriftEngine needs refactor too)
    # TODO: Refactor DriftEngine to use Firestore
    execution_health = ExecutionHealth(
        score=85,
        status="healthy",
        completed_tasks=0,
        in_progress_tasks=0,
        pending_tasks=len(tasks),
        total_tasks=len(tasks),
        blocked_tasks=0,
        overdue_tasks=0,
    )
    
    return StartupDashboard(
        startup=StartupResponse.model_validate(startup_data),
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        kpis=[KPIResponse.model_validate(k) for k in kpis],
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        execution_health=execution_health,
    )

@router.get("/{startup_id}", response_model=StartupResponse)
async def get_startup(
    startup_id: str,
):
    """Get startup details by ID."""
    db = get_firebase_db()
    doc = db.collection("startups").document(startup_id).get()
    
    if not doc.exists:
         raise HTTPException(status_code=404, detail="Startup not found")
    
    data = doc.to_dict()
    data["id"] = doc.id
    return StartupResponse.model_validate(data)

