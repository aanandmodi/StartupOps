"""Chat API routes for agent conversations."""
import logging
import json
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Startup, ChatMessage, AgentMemory
from app.models.user import User
from app.routers.auth import get_current_user, require_auth
from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent
from app.config import get_settings

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
    id: int
    agent_name: str
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    startup_id: int
    agent_name: str
    agent_display_name: str
    messages: List[ChatMessageResponse]
    total_messages: int


# --- Routes ---

@router.get("/{startup_id}/{agent_name}/history", response_model=ConversationResponse)
async def get_chat_history(
    startup_id: int,
    agent_name: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Get chat history with a specific agent for a startup."""
    if agent_name not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent: {agent_name}")
    
    # Verify startup ownership
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if startup.user_id and startup.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.startup_id == startup_id)
        .where(ChatMessage.agent_name == agent_name)
        .order_by(desc(ChatMessage.created_at))
        .limit(limit)
        .offset(offset)
    )
    messages = list(reversed(result.scalars().all()))
    
    # Get total count
    count_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.startup_id == startup_id)
        .where(ChatMessage.agent_name == agent_name)
    )
    total = len(count_result.scalars().all())
    
    return ConversationResponse(
        startup_id=startup_id,
        agent_name=agent_name,
        agent_display_name=AGENT_DISPLAY_NAMES.get(agent_name, agent_name.title()),
        messages=[ChatMessageResponse.model_validate(m) for m in messages],
        total_messages=total
    )


@router.post("/{startup_id}/{agent_name}")
async def send_message(
    startup_id: int,
    agent_name: str,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Send a message to an agent and get streaming response."""
    if agent_name not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent: {agent_name}")
    
    # Verify startup
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if startup.user_id and startup.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save user message
    user_message = ChatMessage(
        startup_id=startup_id,
        user_id=user.id,
        agent_name=agent_name,
        role="user",
        content=request.content
    )
    db.add(user_message)
    await db.commit()
    
    # Get recent conversation context
    context_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.startup_id == startup_id)
        .where(ChatMessage.agent_name == agent_name)
        .order_by(desc(ChatMessage.created_at))
        .limit(10)
    )
    recent_messages = list(reversed(context_result.scalars().all()))
    
    # Build context for the agent
    conversation_context = "\n".join([
        f"{'User' if m.role == 'user' else 'You'}: {m.content}"
        for m in recent_messages[:-1]  # Exclude the current message
    ])
    
    # Get agent response
    agent = AGENTS[agent_name]
    
    try:
        # Create chat-specific prompt
        chat_input = {
            "startup_goal": startup.goal,
            "startup_domain": startup.domain,
            "team_size": startup.team_size,
            "conversation_context": conversation_context,
            "user_question": request.content,
            "chat_mode": True
        }
        
        start_time = datetime.utcnow()
        response = await agent.run(chat_input)
        end_time = datetime.utcnow()
        response_time = int((end_time - start_time).total_seconds() * 1000)
        
        # Extract response text
        if isinstance(response, dict):
            response_text = response.get("response", response.get("answer", json.dumps(response, indent=2)))
        else:
            response_text = str(response)
        
        # Save assistant message
        assistant_message = ChatMessage(
            startup_id=startup_id,
            user_id=user.id,
            agent_name=agent_name,
            role="assistant",
            content=response_text,
            response_time_ms=response_time
        )
        db.add(assistant_message)
        await db.commit()
        await db.refresh(assistant_message)
        
        return ChatMessageResponse.model_validate(assistant_message)
        
    except Exception as e:
        logger.error(f"Chat error with {agent_name}: {e}")
        
        # Save error response
        error_message = ChatMessage(
            startup_id=startup_id,
            user_id=user.id,
            agent_name=agent_name,
            role="assistant",
            content=f"I apologize, but I encountered an error: {str(e)}. Please try again."
        )
        db.add(error_message)
        await db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Agent error: {str(e)}"
        )


@router.delete("/{startup_id}/{agent_name}")
async def clear_chat_history(
    startup_id: int,
    agent_name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth)
):
    """Clear chat history with a specific agent."""
    if agent_name not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent: {agent_name}")
    
    # Verify startup ownership
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if startup.user_id and startup.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete messages
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.startup_id == startup_id)
        .where(ChatMessage.agent_name == agent_name)
    )
    messages = result.scalars().all()
    
    for msg in messages:
        await db.delete(msg)
    
    await db.commit()
    
    return {"message": f"Cleared {len(messages)} messages"}


@router.get("/{startup_id}/agents")
async def list_available_agents(
    startup_id: int,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """List available agents for a startup."""
    # Verify startup exists
    result = await db.execute(
        select(Startup).where(Startup.id == startup_id)
    )
    startup = result.scalar_one_or_none()
    
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    agents = []
    for name, display_name in AGENT_DISPLAY_NAMES.items():
        # Get last message time
        msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.startup_id == startup_id)
            .where(ChatMessage.agent_name == name)
            .order_by(desc(ChatMessage.created_at))
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()
        
        agents.append({
            "name": name,
            "display_name": display_name,
            "last_message_at": last_msg.created_at if last_msg else None,
            "description": get_agent_description(name)
        })
    
    return {"startup_id": startup_id, "agents": agents}


def get_agent_description(agent_name: str) -> str:
    """Get description for an agent."""
    descriptions = {
        "product": "Helps with product strategy, MVP features, and user experience",
        "tech": "Advises on technical architecture, stack choices, and implementation",
        "marketing": "Creates marketing strategies, content plans, and growth tactics",
        "finance": "Handles budgeting, runway calculations, and financial planning",
        "advisor": "Provides strategic oversight, recommendations, and health monitoring"
    }
    return descriptions.get(agent_name, "AI Co-Founder Assistant")
