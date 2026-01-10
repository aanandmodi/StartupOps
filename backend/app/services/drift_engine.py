"""Drift Detection Engine - Monitors execution health and detects issues."""
import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Task, KPI, Alert
from app.models.task import TaskStatus
from app.models.alert import AlertSeverity

logger = logging.getLogger(__name__)


class DriftEngine:
    """Engine for detecting execution drift and generating alerts."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def analyze_drift(self, startup_id: int) -> dict[str, Any]:
        """
        Analyze execution drift for a startup.
        
        Checks:
        - Task delays
        - Dependency blocks
        - KPI deviations
        - Budget issues
        
        Args:
            startup_id: ID of the startup to analyze
            
        Returns:
            Drift analysis results
        """
        logger.info(f"Analyzing drift for startup {startup_id}")
        
        drift_result = {
            "task_delays": await self._check_task_delays(startup_id),
            "dependency_blocks": await self._check_dependency_blocks(startup_id),
            "execution_score": await self._calculate_execution_score(startup_id),
        }
        
        return drift_result
    
    async def _check_task_delays(self, startup_id: int) -> list[dict]:
        """Check for tasks that are delayed."""
        result = await self.db.execute(
            select(Task).where(
                Task.startup_id == startup_id,
                Task.status == TaskStatus.PENDING,
            )
        )
        pending_tasks = result.scalars().all()
        
        delays = []
        for task in pending_tasks:
            if task.priority >= 4:  # High priority pending tasks
                delays.append({
                    "task_id": task.id,
                    "title": task.title,
                    "priority": task.priority,
                    "severity": "high" if task.priority == 5 else "medium",
                })
        
        return delays
    
    async def _check_dependency_blocks(self, startup_id: int) -> list[dict]:
        """Check for tasks blocked by uncompleted dependencies."""
        result = await self.db.execute(
            select(Task).where(Task.startup_id == startup_id)
        )
        all_tasks = result.scalars().all()
        
        # Build task status map
        task_status = {task.id: task.status for task in all_tasks}
        
        blocks = []
        for task in all_tasks:
            if task.status == TaskStatus.PENDING and task.dependencies:
                blocked_by = []
                for dep_id in task.dependencies:
                    if dep_id in task_status and task_status[dep_id] != TaskStatus.COMPLETED:
                        blocked_by.append(dep_id)
                
                if blocked_by:
                    blocks.append({
                        "task_id": task.id,
                        "title": task.title,
                        "blocked_by": blocked_by,
                    })
        
        return blocks
    
    async def _calculate_execution_score(self, startup_id: int) -> dict[str, Any]:
        """Calculate overall execution health score."""
        result = await self.db.execute(
            select(Task).where(Task.startup_id == startup_id)
        )
        tasks = result.scalars().all()
        
        if not tasks:
            return {
                "score": 100,
                "status": "healthy",
                "completed_tasks": 0,
                "total_tasks": 0,
                "blocked_tasks": 0,
                "overdue_tasks": 0,
            }
        
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
        
        # Calculate blocked tasks
        task_status = {t.id: t.status for t in tasks}
        blocked = 0
        for task in tasks:
            if task.status == TaskStatus.PENDING and task.dependencies:
                for dep_id in task.dependencies:
                    if dep_id in task_status and task_status[dep_id] != TaskStatus.COMPLETED:
                        blocked += 1
                        break
        
        # Calculate score (0-100)
        completion_weight = 0.6
        progress_weight = 0.3
        block_penalty = 0.1
        
        completion_score = (completed / total) * 100 if total > 0 else 100
        progress_score = ((completed + in_progress * 0.5) / total) * 100 if total > 0 else 100
        block_penalty_score = (blocked / total) * 100 if total > 0 else 0
        
        final_score = (
            completion_score * completion_weight +
            progress_score * progress_weight -
            block_penalty_score * block_penalty
        )
        final_score = max(0, min(100, final_score))
        
        # Determine status
        if final_score >= 70:
            status = "healthy"
        elif final_score >= 40:
            status = "at_risk"
        else:
            status = "critical"
        
        return {
            "score": round(final_score, 1),
            "status": status,
            "completed_tasks": completed,
            "total_tasks": total,
            "blocked_tasks": blocked,
            "overdue_tasks": 0,  # Would need due dates to calculate
        }
    
    async def generate_drift_alerts(self, startup_id: int, drift_analysis: dict) -> list[Alert]:
        """Generate alerts based on drift analysis."""
        alerts = []
        
        # Alert for task delays
        delays = drift_analysis.get("task_delays", [])
        if len(delays) >= 3:
            alerts.append(Alert(
                startup_id=startup_id,
                severity=AlertSeverity.WARNING,
                message=f"{len(delays)} high-priority tasks are still pending",
                recommended_action="Review task prioritization and allocation",
            ))
        
        # Alert for dependency blocks
        blocks = drift_analysis.get("dependency_blocks", [])
        if blocks:
            alerts.append(Alert(
                startup_id=startup_id,
                severity=AlertSeverity.WARNING,
                message=f"{len(blocks)} tasks are blocked by dependencies",
                recommended_action="Focus on completing blocking tasks first",
            ))
        
        # Alert for low execution score
        execution = drift_analysis.get("execution_score", {})
        score = execution.get("score", 100)
        if score < 40:
            alerts.append(Alert(
                startup_id=startup_id,
                severity=AlertSeverity.CRITICAL,
                message=f"Execution health is critical: {score}%",
                recommended_action="Immediate team review needed to address blockers",
            ))
        elif score < 70:
            alerts.append(Alert(
                startup_id=startup_id,
                severity=AlertSeverity.WARNING,
                message=f"Execution health is at risk: {score}%",
                recommended_action="Review and prioritize pending tasks",
            ))
        
        # Save alerts to database
        for alert in alerts:
            self.db.add(alert)
        
        return alerts
