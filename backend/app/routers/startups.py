"""Startup management API routes using Firestore."""
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from google.cloud import firestore

from app.firebase_client import get_firebase_db
from app.routers.auth import require_auth, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/startups", tags=["Startups"])


# ===== Schemas =====

class StartupListItem(BaseModel):
    """Startup list item response."""
    id: str  # Firestore IDs are strings
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
    user: dict = Depends(require_auth)
):
    """List all startups for the current user."""
    db = get_firebase_db()
    uid = str(user.get("uid")) # Actually Firestore user IDs are strings (e.g. from Firebase Auth) - but let's check migration
    # The migration used str(user.id) from SQL (int) as Doc ID for User.
    # New users from Firebase Auth have a string UID (e.g. "AbCdEf123").
    # We should query by 'user_id' field on startup doc. 
    # But wait, original migration copied `user_id` as INTEGER from SQL.
    # New startups created via Firebase Auth will have string UID.
    # We need to handle this discrepancy or assume migration mapped SQL IDs to new UIDs? No, it didn't.
    # Implementation detail: New startups will own the `uid` from Firebase.
    
    # Query: startups where user_id == uid
    # Note: If migrating users, we should have mapped their SQL ID to Firebase UID if possible, but we couldn't properly.
    # So old startups are owned by "1", "2". New startups owned by "firebase_uid".
    # For now, we assume this user is NEW or we match string representation.
    
    startups_ref = db.collection("startups")
    query = startups_ref.where(filter=firestore.FieldFilter("user_id", "==", uid if not uid.isnumeric() else int(uid)))
    
    if status:
        query = query.where(filter=firestore.FieldFilter("status", "==", status))
    
    query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
    
    docs = query.stream()
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        # Handle datetime serialization
        created_at = data.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        
        updated_at = data.get("updated_at")
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()

        results.append(StartupListItem(
            id=doc.id,
            name=data.get("name"),
            domain=data.get("domain", ""),
            goal=data.get("goal", ""),
            status=data.get("status", "active"),
            created_at=str(created_at),
            updated_at=str(updated_at)
        ))
    
    return results


@router.get("/all", response_model=List[StartupListItem])
async def list_all_startups(
    limit: int = Query(20, ge=1, le=100),
    user: Optional[dict] = Depends(get_current_user)
):
    """List all startups (for demo/unauthenticated users)."""
    db = get_firebase_db()
    startups_ref = db.collection("startups")
    query = startups_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
    
    docs = query.stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        created_at = data.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
            
        updated_at = data.get("updated_at")
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()

        results.append(StartupListItem(
            id=doc.id,
            name=data.get("name"),
            domain=data.get("domain", ""),
            goal=data.get("goal", ""),
            status=data.get("status", "active"),
            created_at=str(created_at),
            updated_at=str(updated_at)
        ))
    return results


@router.post("/", response_model=StartupListItem)
async def create_startup(
    data: StartupCreate,
    user: dict = Depends(require_auth)
):
    """Create a new startup."""
    db = get_firebase_db()
    
    new_startup = {
        "user_id": user.get("uid"),
        "name": data.name,
        "goal": data.goal,
        "domain": data.domain,
        "team_size": data.team_size,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Add to Firestore
    # Use generic document ID
    update_time, doc_ref = db.collection("startups").add(new_startup)
    
    return StartupListItem(
        id=doc_ref.id,
        name=new_startup["name"],
        domain=new_startup["domain"],
        goal=new_startup["goal"],
        status=new_startup["status"],
        created_at=new_startup["created_at"].isoformat(),
        updated_at=new_startup["updated_at"].isoformat()
    )


@router.get("/{startup_id}", response_model=StartupListItem)
async def get_startup(
    startup_id: str,
    user: Optional[dict] = Depends(get_current_user)
):
    """Get a specific startup by ID."""
    db = get_firebase_db()
    doc_ref = db.collection("startups").document(startup_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    data = doc.to_dict()
    
    # Optional: Check permission? 
    # For now allowing public read as per original "list_all"
    
    created_at = data.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
        
    updated_at = data.get("updated_at")
    if isinstance(updated_at, datetime):
        updated_at = updated_at.isoformat()

    return StartupListItem(
        id=doc.id,
        name=data.get("name"),
        domain=data.get("domain", ""),
        goal=data.get("goal", ""),
        status=data.get("status", "active"),
        created_at=str(created_at),
        updated_at=str(updated_at)
    )


@router.patch("/{startup_id}", response_model=StartupListItem)
async def update_startup(
    startup_id: str,
    data: StartupUpdate,
    user: dict = Depends(require_auth)
):
    """Update a startup."""
    db = get_firebase_db()
    doc_ref = db.collection("startups").document(startup_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup_data = doc.to_dict()
    
    # Verify ownership
    # Handle int vs str uid mismatch if legacy data exists
    owner_id = str(startup_data.get("user_id"))
    current_uid = str(user.get("uid"))
    
    if owner_id != current_uid:
         raise HTTPException(status_code=403, detail="Not authorized to update this startup")
    
    updates = {"updated_at": datetime.utcnow()}
    if data.name is not None:
        updates["name"] = data.name
    if data.status is not None:
        updates["status"] = data.status
        
    doc_ref.update(updates)
    
    # Return updated
    updated_doc = doc_ref.get()
    updated_data = updated_doc.to_dict()
    
    created_at = updated_data.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
        
    updated_at = updated_data.get("updated_at")
    if isinstance(updated_at, datetime):
        updated_at = updated_at.isoformat()

    return StartupListItem(
        id=updated_doc.id,
        name=updated_data.get("name"),
        domain=updated_data.get("domain", ""),
        goal=updated_data.get("goal", ""),
        status=updated_data.get("status", "active"),
        created_at=str(created_at),
        updated_at=str(updated_at)
    )


@router.delete("/{startup_id}")
async def delete_startup(
    startup_id: str,
    user: dict = Depends(require_auth)
):
    """Delete (archive) a startup."""
    db = get_firebase_db()
    doc_ref = db.collection("startups").document(startup_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    startup_data = doc.to_dict()
    
    owner_id = str(startup_data.get("user_id"))
    current_uid = str(user.get("uid"))
    
    if owner_id != current_uid:
         raise HTTPException(status_code=403, detail="Not authorized to delete this startup")
    
    doc_ref.update({"status": "archived"})
    
    return {"message": "Startup archived", "id": startup_id}
