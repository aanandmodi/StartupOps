"""Test script to verify OpenRouter API key and model access."""
import os
import sys
import asyncio

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.config import get_settings

async def test_api_key():
    """Test the OpenRouter API key and configuration."""
    settings = get_settings()
    
    print("=" * 60)
    print("OpenRouter API Configuration Test")
    print("=" * 60)
    
    # Check settings
    print(f"\n1. API Key loaded: {'Yes' if settings.openrouter_api_key else 'No'}")
    if settings.openrouter_api_key:
        masked_key = settings.openrouter_api_key[:15] + "..." + settings.openrouter_api_key[-5:]
        print(f"   Key preview: {masked_key}")
    
    print(f"\n2. Base URL: {settings.openrouter_base_url}")
    print(f"\n3. Is Mock Mode: {settings.is_mock_mode}")
    
    if settings.is_mock_mode:
        print("\n   ⚠️  MOCK MODE IS ENABLED!")
        print("   This means NO real API calls are being made.")
        if not settings.openrouter_api_key:
            print("   Reason: No API key found")
        elif settings.openrouter_api_key.startswith("sk-or-v1-your"):
            print("   Reason: API key starts with placeholder 'sk-or-v1-your'")
        return
    
    print(f"\n4. Agent Models:")
    print(f"   - Product Agent: {settings.product_agent_model}")
    print(f"   - Tech Agent: {settings.tech_agent_model}")
    print(f"   - Marketing Agent: {settings.marketing_agent_model}")
    print(f"   - Finance Agent: {settings.finance_agent_model}")
    print(f"   - Advisor Agent: {settings.advisor_agent_model}")
    
    # Test actual API call
    print("\n5. Testing API Connection...")
    try:
        import httpx
        
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        }
        
        # Test with a simple request to check key validity
        async with httpx.AsyncClient(timeout=30) as client:
            # First, let's check the models endpoint
            print("   Testing API key with models endpoint...")
            response = await client.get(
                f"{settings.openrouter_base_url}/models",
                headers=headers,
            )
            
            if response.status_code == 200:
                print("   ✅ API Key is VALID - models endpoint accessible")
            else:
                print(f"   ❌ API Key issue - Status: {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                return
            
            # Now test actual chat completion with a cheap model
            print("\n   Testing chat completion with a simple request...")
            payload = {
                "model": "openai/gpt-4o-mini",  # Using a cheap model for testing
                "messages": [
                    {"role": "user", "content": "Say 'API test successful' in 5 words or less."}
                ],
                "max_tokens": 20,
            }
            
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"   ✅ Chat completion SUCCESS!")
                print(f"   Response: {content}")
            else:
                print(f"   ❌ Chat completion FAILED - Status: {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                
    except Exception as e:
        print(f"   ❌ Error during API test: {e}")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(test_api_key())
