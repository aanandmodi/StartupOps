"""Streaming API routes for real-time agent progress."""
import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Startup
from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent
from app.models import Task, KPI, Alert, AgentLog
from app.models.task import TaskCategory, TaskStatus
from app.models.kpi import KPIType
from app.models.alert import AlertSeverity
from app.schemas import StartupCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/startup", tags=["Streaming"])


async def run_agent_with_progress(
    agent,
    agent_name: str,
    input_data: dict,
    startup_id: int,
    db: AsyncSession
) -> tuple[dict, str]:
    """Run a single agent and return its output with status."""
    try:
        output = await agent.run(input_data)
        
        # Save agent log
        log = AgentLog(
            startup_id=startup_id,
            agent_name=agent_name,
            output_json=output,
        )
        db.add(log)
        
        return output, "success"
    except Exception as e:
        logger.error(f"Agent {agent_name} failed: {e}")
        return {"error": str(e)}, "error"


async def stream_agent_orchestration(
    startup: Startup,
    db: AsyncSession
) -> AsyncGenerator[str, None]:
    """Stream agent execution progress as SSE events."""
    
    agents = [
        ("product", ProductAgent(), "Analyzing product strategy..."),
        ("tech", TechAgent(), "Designing technical architecture..."),
        ("marketing", MarketingAgent(), "Creating marketing strategy..."),
        ("finance", FinanceAgent(), "Planning financials..."),
        ("advisor", AdvisorAgent(), "Generating recommendations..."),
    ]
    
    results = {}
    total_agents = len(agents)
    
    for idx, (name, agent, message) in enumerate(agents):
        progress = int((idx / total_agents) * 100)
        
        # Send agent start event
        event = {
            "type": "agent_start",
            "agent": name,
            "message": message,
            "progress": progress,
            "current": idx + 1,
            "total": total_agents
        }
        yield f"data: {json.dumps(event)}\n\n"
        
        # Prepare input data based on agent type
        if name == "product":
            input_data = {
                "goal": startup.goal,
                "domain": startup.domain,
                "team_size": startup.team_size
            }
        elif name == "tech":
            input_data = {
                "product_output": results.get("product", {}),
                "team_size": startup.team_size
            }
        elif name == "marketing":
            timeline = results.get("product", {}).get("recommended_launch_timeline_days", 60)
            input_data = {
                "product_output": results.get("product", {}),
                "timeline_days": timeline,
                "domain": startup.domain
            }
        elif name == "finance":
            timeline = results.get("product", {}).get("recommended_launch_timeline_days", 60)
            tasks = results.get("product", {}).get("tasks", []) + results.get("tech", {}).get("tasks", [])
            input_data = {
                "tasks": tasks,
                "timeline_days": timeline,
                "team_size": startup.team_size
            }
        elif name == "advisor":
            input_data = {
                "product_output": results.get("product", {}),
                "tech_output": results.get("tech", {}),
                "marketing_output": results.get("marketing", {}),
                "finance_output": results.get("finance", {}),
                "startup_goal": startup.goal,
                "team_size": startup.team_size
            }
        
        # Run agent
        output, status = await run_agent_with_progress(
            agent, name, input_data, startup.id, db
        )
        results[name] = output
        
        # Send agent complete event
        complete_event = {
            "type": "agent_complete",
            "agent": name,
            "status": status,
            "progress": int(((idx + 1) / total_agents) * 100)
        }
        yield f"data: {json.dumps(complete_event)}\n\n"
        
        # Small delay to prevent rate limiting
        if idx < total_agents - 1:
            await asyncio.sleep(2)
    
    # Save tasks, KPIs, and alerts
    try:
        await save_orchestration_results(startup.id, results, db)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to save results: {e}")
    
    # Send completion event
    final_event = {
        "type": "complete",
        "startup_id": startup.id,
        "progress": 100,
        "message": "All agents completed successfully!"
    }
    yield f"data: {json.dumps(final_event)}\n\n"


async def save_orchestration_results(startup_id: int, results: dict, db: AsyncSession):
    """Save all tasks, KPIs, and alerts from agent results."""
    
    # Save tasks
    all_tasks = []
    task_id_map = {}
    global_idx = 0
    
    categories = [
        ("product", TaskCategory.PRODUCT, results.get("product", {}).get("tasks", [])),
        ("tech", TaskCategory.TECH, results.get("tech", {}).get("tasks", [])),
        ("marketing", TaskCategory.MARKETING, results.get("marketing", {}).get("tasks", [])),
        ("finance", TaskCategory.FINANCE, results.get("finance", {}).get("tasks", [])),
    ]
    
    for dept, category, tasks in categories:
        for i, task_data in enumerate(tasks):
            task_id_map[(dept, i)] = global_idx
            all_tasks.append({
                **task_data,
                "category": category,
                "global_idx": global_idx,
                "dept": dept
            })
            global_idx += 1
    
    saved_tasks = []
    for task_data in all_tasks:
        task = Task(
            startup_id=startup_id,
            title=task_data.get("title", "Untitled Task"),
            description=task_data.get("description"),
            category=task_data["category"],
            priority=task_data.get("priority", 3),
            estimated_days=task_data.get("estimated_days", 1),
            status=TaskStatus.PENDING,
            dependencies=[],
        )
        db.add(task)
        saved_tasks.append(task)
    
    await db.flush()
    
    # Save KPIs
    marketing_output = results.get("marketing", {})
    for kpi_data in marketing_output.get("kpis", []):
        kpi = KPI(
            startup_id=startup_id,
            type=KPIType.MARKETING,
            name=kpi_data.get("name", "Unknown KPI"),
            value=0,
            target=kpi_data.get("target_value"),
            unit=kpi_data.get("unit"),
        )
        db.add(kpi)
    
    finance_output = results.get("finance", {})
    for kpi_data in finance_output.get("kpis", []):
        kpi = KPI(
            startup_id=startup_id,
            type=KPIType.FINANCE,
            name=kpi_data.get("name", "Unknown KPI"),
            value=0,
            target=kpi_data.get("target_value"),
            unit=kpi_data.get("unit"),
        )
        db.add(kpi)
    
    # Save alerts
    advisor_output = results.get("advisor", {})
    for alert_data in advisor_output.get("alerts", []):
        severity_str = alert_data.get("severity", "info").lower()
        try:
            severity = AlertSeverity(severity_str)
        except ValueError:
            severity = AlertSeverity.INFO
        
        alert = Alert(
            startup_id=startup_id,
            severity=severity,
            message=alert_data.get("message", ""),
            recommended_action=alert_data.get("recommended_action"),
        )
        db.add(alert)


@router.post("/create-stream")
async def create_startup_with_streaming(
    startup_data: StartupCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new startup with real-time streaming of agent progress.
    
    Returns Server-Sent Events (SSE) stream with agent execution updates.
    """
    logger.info(f"Creating startup with streaming: {startup_data.domain}")
    
    # Create startup record first
    startup = Startup(
        goal=startup_data.goal,
        domain=startup_data.domain,
        team_size=startup_data.team_size,
    )
    db.add(startup)
    await db.commit()
    await db.refresh(startup)
    
    logger.info(f"Startup created with ID: {startup.id}")
    
    return StreamingResponse(
        stream_agent_orchestration(startup, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )
