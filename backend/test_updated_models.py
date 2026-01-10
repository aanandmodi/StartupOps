"""Test the updated model configuration."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_updated_models():
    """Test the corrected model names."""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    # CORRECTED model names
    models_to_test = [
        ("Product Agent", "anthropic/claude-3.5-sonnet"),
        ("Tech Agent", "openai/gpt-4o"),  # FIXED
        ("Marketing Agent", "google/gemini-2.5-flash"),  # FIXED
        ("Finance Agent", "openai/gpt-4o-mini"),
        ("Advisor Agent", "mistralai/mistral-7b-instruct:free"),  # FIXED
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    print("=" * 70)
    print("Testing CORRECTED Model Configuration")
    print("=" * 70)
    
    async with httpx.AsyncClient(timeout=30) as client:
        all_success = True
        
        for agent_name, model in models_to_test:
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
                    all_success = False
                    error_detail = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]
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
                    if response.status_code == 400:
                        print(f"      Details: {error_detail}")
                    
            except Exception as e:
                all_success = False
                print(f"   ❌ {agent_name}: {model} - Error: {e}")
        
        print("\n" + "=" * 70)
        if all_success:
            print("🎉 ALL MODELS WORKING! Configuration is correct.")
        else:
            print("⚠️  Some models failed. Check the errors above.")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_updated_models())
