
import os
import asyncio
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Load env from .env file
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
model = os.getenv("PRODUCT_AGENT_MODEL", "moonshotai/kimi-k2-instruct-0905")

print(f"Testing Model: {model}")
print(f"API Key present: {bool(api_key)}")

async def test_chat():
    try:
        llm = ChatGroq(
            temperature=0.7,
            model_name=model,
            groq_api_key=api_key,
            max_tokens=100
        )
        
        print("Attempting to invoke chat...")
        response = await llm.ainvoke("Hello, are you working?")
        print("\n--- Response ---")
        print(response.content)
        print("--- Success ---")
    except Exception as e:
        print("\n--- Error ---")
        print(str(e))

if __name__ == "__main__":
    asyncio.run(test_chat())
