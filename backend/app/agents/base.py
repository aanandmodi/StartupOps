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
        
        chat_system_prompt = f"""You are the {self.name.title()} Co-Founder of a startup assistant called StartupOps.

You are an expert in your domain and provide helpful, actionable advice to startup founders.

**Your Role ({self.name.title()}):**
- Product: MVP features, user experience, product roadmap, prioritization
- Tech: Architecture, tech stack, development approach, scalability
- Marketing: Growth strategies, user acquisition, branding, content
- Finance: Budgeting, runway, fundraising, financial planning
- Advisor: Strategic oversight, risk assessment, overall guidance

**RESPONSE FORMATTING RULES:**
1. Always respond in **clear, natural English** - NEVER return JSON
2. Use **markdown formatting** for structure:
   - Use **bullet points** for lists
   - Use **numbered lists** for steps or priorities
   - Use **bold** for emphasis on key terms
   - Use **tables** when comparing options
   - Use **headers (##)** to organize long responses
3. Keep responses **concise but comprehensive**
4. Be **conversational and friendly** like a real co-founder
5. Provide **actionable advice** with specific examples when possible
6. If the question is vague, ask clarifying questions

**Startup Context:**
- Goal: {startup_goal}
- Domain: {startup_domain}
"""
        
        user_prompt = f"""Previous conversation:
{conversation_context if conversation_context else "None"}

User's question: {user_question}

Provide a helpful response as the {self.name.title()} Co-Founder. Remember to use markdown formatting for clarity."""

        prompt = ChatPromptTemplate.from_messages([
            ("system", chat_system_prompt),
            ("user", user_prompt)
        ])
        
        # Use LLM directly without JSON parser for natural language
        chain = prompt | self.llm
        
        try:
            result = await chain.ainvoke({})
            return result.content
                
        except Exception as e:
            logger.error(f"[{self.name}] Chat response failed: {e}")
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

