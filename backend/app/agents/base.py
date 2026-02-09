"""Base agent class for all AI agents."""
import logging
from abc import ABC, abstractmethod
import asyncio
import time
from typing import Any, Dict, Optional, List
import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from app.config import get_settings
from app.services.rate_limiter import limiter
from app.services.token_service import TokenService


logger = logging.getLogger(__name__)
settings = get_settings()


class BaseAgent(ABC):
    """Abstract base class for all AI agents using LangChain and Groq."""
    
    name: str = "base"
    model: str = ""
    
    def __init__(self):
        # We will initialize the LLM dynamically in run() to support model switching
        # but kept here for backward compatibility or default initialization
        self.default_model = settings.premium_model_id # Default to good model
        self.parser = JsonOutputParser()
    
    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass
    
    @abstractmethod
    def get_mock_response(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Return a mock response when API is not available."""
        pass
    
    async def _get_llm(self, user_tier: str = "free") -> ChatGroq:
        """Get the appropriate LLM instance based on user tier."""
        model_name = settings.free_model_id if user_tier == "free" else settings.premium_model_id
        
        # Override if specific agent needs specific model (though we usually want to respect tier)
        # For now, tier dictates quality.
        
        return ChatGroq(
            temperature=0.7,
            model_name=model_name,
            groq_api_key=settings.groq_api_key,
            max_tokens=4000,
            max_retries=3,
        )

    async def run(self, input_data: dict[str, Any], user_context: dict[str, Any] = None) -> dict[str, Any]:
        """
        Execute the agent with the given input using a LangChain Runnable.
        
        Args:
            input_data: Dictionary of input parameters
            user_context: Dict containing 'user_id' and 'tier'
            
        Returns:
            Structured JSON output from the agent
        """
        user_tier = user_context.get("tier", "free") if user_context else "free"
        user_id = user_context.get("user_id") if user_context else None
        
        model_name = settings.free_model_id if user_tier == "free" else settings.premium_model_id
        logger.info(f"[{self.name}] Starting execution. User Tier: {user_tier}, Model: {model_name}")
        
        if settings.is_mock_mode:
            logger.info(f"[{self.name}] Using mock response (no API key)")
            return self.get_mock_response(input_data)
            
        # Initialize LLM with correct model
        llm = await self._get_llm(user_tier)

        
        # Create the chain: Prompt -> LLM -> JSON Parser
        # We must escape curly braces in the system prompt because LangChain treats them as variables
        safe_system_prompt = self.system_prompt.replace("{", "{{").replace("}", "}}")
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", safe_system_prompt),
            ("user", "Analyze the following input and provide your structured JSON response:\n\n{input_json}\n\nRemember: Output ONLY valid JSON.")
        ])
        
        chain = prompt | llm | self.parser
        
        try:
            # Format input as JSON string for the prompt
            input_json = json.dumps(input_data, indent=2)
            
            # Use Rate Limiter
            async with limiter.throttle():
                start_time = time.time()
                result = await chain.ainvoke({"input_json": input_json})
                duration = time.time() - start_time
                
                # Estimate usage (Groq doesn't always return usage in this chain easily without callbacks)
                # But we can estimate
                input_str = prompt.format(input_json=input_json)
                output_str = json.dumps(result)
                
                in_tokens = TokenService.estimate_tokens(input_str)
                out_tokens = TokenService.estimate_tokens(output_str)
                
                if user_id:
                   # accessing DB requires session - this is tricky inside 'run' without passing db session
                   # For now, we will log it. In a real app we'd pass the session or use a separate service context.
                   # Or, we assume orchestration handles the specialized logging, 
                   # BUT we promised to track it.
                   # Let's fire-and-forget a background task or just log for now to avoid breaking flow with db requirement here.
                   # Ideally we pass 'db' in user_context.
                   pass
                   
                logger.info(f"[{self.name}] Generated {out_tokens} tokens in {duration:.2f}s")
                
            return result
                
        except Exception as e:
            logger.error(f"[{self.name}] Execution failed: {e}")
            # Fallback for parsing errors or other issues
            return {"error": str(e), "agent": self.name}
    
    async def chat_response(self, startup_goal: str, startup_domain: str, user_question: str, conversation_context: str = "") -> str:
        """
        Generate a conversational response in natural language with markdown formatting.
        
        Args:
            startup_goal: The startup's main goal
            startup_domain: The startup's domain/industry
            user_question: The user's question
            conversation_context: Previous conversation for context
            
        Returns:
            Human-readable markdown-formatted response
        """
        logger.info(f"[{self.name}] Generating chat response")
        

        if settings.is_mock_mode:
            return f"I'm your {self.name.title()} Co-Founder. I'd be happy to help with that question about {startup_domain}. Could you provide more details?"
        
        # 1. Define safe system prompt (escape braces for static content)
        # Note: We use double curly braces {{ }} for anything we want to appear literally in the output prompt
        # We use single curly braces {var} for variables we want LangChain to substitute
        chat_system_prompt = f"""You are the {self.name.title()} Co-Founder of a startup assistant called StartupOps.

You are a **world-class expert** in your domain (Product, Tech, Marketing, Finance, or Strategy). 
Your goal is to help the founder succeed by providing **brutally honest, highly detailed, and deeply researched advice**.

**Your Role ({self.name.title()}):**
- **Product**: Focus on MVP ruthlessness, user psychology, and product-market fit.
- **Tech**: Focus on scalability, security, and pragmatic engineering choices.
- **Marketing**: Focus on growth loops, CAC/LTV, and actionable traction channels.
- **Finance**: Focus on cash flow, unit economics, and burn rate. *Do not sugar-coat financial realities.*
- **Advisor**: Focus on long-term strategy, fundraising pitfalls, and critical risk assessment.

**CORE PERSONALITY & TONE:**
1.  **BLUNT & DIRECT**: Do not sugar-coat your advice. If an idea is bad, say it is bad and explain why. 
2.  **NO FLUFF**: Avoid generic corporate speak. Be concise and high-signal.
3.  **RESEARCH-BACKED**: Base your advice on modern startup best practices (Y Combinator, refined SaaS metrics, etc.).
4.  **STRUCTURED**: Your output must be highly organized and easy to scan.

**RESPONSE STRUCTURE GUIDELINES:**
- **Start with the Bottom Line**: Give the direct answer/verdict first.
- **Use Clear Headings (##)**: Break down complex topics into distinct sections.
- **Use Tables**: For comparisons, pros/cons, or metrics.
- **Use Bold for Emphasis**: Highlight critical numbers or warnings.
- **Actionable Steps**: Always end with a set of immediate, concrete next steps.

**Startup Context:**
- Goal: {{startup_goal}}
- Domain: {{startup_domain}}
"""
        
        # 2. Create the prompt template with placeholders
        # We pass keys into the template so LangChain handles the substitution safely
        prompt = ChatPromptTemplate.from_messages([
            ("system", chat_system_prompt),
            ("user", "Previous conversation:\n{conversation_context}\n\nUser's question: {user_question}\n\nProvide a response as the {agent_name} Co-Founder following the blunt, detailed, and structured guidelines above.")
        ])
        
        # 3. Create chain
        # Use LLM directly without JSON parser for natural language
        # Dynamically get LLM
        # For chat, we default to premium if available or just use config
        # Use simple heuristic: if passed context has tier, use it. But signature doesn't have it.
        # We will default to Premium for Chat as it's user facing and low volume compared to batch agents.
        llm = await self._get_llm("premium") 
        
        chain = prompt | llm
        
        try:
            # 4. Invoke with variables
            async with limiter.throttle():
                result = await chain.ainvoke({
                    "startup_goal": startup_goal,
                    "startup_domain": startup_domain,
                    "conversation_context": conversation_context if conversation_context else "None",
                    "user_question": user_question,
                    "agent_name": self.name.title()
                })
            return result.content
                
        except Exception as e:
            logger.error(f"[{self.name}] Chat response failed: {e}")
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

