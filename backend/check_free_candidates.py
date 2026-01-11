"""Check specific free models availability on OpenRouter."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def check_specific_free_models():
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    # Potential slugs for the requested models
    candidates = [
        ("Tech (Llama-3-8B)", "meta-llama/llama-3-8b-instruct:free"),
        ("Tech (Llama-3.1-8B)", "meta-llama/llama-3.1-8b-instruct:free"),
        ("Tech (Llama-3.2-3B)", "meta-llama/llama-3.2-3b-instruct:free"),
        
        ("Market (Gemini-Flash)", "google/gemini-2.0-flash-exp:free"),
        ("Market (Gemini-Flash-1.5-8B)", "google/gemini-flash-1.5-8b-exp:free"),
        
        ("integrity (Claude-Haiku)", "anthropic/claude-3-haiku"), 
        ("integrity (Claude-Haiku:free)", "anthropic/claude-3-haiku:free"),
        ("integrity (Haiku-Legacy)", "anthropic/claude-instant-1:free"),
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        print("Checking Model Availability:")
        print("=" * 50)
        
        for name, slug in candidates:
            # We check the /models endpoint or just try a dry-run? 
            # Dry run is better to confirm 'free' status (no 402).
            # Using max_tokens=1 to save time/bandwidth.
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
                    print(f"✅ {name}: {slug} -> WORKS (FREE)")
                elif response.status_code == 402:
                    print(f"❌ {name}: {slug} -> REQUIRES PAYMENT")
                elif response.status_code == 404:
                    print(f"❌ {name}: {slug} -> NOT FOUND")
                else:
                    print(f"⚠️  {name}: {slug} -> Error {response.status_code}")
                    
            except Exception as e:
                print(f"⚠️  {name}: {slug} -> Exception: {e}")

if __name__ == "__main__":
    asyncio.run(check_specific_free_models())
