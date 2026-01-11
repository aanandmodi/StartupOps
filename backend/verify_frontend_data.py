"""Verify backend data structure for frontend integration.
Simulates a real user flow: Create Startup -> Get Dashboard.
"""
import asyncio
import httpx
import json
import time

BASE_URL = "http://localhost:8000"

async def verify_data():
    print("=" * 70)
    print("StartupOps Data Verification")
    print("=" * 70)
    
    # 1. Define Realistic Company Data
    startup_data = {
        "goal": "Launch a subscription-based meal prep service for fitness enthusiasts with AI-personalized nutrition plans.",
        "domain": "Health & FoodTech",
        "team_size": 4
    }
    
    print("\n1. creating startup...")
    print(f"   Goal: {startup_data['goal'][:60]}...")
    
    async with httpx.AsyncClient(timeout=180) as client:
        # Create Startup
        try:
            start_time = time.time()
            response = await client.post(f"{BASE_URL}/startup/create", json=startup_data)
            duration = time.time() - start_time
            
            if response.status_code != 200:
                print(f"   ❌ Creation Failed: {response.text}")
                return
            
            result = response.json()
            startup_id = result["startup_id"]
            print(f"   ✅ Startup Created! (ID: {startup_id})")
            print(f"   ⏱️  Time taken: {duration:.1f}s")
            
            # Check Agent Summary
            summary = result.get("agent_summary", {})
            print(f"   🤖 Agent Status: {summary}")
            
        except Exception as e:
            print(f"   ❌ Error creating startup: {e}")
            return

        # 2. Fetch Dashboard Data
        print("\n2. Fetching Dashboard Data (Frontend View)...")
        try:
            response = await client.get(f"{BASE_URL}/startup/{startup_id}/dashboard")
            
            if response.status_code != 200:
                print(f"   ❌ Fetch Dashboard Failed: {response.text}")
                return
            
            dashboard = response.json()
            print("   ✅ Dashboard Data Received!")
            
            # 3. Analyze Data Structure
            print("\n3. Data Analysis for Frontend:")
            print("-" * 30)
            
            # Execution Health
            health = dashboard.get("execution_health", {})
            print(f"   [Execution Health]")
            print(f"     Score: {health.get('score')}/100")
            print(f"     Status: {health.get('status')}")
            print(f"     Tasks Completed: {health.get('completed_tasks')}/{health.get('total_tasks')}")
            
            # KPI
            kpis = dashboard.get("kpis", [])
            print(f"\n   [KPIs] ({len(kpis)} items)")
            for k in kpis[:3]:
                print(f"     - {k.get('name')}: {k.get('value')} / {k.get('target')} {k.get('unit')}")
            
            # Tasks
            tasks = dashboard.get("tasks", [])
            print(f"\n   [Tasks] ({len(tasks)} items)")
            by_category = {}
            for t in tasks:
                cat = t.get("category")
                by_category[cat] = by_category.get(cat, 0) + 1
            
            print(f"     Distribution: {json.dumps(by_category, indent=2)}")
            print(f"     Sample Task: {tasks[0].get('title') if tasks else 'None'}")
            
            # Alerts
            alerts = dashboard.get("alerts", [])
            print(f"\n   [Alerts] ({len(alerts)} items)")
            for a in alerts[:2]:
                print(f"     - [{a.get('severity')}] {a.get('message')}")
            
            # Agent Logs (Manual Check)
            # We can't see them in dashboard usually, but useful to know if they exist
            
            print("\n" + "=" * 70)
            print("VERIFICATION RESULT:")
            if len(tasks) > 0 and len(kpis) > 0:
                print("✅ Data looks complete and ready for frontend!")
            else:
                print("⚠️  Data might be incomplete (checking missing sections...)")
            print("=" * 70)
            
        except Exception as e:
            print(f"   ❌ Error fetching dashboard: {e}")

if __name__ == "__main__":
    asyncio.run(verify_data())
