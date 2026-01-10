"""Task API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Startup, Task
from app.models.task import TaskStatus
from app.schemas.task import TaskUpdate, TaskResponse
from app.services.orchestrator import AgentOrchestrator
from app.services.drift_engine import DriftEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/task", tags=["Task"])


@router.post("/{task_id}/update", response_model=dict)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a task's status.
    
    When status changes:
    1. Updates the task in database
    2. Recalculates execution health
    3. Re-runs Advisor Agent for new recommendations
    
    Returns:
        Updated task and new execution health
    """
    # Fetch task
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task fields
    old_status = task.status
    if task_update.status:
        task.status = task_update.status
    if task_update.priority:
        task.priority = task_update.priority
    if task_update.estimated_days:
        task.estimated_days = task_update.estimated_days
    
    await db.commit()
    await db.refresh(task)
    
    logger.info(f"Task {task_id} updated: {old_status} -> {task.status}")
    
    # If status changed, recalculate health and re-run advisor
    response = {
        "task": TaskResponse.model_validate(task).model_dump(),
        "status_changed": old_status != task.status,
    }
    
    if old_status != task.status:
        # Get startup and all tasks
        result = await db.execute(
            select(Startup)
            .options(selectinload(Startup.tasks))
            .where(Startup.id == task.startup_id)
        )
        startup = result.scalar_one()
        
        # Recalculate execution health
        drift_engine = DriftEngine(db)
        drift_analysis = await drift_engine.analyze_drift(startup.id)
        await drift_engine.generate_drift_alerts(startup.id, drift_analysis)
        
        # Re-run Advisor Agent
        orchestrator = AgentOrchestrator(db)
        advisor_output = await orchestrator.run_advisor_only(startup, list(startup.tasks))
        
        await db.commit()
        
        response["execution_health"] = drift_analysis.get("execution_score", {})
        response["new_recommendations"] = advisor_output.get("recommendations", [])
    
    return response


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get task details by ID."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse.model_validate(task)


@router.get("/startup/{startup_id}", response_model=list[TaskResponse])
async def list_startup_tasks(
    startup_id: int,
    category: str = None,
    status: str = None,
    db: AsyncSession = Depends(get_db),
):
    """List all tasks for a startup with optional filters."""
    query = select(Task).where(Task.startup_id == startup_id)
    
    if category:
        query = query.where(Task.category == category)
    if status:
        query = query.where(Task.status == status)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return [TaskResponse.model_validate(t) for t in tasks]
