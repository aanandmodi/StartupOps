"""Startup API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Startup, Task, KPI, Alert
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
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new startup and trigger full agent orchestration.
    
    This endpoint:
    1. Saves the startup to the database
    2. Triggers all 5 AI agents in sequence
    3. Saves generated tasks, KPIs, and alerts
    
    Returns:
        startup_id and status
    """
    logger.info(f"Creating new startup: {startup_data.domain}")
    
    # Create startup record
    startup = Startup(
        goal=startup_data.goal,
        domain=startup_data.domain,
        team_size=startup_data.team_size,
    )
    db.add(startup)
    await db.commit()
    await db.refresh(startup)
    
    logger.info(f"Startup created with ID: {startup.id}")
    
    # Run agent orchestration
    orchestrator = AgentOrchestrator(db)
    try:
        results = await orchestrator.run_full_orchestration(startup)
        
        return {
            "startup_id": startup.id,
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
        return {
            "startup_id": startup.id,
            "status": "partial",
            "message": f"Startup created but orchestration failed: {str(e)}",
        }


@router.get("/{startup_id}/dashboard", response_model=StartupDashboard)
async def get_dashboard(
    startup_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full dashboard data for a startup.
    
    Returns:
        - Startup details
        - All tasks with dependencies
        - KPIs
        - Active alerts
        - Execution health score
    """
    # Fetch startup with relationships
    result = await db.execute(
        select(Startup)
        .options(
            selectinload(Startup.tasks),
            selectinload(Startup.kpis),
            selectinload(Startup.alerts),
        )
        .where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    # Calculate execution health
    drift_engine = DriftEngine(db)
    drift_analysis = await drift_engine.analyze_drift(startup_id)
    execution_data = drift_analysis.get("execution_score", {})
    
    execution_health = ExecutionHealth(
        score=execution_data.get("score", 0),
        status=execution_data.get("status", "unknown"),
        completed_tasks=execution_data.get("completed_tasks", 0),
        total_tasks=execution_data.get("total_tasks", 0),
        blocked_tasks=execution_data.get("blocked_tasks", 0),
        overdue_tasks=execution_data.get("overdue_tasks", 0),
    )
    
    # Build response
    return StartupDashboard(
        startup=StartupResponse.model_validate(startup),
        tasks=[TaskResponse.model_validate(t) for t in startup.tasks],
        kpis=[KPIResponse.model_validate(k) for k in startup.kpis],
        alerts=[AlertResponse.model_validate(a) for a in startup.alerts if a.is_active],
        execution_health=execution_health,
    )


@router.get("/{startup_id}", response_model=StartupResponse)
async def get_startup(
    startup_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get startup details by ID."""
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    return StartupResponse.model_validate(startup)


@router.get("/", response_model=list[StartupResponse])
async def list_startups(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """List all startups with pagination."""
    result = await db.execute(
        select(Startup).offset(skip).limit(limit)
    )
    startups = result.scalars().all()
    return [StartupResponse.model_validate(s) for s in startups]
