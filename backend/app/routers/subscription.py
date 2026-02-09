from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.firebase_client import get_firebase_db
import logging

router = APIRouter(prefix="/subscription", tags=["subscription"])
logger = logging.getLogger(__name__)

class UpgradeRequest(BaseModel):
    user_id: str
    tier: str  # "free" or "premium"

@router.post("/upgrade")
async def upgrade_user_tier(request: UpgradeRequest):
    """
    Manually upgrade or downgrade a user's tier.
    This acts as a 'dummy gateway' for testing premium features.
    """
    db = get_firebase_db()
    
    try:
        # 1. Update User Document
        user_ref = db.collection("users").document(request.user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create if doesn't exist (for testing)
            user_ref.set({
                "tier": request.tier,
                "created_at": "2024-01-01T00:00:00Z"
            })
        else:
            user_ref.update({"tier": request.tier})
            
        logger.info(f"User {request.user_id} upgraded to {request.tier}")
        
        return {
            "status": "success", 
            "message": f"User {request.user_id} is now on {request.tier} tier",
            "tier": request.tier
        }
            
    except Exception as e:
        logger.error(f"Failed to upgrade user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
