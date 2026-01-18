"""GitHub integration service for creating issues and syncing tasks."""
import logging
from typing import Optional, List
from dataclasses import dataclass

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class GitHubIssue:
    """GitHub issue data."""
    title: str
    body: str
    labels: List[str]
    repo: str
    issue_number: Optional[int] = None
    url: Optional[str] = None


class GitHubService:
    """Service for GitHub integration."""
    
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token
        self._github = None
    
    def _get_client(self):
        """Get GitHub client."""
        if not self._github:
            try:
                from github import Github
                if self.access_token:
                    self._github = Github(self.access_token)
                else:
                    logger.warning("No GitHub access token provided")
                    return None
            except ImportError:
                logger.error("PyGithub not installed")
                return None
        return self._github
    
    async def create_issue(
        self,
        repo_name: str,
        title: str,
        body: str,
        labels: Optional[List[str]] = None
    ) -> Optional[GitHubIssue]:
        """Create an issue in a GitHub repository."""
        client = self._get_client()
        if not client:
            return None
        
        try:
            repo = client.get_repo(repo_name)
            issue = repo.create_issue(
                title=title,
                body=body,
                labels=labels or []
            )
            
            logger.info(f"Created GitHub issue: {issue.html_url}")
            
            return GitHubIssue(
                title=title,
                body=body,
                labels=labels or [],
                repo=repo_name,
                issue_number=issue.number,
                url=issue.html_url
            )
        except Exception as e:
            logger.error(f"Failed to create GitHub issue: {e}")
            return None
    
    async def sync_tasks_to_issues(
        self,
        repo_name: str,
        tasks: List[dict]
    ) -> List[GitHubIssue]:
        """Sync startup tasks to GitHub issues."""
        created_issues = []
        
        for task in tasks:
            title = task.get("title", "Untitled Task")
            body = self._format_task_body(task)
            labels = self._get_labels_for_category(task.get("category", ""))
            
            issue = await self.create_issue(
                repo_name=repo_name,
                title=title,
                body=body,
                labels=labels
            )
            
            if issue:
                created_issues.append(issue)
        
        return created_issues
    
    def _format_task_body(self, task: dict) -> str:
        """Format task as GitHub issue body."""
        description = task.get("description", "No description provided")
        priority = task.get("priority", 3)
        estimated_days = task.get("estimated_days", 1)
        category = task.get("category", "unknown")
        
        return f"""## Task Details

**Category:** {category}
**Priority:** {'🔴' if priority == 1 else '🟡' if priority == 2 else '🟢'} P{priority}
**Estimated Days:** {estimated_days}

## Description

{description}

---
*Created by StartupOps AI Co-Founder Platform*
"""
    
    def _get_labels_for_category(self, category: str) -> List[str]:
        """Get GitHub labels for task category."""
        category_labels = {
            "product": ["product", "feature"],
            "tech": ["tech", "engineering"],
            "marketing": ["marketing", "growth"],
            "finance": ["finance", "operations"],
        }
        return category_labels.get(category.lower(), ["task"])
