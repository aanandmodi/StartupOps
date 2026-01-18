"""Slack integration service for notifications and daily standups."""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SlackService:
    """Service for Slack integration."""
    
    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token or settings.slack_bot_token
        self._client = None
    
    def _get_client(self):
        """Get Slack client."""
        if not self._client:
            if not self.bot_token:
                logger.warning("No Slack bot token configured")
                return None
            try:
                from slack_sdk import WebClient
                self._client = WebClient(token=self.bot_token)
            except ImportError:
                logger.error("slack-sdk not installed")
                return None
        return self._client
    
    async def send_message(
        self,
        channel: str,
        text: str,
        blocks: Optional[List[Dict]] = None
    ) -> bool:
        """Send a message to a Slack channel."""
        client = self._get_client()
        if not client:
            return False
        
        try:
            response = client.chat_postMessage(
                channel=channel,
                text=text,
                blocks=blocks
            )
            logger.info(f"Sent Slack message to {channel}")
            return response["ok"]
        except Exception as e:
            logger.error(f"Failed to send Slack message: {e}")
            return False
    
    async def send_alert(
        self,
        channel: str,
        severity: str,
        message: str,
        recommended_action: Optional[str] = None
    ) -> bool:
        """Send an alert notification to Slack."""
        emoji = {
            "critical": "🚨",
            "warning": "⚠️",
            "info": "ℹ️"
        }.get(severity.lower(), "📢")
        
        color = {
            "critical": "#FF0000",
            "warning": "#FFA500",
            "info": "#0066FF"
        }.get(severity.lower(), "#808080")
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} StartupOps Alert"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Severity:*\n{severity.upper()}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:*\n{datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Message:*\n{message}"
                }
            }
        ]
        
        if recommended_action:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Recommended Action:*\n{recommended_action}"
                }
            })
        
        return await self.send_message(
            channel=channel,
            text=f"{emoji} {severity.upper()}: {message}",
            blocks=blocks
        )
    
    async def send_daily_standup(
        self,
        channel: str,
        startup_name: str,
        yesterday_summary: str,
        today_priorities: List[str],
        blockers: List[str],
        health_score: int
    ) -> bool:
        """Send a daily standup report to Slack."""
        health_emoji = "🟢" if health_score >= 70 else "🟡" if health_score >= 40 else "🔴"
        
        priorities_text = "\n".join([f"• {p}" for p in today_priorities[:5]])
        blockers_text = "\n".join([f"• {b}" for b in blockers[:3]]) if blockers else "None"
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🌅 Daily Standup: {startup_name}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📅 {datetime.now().strftime('%A, %B %d, %Y')} | {health_emoji} Health: {health_score}%"
                    }
                ]
            },
            {"type": "divider"},
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📋 Yesterday's Progress:*\n{yesterday_summary}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🎯 Today's Priorities:*\n{priorities_text}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🚧 Blockers:*\n{blockers_text}"
                }
            },
            {"type": "divider"},
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "_Powered by StartupOps AI Co-Founders_"
                    }
                ]
            }
        ]
        
        return await self.send_message(
            channel=channel,
            text=f"🌅 Daily Standup for {startup_name}",
            blocks=blocks
        )
    
    async def send_task_update(
        self,
        channel: str,
        task_title: str,
        old_status: str,
        new_status: str,
        updated_by: str = "System"
    ) -> bool:
        """Send a task status update to Slack."""
        status_emoji = {
            "pending": "⏳",
            "in_progress": "🔄",
            "done": "✅",
            "blocked": "🚫"
        }
        
        old_emoji = status_emoji.get(old_status.lower(), "❓")
        new_emoji = status_emoji.get(new_status.lower(), "❓")
        
        text = f"Task Update: *{task_title}*\n{old_emoji} {old_status} → {new_emoji} {new_status}"
        
        return await self.send_message(
            channel=channel,
            text=text,
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": text
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"Updated by {updated_by} at {datetime.now().strftime('%H:%M')}"
                        }
                    ]
                }
            ]
        )
