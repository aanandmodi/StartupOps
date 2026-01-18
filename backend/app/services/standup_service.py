"""Standup service for generating daily reports."""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Startup, Task, Alert
from app.models.task import TaskStatus
from app.services.slack_service import SlackService

logger = logging.getLogger(__name__)


@dataclass
class StandupReport:
    """Daily standup report."""
    startup_id: int
    startup_name: str
    generated_at: datetime
    yesterday_summary: str
    today_priorities: List[str]
    blockers: List[str]
    recommendations: List[str]
    health_score: int
    tasks_completed_yesterday: int
    tasks_in_progress: int
    tasks_blocked: int


class StandupService:
    """Service for generating and sending daily standups."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_standup(self, startup_id: int) -> Optional[StandupReport]:
        """Generate a daily standup report for a startup."""
        # Get startup
        result = await self.db.execute(
            select(Startup).where(Startup.id == startup_id)
        )
        startup = result.scalar_one_or_none()
        
        if not startup:
            logger.error(f"Startup {startup_id} not found")
            return None
        
        # Get tasks
        tasks_result = await self.db.execute(
            select(Task).where(Task.startup_id == startup_id)
        )
        tasks = tasks_result.scalars().all()
        
        # Get alerts
        alerts_result = await self.db.execute(
            select(Alert).where(
                and_(
                    Alert.startup_id == startup_id,
                    Alert.is_active == True
                )
            )
        )
        alerts = alerts_result.scalars().all()
        
        # Calculate metrics
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        tasks_by_status = {
            TaskStatus.PENDING: [],
            TaskStatus.IN_PROGRESS: [],
            TaskStatus.DONE: [],
            TaskStatus.BLOCKED: []
        }
        
        for task in tasks:
            tasks_by_status[task.status].append(task)
        
        # Generate summary
        completed_yesterday = len([
            t for t in tasks_by_status[TaskStatus.DONE]
            # In real implementation, check updated_at
        ])
        
        in_progress = len(tasks_by_status[TaskStatus.IN_PROGRESS])
        blocked = len(tasks_by_status[TaskStatus.BLOCKED])
        total = len(tasks)
        done = len(tasks_by_status[TaskStatus.DONE])
        
        # Calculate health score
        if total > 0:
            completion_rate = done / total
            blocked_rate = blocked / total
            health_score = int((completion_rate * 70) + ((1 - blocked_rate) * 30))
        else:
            health_score = 50
        
        # Generate yesterday's summary
        yesterday_summary = self._generate_yesterday_summary(
            tasks_by_status[TaskStatus.DONE][-5:],
            tasks_by_status[TaskStatus.IN_PROGRESS]
        )
        
        # Get today's priorities (high priority in-progress or pending)
        today_priorities = self._get_today_priorities(
            tasks_by_status[TaskStatus.IN_PROGRESS] + 
            tasks_by_status[TaskStatus.PENDING]
        )
        
        # Get blockers
        blockers = [
            f"{t.title}: {t.description or 'No details'}"
            for t in tasks_by_status[TaskStatus.BLOCKED][:5]
        ]
        
        # Get recommendations from recent alerts
        recommendations = [
            alert.recommended_action or alert.message
            for alert in alerts[:5]
            if alert.recommended_action
        ]
        
        return StandupReport(
            startup_id=startup_id,
            startup_name=startup.name or startup.domain,
            generated_at=datetime.utcnow(),
            yesterday_summary=yesterday_summary,
            today_priorities=today_priorities,
            blockers=blockers,
            recommendations=recommendations,
            health_score=health_score,
            tasks_completed_yesterday=completed_yesterday,
            tasks_in_progress=in_progress,
            tasks_blocked=blocked
        )
    
    def _generate_yesterday_summary(
        self,
        completed_tasks: List[Task],
        in_progress_tasks: List[Task]
    ) -> str:
        """Generate a summary of yesterday's progress."""
        parts = []
        
        if completed_tasks:
            completed_titles = [t.title for t in completed_tasks[:3]]
            parts.append(f"Completed: {', '.join(completed_titles)}")
        
        if in_progress_tasks:
            in_progress_titles = [t.title for t in in_progress_tasks[:3]]
            parts.append(f"In Progress: {', '.join(in_progress_titles)}")
        
        if not parts:
            return "Started planning phase - no tasks completed yet."
        
        return ". ".join(parts)
    
    def _get_today_priorities(self, tasks: List[Task]) -> List[str]:
        """Get prioritized list of tasks for today."""
        # Sort by priority (1 = highest)
        sorted_tasks = sorted(tasks, key=lambda t: t.priority)
        
        return [
            f"[P{t.priority}] {t.title}"
            for t in sorted_tasks[:5]
        ]
    
    async def send_standup_to_slack(
        self,
        standup: StandupReport,
        slack_channel: str
    ) -> bool:
        """Send standup report to Slack."""
        slack = SlackService()
        
        return await slack.send_daily_standup(
            channel=slack_channel,
            startup_name=standup.startup_name,
            yesterday_summary=standup.yesterday_summary,
            today_priorities=standup.today_priorities,
            blockers=standup.blockers,
            health_score=standup.health_score
        )
    
    async def send_standup_email(
        self,
        standup: StandupReport,
        recipient_email: str
    ) -> bool:
        """Send standup report via email."""
        # TODO: Implement email sending with SendGrid
        logger.info(f"Would send email to {recipient_email}")
        return True
