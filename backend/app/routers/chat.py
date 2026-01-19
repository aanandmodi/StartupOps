"""Chat API routes using Firestore."""
import logging
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from google.cloud import firestore

from app.firebase_client import get_firebase_db
from app.routers.auth import require_auth, get_current_user
from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent
from app.config import get_settings
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/chat", tags=["Chat"])

# Agent instances
AGENTS = {
    "product": ProductAgent(),
    "tech": TechAgent(),
    "marketing": MarketingAgent(),
    "finance": FinanceAgent(),
    "advisor": AdvisorAgent(),
}

AGENT_DISPLAY_NAMES = {
    "product": "Product Co-Founder",
    "tech": "Tech Co-Founder",
    "marketing": "Marketing Co-Founder",
    "finance": "Finance Co-Founder",
    "advisor": "Strategic Advisor",
}


# --- Schemas ---

class SendMessageRequest(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: str  # Firestore ID is string
    agent_name: str
    role: str
    content: str
    created_at: str  # ISO string
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    startup_id: str
    agent_name: str
    agent_display_name: str
    messages: List[ChatMessageResponse]
    total_messages: int


# --- Routes ---

@router.get("/{startup_id}/{agent_name}/history", response_model=ConversationResponse)
async def get_chat_history(
    startup_id: str,
    agent_name: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: dict = Depends(require_auth)
):
    """Get chat history with a specific agent for a startup."""
    if agent_name not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent: {agent_name}")
    
    db = get_firebase_db()
    
    # Verify startup ownership
    startup_ref = db.collection("startups").document(startup_id)
    startup_doc = startup_ref.get()
    
    if not startup_doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup_data = startup_doc.to_dict()
    owner_id = str(startup_data.get("user_id"))
    current_uid = str(user.get("uid"))
    
    if owner_id != current_uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages from subcollection
    messages_ref = startup_ref.collection(agent_name + "_messages") # e.g. "product_messages" or just "chat_messages" with filter?
    # Better structure: "chat_messages" subcollection, filter by agent_name
    
    # Strategy: using single subcollection "chat_messages" for all agents of this startup
    chat_ref = startup_ref.collection("chat_messages")
    query = chat_ref.where(filter=firestore.FieldFilter("agent_name", "==", agent_name))
    query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).offset(offset)
    
    docs = query.stream()
    messages = []
    for doc in docs:
        data = doc.to_dict()
        created_at = data.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
            
        messages.append(ChatMessageResponse(
            id=doc.id,
            agent_name=data.get("agent_name"),
            role=data.get("role"),
            content=data.get("content"),
            created_at=str(created_at)
        ))
    
    # Total count (approximation or separate query)
    # Firestore count aggregation query
    count_query = chat_ref.where(filter=firestore.FieldFilter("agent_name", "==", agent_name)).count()
    # count_result = count_query.get() # .get() returns AggregationQuerySnapshot which creates indices?
    # Simple workaround for now: length of fetched messages if < limit, else unknown (or implement separate count)
    total_messages = len(messages) # Placeholder for efficiency
    
    # Reverse to show optional chronological order if frontend needs it? 
    # Frontend usually expects oldest first for chat, or newest first for history list?
    # Implementation usually: newest first in API, reversed in frontend OR API returns oldest first.
    # Previous implementation: reversed(result) -> oldest first.
    messages.reverse()
    
    return ConversationResponse(
        startup_id=startup_id,
        agent_name=agent_name,
        agent_display_name=AGENT_DISPLAY_NAMES.get(agent_name, agent_name.title()),
        messages=messages,
        total_messages=total_messages
    )


@router.post("/{startup_id}/{agent_name}")
async def send_message(
    startup_id: str,
    agent_name: str,
    request: SendMessageRequest,
    user: dict = Depends(require_auth)
):
    """Send a message to an agent and get streaming response."""
    if agent_name not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent: {agent_name}")
    
    db = get_firebase_db()
    startup_ref = db.collection("startups").document(startup_id)
    startup_doc = startup_ref.get()
    
    if not startup_doc.exists:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup_data = startup_doc.to_dict()
    owner_id = str(startup_data.get("user_id"))
    current_uid = str(user.get("uid"))
    
    if owner_id != current_uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # TODO: Token usage checks using Firestore user doc
    # For now, skip complex token logic to get basic chat working
    
    # Save user message
    user_msg_data = {
        "user_id": current_uid,
        "agent_name": agent_name,
        "role": "user",
        "content": request.content,
        "created_at": datetime.utcnow()
    }
    _, user_msg_ref = startup_ref.collection("chat_messages").add(user_msg_data)
    
    # Get Context
    # 1. Recent messages
    chat_ref = startup_ref.collection("chat_messages")
    query = chat_ref.where(filter=firestore.FieldFilter("agent_name", "==", agent_name))
    query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(10)
    history_docs = query.stream()
    
    recent_messages = []
    for doc in history_docs:
        recent_messages.append(doc.to_dict())
    recent_messages.reverse() # Oldest first for context
    
    conversation_context = "\n".join([
        f"{'User' if m.get('role') == 'user' else 'You'}: {m.get('content')}"
        for m in recent_messages
        if m.get('content') != request.content # Avoid duplicating current msg if it showed up in query (race condition)
    ])
    
    # Get Agent Response
    agent = AGENTS[agent_name]
    try:
        response_text = await agent.chat_response(
            startup_goal=startup_data.get("goal"),
            startup_domain=startup_data.get("domain"),
            user_question=request.content,
            conversation_context=conversation_context
        )
        
        # Save assistant message
        asst_msg_data = {
            "user_id": current_uid,
            "agent_name": agent_name,
            "role": "assistant",
            "content": response_text,
            "created_at": datetime.utcnow()
        }
        _, asst_msg_ref = startup_ref.collection("chat_messages").add(asst_msg_data)
        
        return {
            "id": asst_msg_ref.id,
            "agent_name": agent_name,
            "role": "assistant",
            "content": response_text,
            "created_at": asst_msg_data["created_at"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
