"""SendGrid email service for sending emails."""
import logging
from typing import Optional, List
from datetime import datetime

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """Service for sending emails via SendGrid."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.sendgrid_api_key
        self._client = None
    
    def _get_client(self):
        """Get SendGrid client."""
        if not self._client:
            if not self.api_key:
                logger.warning("No SendGrid API key configured")
                return None
            try:
                from sendgrid import SendGridAPIClient
                self._client = SendGridAPIClient(self.api_key)
            except ImportError:
                logger.error("sendgrid package not installed")
                return None
        return self._client
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = "noreply@startupops.ai"
    ) -> bool:
        """Send an email using SendGrid."""
        client = self._get_client()
        if not client:
            logger.warning("Email not sent - no SendGrid client")
            return False
        
        try:
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = client.send(message)
            logger.info(f"Email sent to {to_email}, status: {response.status_code}")
            return response.status_code in (200, 201, 202)
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_standup_email(
        self,
        to_email: str,
        startup_name: str,
        yesterday_summary: str,
        today_priorities: List[str],
        blockers: List[str],
        health_score: int
    ) -> bool:
        """Send a daily standup email."""
        health_color = "#22c55e" if health_score >= 70 else "#eab308" if health_score >= 40 else "#ef4444"
        
        priorities_html = "".join([f"<li>{p}</li>" for p in today_priorities[:5]])
        blockers_html = "".join([f"<li style='color:#ef4444'>{b}</li>" for b in blockers[:3]]) if blockers else "<li style='color:#22c55e'>None</li>"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 30px; }}
        h1 {{ color: #6366f1; margin-bottom: 5px; }}
        .date {{ color: #9ca3af; font-size: 14px; margin-bottom: 20px; }}
        .health {{ display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: bold; }}
        .section {{ margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; }}
        .section h3 {{ margin: 0 0 10px 0; color: #e5e7eb; }}
        ul {{ margin: 10px 0; padding-left: 20px; }}
        li {{ margin: 5px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #6b7280; font-size: 12px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🌅 Daily Standup</h1>
        <div class="date">{startup_name} • {datetime.now().strftime('%A, %B %d, %Y')}</div>
        
        <div style="text-align: center; margin: 20px 0;">
            <span class="health" style="background: {health_color}20; color: {health_color};">
                Health Score: {health_score}%
            </span>
        </div>
        
        <div class="section">
            <h3>📋 Yesterday's Progress</h3>
            <p>{yesterday_summary}</p>
        </div>
        
        <div class="section">
            <h3>🎯 Today's Priorities</h3>
            <ul>{priorities_html}</ul>
        </div>
        
        <div class="section">
            <h3>🚧 Blockers</h3>
            <ul>{blockers_html}</ul>
        </div>
        
        <div class="footer">
            Powered by StartupOps AI Co-Founders<br>
            <a href="{settings.frontend_url}" style="color: #6366f1;">Open Dashboard</a>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=to_email,
            subject=f"🌅 Daily Standup: {startup_name}",
            html_content=html_content
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str
    ) -> bool:
        """Send a welcome email to new users."""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 30px; }}
        h1 {{ color: #6366f1; }}
        .cta {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
        .agent {{ display: inline-block; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 5px; }}
        .footer {{ margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to StartupOps! 🚀</h1>
        <p>Hi {user_name},</p>
        <p>You've just unlocked access to your AI co-founding team:</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <span class="agent">🎯 Product</span>
            <span class="agent">⚙️ Tech</span>
            <span class="agent">📣 Marketing</span>
            <span class="agent">💰 Finance</span>
            <span class="agent">🧠 Advisor</span>
        </div>
        
        <p>Your AI co-founders are ready to help you:</p>
        <ul>
            <li>Plan your MVP and features</li>
            <li>Design your technical architecture</li>
            <li>Create marketing strategies</li>
            <li>Build financial projections</li>
            <li>Make strategic decisions</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="{settings.frontend_url}" class="cta">Get Started →</a>
        </div>
        
        <div class="footer">
            Questions? Just reply to this email.<br>
            © 2026 StartupOps. All rights reserved.
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=to_email,
            subject="Welcome to StartupOps! 🚀",
            html_content=html_content
        )
    
    async def send_alert_email(
        self,
        to_email: str,
        startup_name: str,
        alert_severity: str,
        alert_message: str,
        recommended_action: Optional[str] = None
    ) -> bool:
        """Send an alert notification email."""
        severity_colors = {
            "critical": "#ef4444",
            "warning": "#eab308",
            "info": "#3b82f6"
        }
        color = severity_colors.get(alert_severity.lower(), "#6b7280")
        
        action_html = f"<p><strong>Recommended Action:</strong> {recommended_action}</p>" if recommended_action else ""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 30px; border-left: 4px solid {color}; }}
        .severity {{ display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .cta {{ display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; }}
    </style>
</head>
<body>
    <div class="container">
        <span class="severity" style="background: {color}20; color: {color};">{alert_severity}</span>
        <h2 style="margin-top: 15px;">🚨 Alert: {startup_name}</h2>
        <p>{alert_message}</p>
        {action_html}
        <div style="margin-top: 20px;">
            <a href="{settings.frontend_url}/plan" class="cta">View Dashboard</a>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=to_email,
            subject=f"🚨 [{alert_severity.upper()}] {startup_name}: {alert_message[:50]}...",
            html_content=html_content
        )
