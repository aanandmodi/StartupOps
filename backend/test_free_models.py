"""Test the FREE model configuration."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_free_models():
    """Test the free model names."""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    # FREE model names
    models_to_test = [
        ("Product Agent", "meta-llama/llama-3.2-3b-instruct:free"),
        ("Tech Agent", "mistralai/mistral-7b-instruct:free"),
        ("Marketing Agent", "google/gemini-2.0-flash-exp:free"),
        ("Finance Agent", "meta-llama/llama-3.2-3b-instruct:free"),
        ("Advisor Agent", "mistralai/mistral-7b-instruct:free"),
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    print("=" * 70)
    print("Testing FREE Model Configuration")
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
                    print(f"   ✅ {agent_name}: {model}")
                else:
                    all_success = False
                    status_text = {
                        400: "Bad Request",
                        402: "Payment Required",
                        404: "Not Found",
                        429: "Rate Limited",
                    }.get(response.status_code, f"Error {response.status_code}")
                    print(f"   ❌ {agent_name}: {model} - {status_text}")
                    
            except Exception as e:
                all_success = False
                print(f"   ❌ {agent_name}: {model} - Error: {e}")
        
        print("\n" + "=" * 70)
        if all_success:
            print("🎉 ALL FREE MODELS WORKING!")
        else:
            print("⚠️  Some models failed.")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_free_models())
