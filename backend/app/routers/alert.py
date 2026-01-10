"""Alert API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Alert
from app.schemas.alert import AlertResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/{startup_id}", response_model=list[AlertResponse])
async def get_startup_alerts(
    startup_id: int,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all alerts for a startup.
    
    Args:
        startup_id: ID of the startup
        active_only: If True, only return active alerts
        
    Returns:
        List of alerts sorted by severity and creation time
    """
    query = select(Alert).where(Alert.startup_id == startup_id)
    
    if active_only:
        query = query.where(Alert.is_active == True)
    
    # Order by severity (critical first) and creation time
    query = query.order_by(Alert.severity.desc(), Alert.created_at.desc())
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return [AlertResponse.model_validate(a) for a in alerts]


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Dismiss an alert (mark as inactive)."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_active = False
    await db.commit()
    
    return {"message": "Alert dismissed", "alert_id": alert_id}


@router.get("/severity/{severity}", response_model=list[AlertResponse])
async def get_alerts_by_severity(
    severity: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all active alerts by severity level."""
    result = await db.execute(
        select(Alert)
        .where(Alert.severity == severity, Alert.is_active == True)
        .order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()
    
    return [AlertResponse.model_validate(a) for a in alerts]
