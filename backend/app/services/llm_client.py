"""OpenRouter API client for multi-model AI access."""
import json
import logging
from typing import Any
import httpx

from app.config import get_settings, Settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMClient:
    """Client for interacting with LLM APIs (Groq)."""
    
    def __init__(self, settings: Settings):
        self.api_key = settings.groq_api_key
        self.base_url = settings.groq_base_url
        self.timeout = settings.api_timeout
        self.max_retries = settings.max_retries
        
    async def chat_completion(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> dict[str, Any]:
        """
        Send a chat completion request to Groq.
        
        Args:
            model: The model identifier (e.g., 'llama-3.1-8b-instant')
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Parsed JSON response from the model
        """
        if settings.is_mock_mode:
            logger.warning("Running in MOCK MODE - no actual API calls")
            return {"mock": True, "message": "Mock mode enabled"}
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            # "response_format": {"type": "json_object"}, # Groq supports this for Llama 3.1, but keeping it simple for now
        }
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    # Parse JSON from response
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse JSON: {content[:200]}")
                        return {"error": "Invalid JSON response", "raw": content}
                        
            except httpx.TimeoutException:
                logger.warning(f"Timeout on attempt {attempt + 1}/{self.max_retries}")
                if attempt == self.max_retries - 1:
                    raise
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
                if e.response.status_code == 429:
                    # Rate limited - wait and retry
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise
        
        return {"error": "Max retries exceeded"}



