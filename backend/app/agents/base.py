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
