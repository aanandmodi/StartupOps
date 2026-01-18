"""Startup management API routes."""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Startup, User
from app.routers.auth import require_auth, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/startups", tags=["Startups"])


# ===== Schemas =====

class StartupListItem(BaseModel):
    """Startup list item response."""
    id: int
    name: Optional[str]
    domain: str
    goal: str
    status: str
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True


class StartupCreate(BaseModel):
    """Create startup request."""
    goal: str
    domain: str
    team_size: int = 1
    name: Optional[str] = None


class StartupUpdate(BaseModel):
    """Update startup request."""
    name: Optional[str] = None
    status: Optional[str] = None


# ===== Routes =====

@router.get("/", response_model=List[StartupListItem])
async def list_my_startups(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """List all startups for the current user."""
    query = select(Startup).where(Startup.user_id == user.id)
    
    if status:
        query = query.where(Startup.status == status)
    
    query = query.order_by(desc(Startup.created_at)).limit(limit)
    
    result = await db.execute(query)
    startups = result.scalars().all()
    
    return [
        StartupListItem(
            id=s.id,
            name=s.name,
            domain=s.domain,
            goal=s.goal,
            status=s.status or "active",
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat() if s.updated_at else None
        )
        for s in startups
    ]


@router.get("/all", response_model=List[StartupListItem])
async def list_all_startups(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """List all startups (for demo/unauthenticated users)."""
    query = select(Startup).order_by(desc(Startup.created_at)).limit(limit)
    
    result = await db.execute(query)
    startups = result.scalars().all()
    
    return [
        StartupListItem(
            id=s.id,
            name=s.name,
            domain=s.domain,
            goal=s.goal,
            status=s.status or "active",
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat() if s.updated_at else None
        )
        for s in startups
    ]


@router.get("/{startup_id}", response_model=StartupListItem)
async def get_startup(
    startup_id: int,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Get a specific startup by ID."""
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    return StartupListItem(
        id=startup.id,
        name=startup.name,
        domain=startup.domain,
        goal=startup.goal,
        status=startup.status or "active",
        created_at=startup.created_at.isoformat(),
        updated_at=startup.updated_at.isoformat() if startup.updated_at else None
    )


@router.patch("/{startup_id}", response_model=StartupListItem)
async def update_startup(
    startup_id: int,
    data: StartupUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Update a startup."""
    result = await db.execute(
        select(Startup)
        .where(Startup.id == startup_id)
        .where(Startup.user_id == user.id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if data.name is not None:
        startup.name = data.name
    if data.status is not None:
        startup.status = data.status
    
    await db.commit()
    await db.refresh(startup)
    
    return StartupListItem(
        id=startup.id,
        name=startup.name,
        domain=startup.domain,
        goal=startup.goal,
        status=startup.status or "active",
        created_at=startup.created_at.isoformat(),
        updated_at=startup.updated_at.isoformat() if startup.updated_at else None
    )


@router.delete("/{startup_id}")
async def delete_startup(
    startup_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Delete (archive) a startup."""
    result = await db.execute(
        select(Startup)
        .where(Startup.id == startup_id)
        .where(Startup.user_id == user.id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    # Soft delete by setting status to archived
    startup.status = "archived"
    await db.commit()
    
    return {"message": "Startup archived", "id": startup_id}
