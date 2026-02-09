"""Test Groq Connectivity."""
import asyncio
import os
import logging
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# Load env vars
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY not found in environment!")
        return

    logger.info(f"Testing with API Key: {api_key[:5]}...")
    
    models = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile"
    ]
    
    for model in models:
        logger.info(f"Testing model: {model}...")
        try:
            chat = ChatGroq(
                temperature=0,
                model_name=model,
                groq_api_key=api_key
            )
            
            response = await chat.ainvoke([HumanMessage(content="Hello, are you working?")])
            logger.info(f"✅ {model} Response: {response.content}")
            
        except Exception as e:
            logger.error(f"❌ {model} Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
