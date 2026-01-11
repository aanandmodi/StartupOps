"""Check availability of user requested advanced models."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def check_advanced_models():
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    candidates = [
        "xiaomi/mimo-v2-flash:free",
        "anthropic/claude-sonnet-4.5",
        "anthropic/claude-3.5-sonnet", # Fallback check
        "google/gemini-3-flash-preview", 
        "google/gemini-2.0-flash-exp:free", # Fallback check
        "deepseek/deepseek-v3.2",
        "deepseek/deepseek-chat", # Fallback check
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        print("Checking Model Availability:")
        print("=" * 50)
        
        for slug in candidates:
            payload = {
                "model": slug,
                "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 1,
            }
            
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    print(f"✅ {slug} -> WORKS")
                elif response.status_code == 402:
                    print(f"⚠️  {slug} -> REQUIRES PAYMENT")
                elif response.status_code == 404:
                    print(f"❌ {slug} -> NOT FOUND")
                else:
                    print(f"⚠️  {slug} -> Error {response.status_code}")
                    
            except Exception as e:
                print(f"⚠️  {slug} -> Exception: {e}")

if __name__ == "__main__":
    asyncio.run(check_advanced_models())
