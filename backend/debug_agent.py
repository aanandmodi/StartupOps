
import os
import asyncio
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load env from .env file
load_dotenv()

# Set env var for testing if needed
# os.environ["GROQ_API_KEY"] = ... 

from app.agents import ProductAgent
from app.config import get_settings

settings = get_settings()

print(f"Testing Agent: ProductAgent")
print(f"Model: {settings.product_agent_model}")

async def test_agent():
    try:
        agent = ProductAgent()
        print("Agent initialized.")
        
        print("Sending chat message...")
        response = await agent.chat_response(
            startup_goal="Build a rocket to Mars",
            startup_domain="SpaceTech",
            user_question="What is the first step?",
            conversation_context=""
        )
        
        print("\n--- Response ---")
        print(response)
        print("--- Success ---")
    except Exception as e:
        print("\n--- Error ---")
        print(str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
