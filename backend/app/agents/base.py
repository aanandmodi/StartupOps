"""Base agent class for all AI agents."""
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnableConfig

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BaseAgent(ABC):
    """Abstract base class for all AI agents using LangChain and Groq."""
    
    name: str = "base"
    model: str = ""
    
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0.7,
            model_name=self.model,
            groq_api_key=settings.groq_api_key,
            max_tokens=4000,
            max_retries=3,
        )
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
    
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent with the given input using a LangChain Runnable.
        
        Args:
            input_data: Dictionary of input parameters
            
        Returns:
            Structured JSON output from the agent
        """
        logger.info(f"[{self.name}] Starting execution with model: {self.model}")
        
        if settings.is_mock_mode:
            logger.info(f"[{self.name}] Using mock response (no API key)")
            return self.get_mock_response(input_data)
        
        # Create the chain: Prompt -> LLM -> JSON Parser
        # We must escape curly braces in the system prompt because LangChain treats them as variables
        safe_system_prompt = self.system_prompt.replace("{", "{{").replace("}", "}}")
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", safe_system_prompt),
            ("user", "Analyze the following input and provide your structured JSON response:\n\n{input_json}\n\nRemember: Output ONLY valid JSON.")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            # Format input as JSON string for the prompt
            input_json = json.dumps(input_data, indent=2)
            
            result = await chain.ainvoke({"input_json": input_json})
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
        chain = prompt | self.llm
        
        try:
            # 4. Invoke with variables
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

