"""Integrations API routes."""
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.routers.auth import require_auth
from app.services.github_service import GitHubService
from app.services.slack_service import SlackService
from app.services.standup_service import StandupService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations", tags=["Integrations"])


# --- Schemas ---

class GitHubIssueRequest(BaseModel):
    repo: str
    title: str
    body: str
    labels: Optional[List[str]] = None


class SlackMessageRequest(BaseModel):
    channel: str
    message: str


class StandupRequest(BaseModel):
    startup_id: int
    slack_channel: Optional[str] = None
    email: Optional[str] = None


# --- GitHub Routes ---

@router.post("/github/issue")
async def create_github_issue(
    request: GitHubIssueRequest,
    access_token: str = Query(..., description="GitHub access token"),
    user: User = Depends(require_auth)
):
    """Create a GitHub issue."""
    github = GitHubService(access_token=access_token)
    
    issue = await github.create_issue(
        repo_name=request.repo,
        title=request.title,
        body=request.body,
        labels=request.labels
    )
    
    if not issue:
        raise HTTPException(status_code=500, detail="Failed to create issue")
    
    return {
        "success": True,
        "issue_number": issue.issue_number,
        "url": issue.url
    }


@router.post("/github/sync-tasks/{startup_id}")
async def sync_tasks_to_github(
    startup_id: int,
    repo: str = Query(..., description="Repository name (owner/repo)"),
    access_token: str = Query(..., description="GitHub access token"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Sync all tasks from a startup to GitHub issues."""
    from sqlalchemy import select
    from app.models import Task
    
    # Get tasks
    result = await db.execute(
        select(Task).where(Task.startup_id == startup_id)
    )
    tasks = result.scalars().all()
    
    if not tasks:
        raise HTTPException(status_code=404, detail="No tasks found")
    
    # Convert to dicts
    task_dicts = [
        {
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "estimated_days": t.estimated_days,
            "category": t.category.value,
            "status": t.status.value
        }
        for t in tasks
    ]
    
    github = GitHubService(access_token=access_token)
    issues = await github.sync_tasks_to_issues(repo, task_dicts)
    
    return {
        "success": True,
        "issues_created": len(issues),
        "issues": [{"title": i.title, "url": i.url} for i in issues]
    }


# --- Slack Routes ---

@router.post("/slack/message")
async def send_slack_message(
    request: SlackMessageRequest,
    user: User = Depends(require_auth)
):
    """Send a message to a Slack channel."""
    slack = SlackService()
    
    success = await slack.send_message(
        channel=request.channel,
        text=request.message
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send message")
    
    return {"success": True, "message": "Message sent"}


@router.post("/slack/alert/{startup_id}")
async def send_slack_alert(
    startup_id: int,
    channel: str = Query(..., description="Slack channel"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Send latest alerts for a startup to Slack."""
    from sqlalchemy import select
    from app.models import Alert
    
    result = await db.execute(
        select(Alert)
        .where(Alert.startup_id == startup_id)
        .where(Alert.is_active == True)
        .limit(5)
    )
    alerts = result.scalars().all()
    
    if not alerts:
        return {"success": True, "message": "No active alerts"}
    
    slack = SlackService()
    sent = 0
    
    for alert in alerts:
        success = await slack.send_alert(
            channel=channel,
            severity=alert.severity.value,
            message=alert.message,
            recommended_action=alert.recommended_action
        )
        if success:
            sent += 1
    
    return {"success": True, "alerts_sent": sent}


# --- Standup Routes ---

@router.post("/standup/generate")
async def generate_standup(
    request: StandupRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Generate and optionally send a daily standup."""
    standup_service = StandupService(db)
    
    standup = await standup_service.generate_standup(request.startup_id)
    
    if not standup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    result = {
        "success": True,
        "standup": {
            "startup_name": standup.startup_name,
            "generated_at": standup.generated_at.isoformat(),
            "yesterday_summary": standup.yesterday_summary,
            "today_priorities": standup.today_priorities,
            "blockers": standup.blockers,
            "recommendations": standup.recommendations,
            "health_score": standup.health_score,
            "metrics": {
                "completed_yesterday": standup.tasks_completed_yesterday,
                "in_progress": standup.tasks_in_progress,
                "blocked": standup.tasks_blocked
            }
        },
        "sent_to": []
    }
    
    # Send to Slack if channel provided
    if request.slack_channel:
        sent = await standup_service.send_standup_to_slack(
            standup, request.slack_channel
        )
        if sent:
            result["sent_to"].append(f"slack:{request.slack_channel}")
    
    # Send email if provided
    if request.email:
        sent = await standup_service.send_standup_email(
            standup, request.email
        )
        if sent:
            result["sent_to"].append(f"email:{request.email}")
    
    return result
