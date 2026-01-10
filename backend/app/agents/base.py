"""Base agent class for all AI agents."""
import logging
from abc import ABC, abstractmethod
from typing import Any

from app.services.openrouter import openrouter_client
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BaseAgent(ABC):
    """Abstract base class for all AI agents."""
    
    name: str = "base"
    model: str = ""
    
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
        Execute the agent with the given input.
        
        Args:
            input_data: Dictionary of input parameters
            
        Returns:
            Structured JSON output from the agent
        """
        logger.info(f"[{self.name}] Starting execution with model: {self.model}")
        
        if settings.is_mock_mode:
            logger.info(f"[{self.name}] Using mock response (no API key)")
            return self.get_mock_response(input_data)
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": self._format_input(input_data)},
        ]
        
        try:
            result = await openrouter_client.chat_completion(
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            logger.info(f"[{self.name}] Execution successful")
            return result
        except Exception as e:
            logger.error(f"[{self.name}] Execution failed: {e}")
            return {"error": str(e), "agent": self.name}
    
    def _format_input(self, input_data: dict[str, Any]) -> str:
        """Format input data as a structured prompt."""
        import json
        return f"""Analyze the following input and provide your structured JSON response:

{json.dumps(input_data, indent=2)}

Remember: Output ONLY valid JSON, no markdown, no explanations."""
