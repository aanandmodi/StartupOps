"""Celery configuration and tasks for background jobs."""
import logging
from datetime import datetime

from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create Celery app
celery_app = Celery(
    "startupops",
    broker=settings.redis_url,
    backend=settings.redis_url
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Send daily standups every day at 9:00 AM UTC
    "send-daily-standups": {
        "task": "app.tasks.celery_tasks.send_all_daily_standups",
        "schedule": crontab(hour=9, minute=0),
    },
    # Check for alerts every hour
    "check-alerts": {
        "task": "app.tasks.celery_tasks.check_and_send_alerts",
        "schedule": crontab(minute=0),  # Every hour
    },
    # Cleanup old execution logs weekly
    "cleanup-logs": {
        "task": "app.tasks.celery_tasks.cleanup_old_logs",
        "schedule": crontab(hour=2, minute=0, day_of_week=0),  # Sunday 2 AM
    },
}


@celery_app.task(name="app.tasks.celery_tasks.send_all_daily_standups")
def send_all_daily_standups():
    """Send daily standup emails to all active users."""
    import asyncio
    from app.database import async_session_maker
    from app.services.standup_service import StandupService
    from app.services.email_service import EmailService
    
    async def _send_standups():
        async with async_session_maker() as db:
            from sqlalchemy import select
            from app.models import Startup, User
            
            # Get all active startups with users
            result = await db.execute(
                select(Startup)
                .where(Startup.status == "active")
                .limit(100)
            )
            startups = result.scalars().all()
            
            standup_service = StandupService(db)
            email_service = EmailService()
            
            sent_count = 0
            for startup in startups:
                try:
                    # Generate standup
                    standup = await standup_service.generate_standup(startup.id)
                    if not standup:
                        continue
                    
                    # Get user email
                    if startup.user_id:
                        user_result = await db.execute(
                            select(User).where(User.id == startup.user_id)
                        )
                        user = user_result.scalar_one_or_none()
                        
                        if user and user.email:
                            success = await email_service.send_standup_email(
                                to_email=user.email,
                                startup_name=standup.startup_name,
                                yesterday_summary=standup.yesterday_summary,
                                today_priorities=standup.today_priorities,
                                blockers=standup.blockers,
                                health_score=standup.health_score
                            )
                            if success:
                                sent_count += 1
                
                except Exception as e:
                    logger.error(f"Failed to send standup for startup {startup.id}: {e}")
            
            return sent_count
    
    count = asyncio.run(_send_standups())
    logger.info(f"Sent {count} daily standup emails")
    return {"sent": count}


@celery_app.task(name="app.tasks.celery_tasks.check_and_send_alerts")
def check_and_send_alerts():
    """Check for critical alerts and send notifications."""
    import asyncio
    from app.database import async_session_maker
    from app.services.email_service import EmailService
    from app.services.slack_service import SlackService
    
    async def _check_alerts():
        async with async_session_maker() as db:
            from sqlalchemy import select
            from app.models import Alert, Startup, User
            from app.models.alert import AlertSeverity
            
            # Get critical alerts from the last hour
            result = await db.execute(
                select(Alert)
                .where(Alert.severity == AlertSeverity.CRITICAL)
                .where(Alert.is_active == True)
                .limit(50)
            )
            alerts = result.scalars().all()
            
            if not alerts:
                return 0
            
            email_service = EmailService()
            slack_service = SlackService()
            
            sent_count = 0
            for alert in alerts:
                try:
                    # Get startup and user
                    startup_result = await db.execute(
                        select(Startup).where(Startup.id == alert.startup_id)
                    )
                    startup = startup_result.scalar_one_or_none()
                    
                    if startup and startup.user_id:
                        user_result = await db.execute(
                            select(User).where(User.id == startup.user_id)
                        )
                        user = user_result.scalar_one_or_none()
                        
                        if user and user.email:
                            await email_service.send_alert_email(
                                to_email=user.email,
                                startup_name=startup.name or startup.domain,
                                alert_severity=alert.severity.value,
                                alert_message=alert.message,
                                recommended_action=alert.recommended_action
                            )
                            sent_count += 1
                
                except Exception as e:
                    logger.error(f"Failed to send alert notification: {e}")
            
            return sent_count
    
    count = asyncio.run(_check_alerts())
    logger.info(f"Sent {count} alert notifications")
    return {"sent": count}


@celery_app.task(name="app.tasks.celery_tasks.cleanup_old_logs")
def cleanup_old_logs():
    """Clean up old execution logs and chat messages."""
    import asyncio
    from datetime import timedelta
    from app.database import async_session_maker
    
    async def _cleanup():
        async with async_session_maker() as db:
            from sqlalchemy import delete
            from app.models.execution import ExecutionLog
            
            # Delete logs older than 30 days
            cutoff = datetime.utcnow() - timedelta(days=30)
            
            result = await db.execute(
                delete(ExecutionLog).where(ExecutionLog.started_at < cutoff)
            )
            await db.commit()
            
            return result.rowcount
    
    deleted = asyncio.run(_cleanup())
    logger.info(f"Cleaned up {deleted} old execution logs")
    return {"deleted": deleted}


@celery_app.task(name="app.tasks.celery_tasks.send_welcome_email")
def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email to a new user."""
    import asyncio
    from app.services.email_service import EmailService
    
    async def _send():
        email_service = EmailService()
        return await email_service.send_welcome_email(user_email, user_name)
    
    success = asyncio.run(_send())
    return {"success": success, "email": user_email}
