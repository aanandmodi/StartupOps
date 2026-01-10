"""Find valid Gemini model names on OpenRouter."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def find_gemini_models():
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        
        data = response.json().get("data", [])
        gemini_models = [m["id"] for m in data if "gemini" in m["id"].lower()]
        
        print("Available Gemini models on OpenRouter:")
        for model in sorted(gemini_models):
            print(f"  - {model}")

if __name__ == "__main__":
    asyncio.run(find_gemini_models())
