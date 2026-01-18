"""Vector embedding service for RAG (Retrieval Augmented Generation)."""
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import hashlib

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.chat import AgentMemory

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class SearchResult:
    """Result from a vector search."""
    memory_id: int
    key: str
    value: str
    importance: float
    similarity: float


class EmbeddingService:
    """
    Service for generating embeddings and performing RAG operations.
    
    Uses OpenAI embeddings by default, but falls back to simple
    keyword-based search if OpenAI is not configured.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openai_api_key
        self._client = None
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536
    
    def _get_client(self):
        """Get OpenAI client for embeddings."""
        if not self._client:
            if not self.api_key:
                logger.warning("No OpenAI API key - using fallback search")
                return None
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                logger.error("openai package not installed")
                return None
        return self._client
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate an embedding vector for the given text."""
        client = self._get_client()
        if not client:
            return None
        
        try:
            response = client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    async def store_memory(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: str,
        memory_type: str,
        key: str,
        value: str,
        importance: float = 0.5
    ) -> Optional[AgentMemory]:
        """Store a memory with optional embedding."""
        
        # Generate embedding if possible
        embedding = await self.generate_embedding(value)
        
        memory = AgentMemory(
            startup_id=startup_id,
            agent_name=agent_name,
            memory_type=memory_type,
            key=key,
            value=value,
            importance=importance
        )
        
        # If we have pgvector support, store embedding
        # For now, we'll store the text and do keyword search
        
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        
        logger.info(f"Stored memory: {key} for agent {agent_name}")
        return memory
    
    async def search_memories(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: Optional[str],
        query: str,
        limit: int = 5
    ) -> List[SearchResult]:
        """
        Search memories relevant to the query.
        
        Uses vector similarity if available, falls back to keyword search.
        """
        
        # Try vector search with embedding
        embedding = await self.generate_embedding(query)
        
        if embedding:
            # Use pgvector similarity search if available
            return await self._vector_search(db, startup_id, agent_name, embedding, limit)
        else:
            # Fall back to keyword search
            return await self._keyword_search(db, startup_id, agent_name, query, limit)
    
    async def _vector_search(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: Optional[str],
        embedding: List[float],
        limit: int
    ) -> List[SearchResult]:
        """
        Perform vector similarity search.
        
        Note: Requires pgvector extension and embedding column.
        Falls back to keyword search if not available.
        """
        # For now, fall back to keyword search as we don't have pgvector set up
        # In production, you would use:
        # SELECT *, embedding <=> $1 AS similarity FROM agent_memories ORDER BY similarity LIMIT $2
        
        logger.info("Vector search not fully configured, using keyword fallback")
        return await self._keyword_search(db, startup_id, agent_name, "", limit)
    
    async def _keyword_search(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: Optional[str],
        query: str,
        limit: int
    ) -> List[SearchResult]:
        """Perform keyword-based search on memories."""
        
        base_query = select(AgentMemory).where(
            AgentMemory.startup_id == startup_id
        )
        
        if agent_name:
            base_query = base_query.where(AgentMemory.agent_name == agent_name)
        
        # Order by importance and recency
        base_query = base_query.order_by(
            AgentMemory.importance.desc(),
            AgentMemory.created_at.desc()
        ).limit(limit)
        
        result = await db.execute(base_query)
        memories = result.scalars().all()
        
        # Simple keyword matching for relevance
        query_words = set(query.lower().split()) if query else set()
        
        results = []
        for memory in memories:
            # Calculate simple similarity score based on word overlap
            memory_words = set(memory.value.lower().split())
            if query_words:
                overlap = len(query_words & memory_words)
                similarity = overlap / len(query_words) if query_words else 0
            else:
                similarity = memory.importance
            
            results.append(SearchResult(
                memory_id=memory.id,
                key=memory.key,
                value=memory.value,
                importance=memory.importance,
                similarity=similarity
            ))
        
        # Sort by similarity
        results.sort(key=lambda x: x.similarity, reverse=True)
        return results
    
    async def get_context_for_agent(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: str,
        current_query: str,
        max_tokens: int = 2000
    ) -> str:
        """
        Get relevant context for an agent based on the current query.
        
        Returns a formatted string with relevant memories to include in the prompt.
        """
        
        results = await self.search_memories(
            db=db,
            startup_id=startup_id,
            agent_name=agent_name,
            query=current_query,
            limit=10
        )
        
        if not results:
            return ""
        
        # Build context string
        context_parts = ["## Relevant Context from Previous Conversations:\n"]
        current_length = 0
        
        for result in results:
            entry = f"- **{result.key}**: {result.value}\n"
            entry_length = len(entry)
            
            if current_length + entry_length > max_tokens:
                break
            
            context_parts.append(entry)
            current_length += entry_length
        
        return "\n".join(context_parts)
    
    async def save_conversation_memory(
        self,
        db: AsyncSession,
        startup_id: int,
        agent_name: str,
        user_message: str,
        assistant_response: str
    ):
        """
        Extract and save important information from a conversation.
        
        This creates structured memories from conversations for future RAG.
        """
        
        # Create a summary key based on the conversation
        summary_key = self._generate_memory_key(user_message)
        
        # Store the Q&A pair as a memory
        memory_value = f"Q: {user_message[:200]}... A: {assistant_response[:500]}..."
        
        await self.store_memory(
            db=db,
            startup_id=startup_id,
            agent_name=agent_name,
            memory_type="conversation",
            key=summary_key,
            value=memory_value,
            importance=0.5
        )
    
    def _generate_memory_key(self, text: str) -> str:
        """Generate a short key for memory storage."""
        # Take first few meaningful words
        words = text.split()[:5]
        key = " ".join(words)
        if len(key) > 50:
            key = key[:47] + "..."
        return key
