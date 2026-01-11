
import requests

BASE_URL = "http://localhost:8000"

def get_latest_startup_id():
    # Try finding a valid startup ID by checking dashboards in descending order
    for i in range(50, 40, -1):
        try:
            r = requests.get(f"{BASE_URL}/startup/{i}/dashboard")
            if r.status_code == 200:
                print(f"Found latest startup ID: {i}")
                return i
        except:
            pass
    return 42

def verify_exports(startup_id):
    print(f"\nVerifying Exports for Startup {startup_id}...")
    
    # 1. PRD
    try:
        r = requests.get(f"{BASE_URL}/startup/{startup_id}/export/prd")
        content = r.text
        print("\n[PRD Export]")
        if "Executive Summary" in content: print("✅ Found 'Executive Summary'")
        else: print("❌ Missing 'Executive Summary'")
        
        if "User Stories" in content: print("✅ Found 'User Stories'")
        else: print("❌ Missing 'User Stories'")
        
        if "Acceptance Criteria" in content: print("✅ Found 'Acceptance Criteria'")
        else: print("❌ Missing 'Acceptance Criteria'")
    except Exception as e:
        print(f"❌ PRD Error: {e}")

    # 2. Budget
    try:
        r = requests.get(f"{BASE_URL}/startup/{startup_id}/export/budget")
        content = r.text
        print("\n[Budget Export]")
        if "HEADCOUNT ASSUMPTIONS" in content: print("✅ Found 'HEADCOUNT ASSUMPTIONS'")
        else: print("❌ Missing 'HEADCOUNT ASSUMPTIONS'")
        
        if "6-MONTH PROJECTED FORECAST" in content: print("✅ Found '6-MONTH PROJECTED FORECAST'")
        else: print("❌ Missing '6-MONTH PROJECTED FORECAST'")
    except Exception as e:
        print(f"❌ Budget Error: {e}")

    # 3. Social Posts
    try:
        r = requests.get(f"{BASE_URL}/startup/{startup_id}/export/posts")
        content = r.text
        print("\n[Social Posts Export]")
        if "ENGAGEMENT GUIDELINES" in content: print("✅ Found 'ENGAGEMENT GUIDELINES'")
        else: print("❌ Missing 'ENGAGEMENT GUIDELINES'")
    except Exception as e:
        print(f"❌ Posts Error: {e}")

if __name__ == "__main__":
    sid = get_latest_startup_id()
    verify_exports(sid)
