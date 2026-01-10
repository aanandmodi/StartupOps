"""Test script to directly call the startup creation endpoint and trace agent execution."""
import asyncio
import httpx
import json

async def test_startup_creation():
    """Test the full startup creation flow."""
    
    print("=" * 60)
    print("Testing Startup Creation & Agent Orchestration")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Test payload
    startup_data = {
        "goal": "Build an AI-powered task management app for remote teams",
        "domain": "Productivity",
        "team_size": 3
    }
    
    print(f"\n1. Testing API health...")
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.get(f"{base_url}/")
            print(f"   API is reachable: {response.status_code}")
        except Exception as e:
            print(f"   ❌ API not reachable: {e}")
            return
    
    print(f"\n2. Creating startup with payload:")
    print(f"   {json.dumps(startup_data, indent=2)}")
    
    print(f"\n3. Calling POST /startup/create...")
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            response = await client.post(
                f"{base_url}/startup/create",
                json=startup_data,
            )
            
            print(f"\n   Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n   ✅ Success!")
                print(f"\n   Response:")
                print(json.dumps(result, indent=4))
                
                if "agent_summary" in result:
                    print(f"\n4. Agent Execution Summary:")
                    for agent, status in result["agent_summary"].items():
                        emoji = "✅" if status == "completed" else "❌"
                        print(f"   {emoji} {agent}: {status}")
            else:
                print(f"\n   ❌ Failed!")
                print(f"   Response: {response.text}")
                
        except httpx.TimeoutException:
            print(f"\n   ❌ Request timed out (agents may still be running)")
        except Exception as e:
            print(f"\n   ❌ Error: {e}")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(test_startup_creation())
