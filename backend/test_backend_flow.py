import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print("1. Creating Startup...")
    payload = {
        "goal": "Build an AI-powered fitness coach for seniors",
        "domain": "healthtech",
        "team_size": 2
    }
    
    try:
        print(f"   Sending POST to {BASE_URL}/startup/create ...")
        response = requests.post(f"{BASE_URL}/startup/create", json=payload, timeout=10)
        print(f"   Response status: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        startup_id = data["startup_id"]
        print(f"   Success! Startup ID: {startup_id}")
    except Exception as e:
        print(f"   Failed to create startup: {e}")
        try:
            print(response.json())
        except:
            pass
        return

    print("\n2. Polling for Agent Results (this may take 30-60s due to rate limits)...")
    
    for i in range(20):  # Poll for up to ~100 seconds
        try:
            resp = requests.get(f"{BASE_URL}/startup/{startup_id}/dashboard")
            if resp.status_code == 200:
                dashboard = resp.json()
                tasks = dashboard.get("tasks", [])
                
                print(f"   Poll {i+1}: Found {len(tasks)} tasks.")
                
                if len(tasks) > 0:
                    print("\n   AGENTS ARE WORKING! Sample tasks:")
                    for t in tasks[:3]:
                        print(f"   - [{t['category']}] {t['title']} (Deps: {t['dependencies']})")
                    
                    print(f"\n   Execution Health Score: {dashboard.get('execution_health', {}).get('score')}")
                    return
            else:
                print(f"   Poll {i+1}: API Error {resp.status_code}")
        except Exception as e:
            print(f"   Poll {i+1}: Error {e}")
            
        time.sleep(5)

    print("\nTimed out waiting for tasks. Check backend logs.")

if __name__ == "__main__":
    test_flow()
