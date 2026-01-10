"""Check available models on OpenRouter and test each one."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def check_models():
    """Check which models are available and which work."""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    # Models currently configured
    configured_models = [
        ("Product Agent", "anthropic/claude-3.5-sonnet"),
        ("Tech Agent", "openai/gpt-4.1"),
        ("Marketing Agent", "google/gemini-1.5-pro"),
        ("Finance Agent", "openai/gpt-4o-mini"),
        ("Advisor Agent", "anthropic/claude-instant-1"),
    ]
    
    # Good free/cheap alternatives
    alternatives = [
        "mistralai/mistral-7b-instruct:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free",
        "qwen/qwen-2-7b-instruct:free",
        "google/gemini-2.0-flash-exp:free",
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    print("=" * 70)
    print("OpenRouter Model Availability Check")
    print("=" * 70)
    
    async with httpx.AsyncClient(timeout=30) as client:
        print("\n1. Testing currently configured models:")
        print("-" * 70)
        
        for agent_name, model in configured_models:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": "Say 'OK'"}],
                "max_tokens": 5,
            }
            
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {agent_name}: {model} - WORKS")
                else:
                    status_text = {
                        400: "Bad Request (invalid model?)",
                        401: "Unauthorized (API key issue)",
                        402: "Payment Required (needs credits)",
                        403: "Forbidden",
                        404: "Not Found (model doesn't exist)",
                        429: "Rate Limited",
                    }.get(response.status_code, f"Error {response.status_code}")
                    print(f"   ❌ {agent_name}: {model}")
                    print(f"      Status: {status_text}")
                    
            except Exception as e:
                print(f"   ❌ {agent_name}: {model} - Error: {e}")
        
        print("\n2. Testing free/cheap alternatives:")
        print("-" * 70)
        
        for model in alternatives:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": "Say 'OK'"}],
                "max_tokens": 5,
            }
            
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {model} - WORKS")
                else:
                    print(f"   ❌ {model} - Status: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ {model} - Error: {e}")
    
    print("\n" + "=" * 70)
    print("\nRECOMMENDATION:")
    print("Update config.py to use working free models for testing.")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(check_models())
