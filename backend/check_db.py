import sqlite3

try:
    conn = sqlite3.connect('startupops.db')
    cursor = conn.cursor()
    
    print("--- Startups ---")
    cursor.execute("SELECT id, goal, created_at FROM startups ORDER BY id DESC LIMIT 5")
    startups = cursor.fetchall()
    for s in startups:
        print(s)
    
    if startups:
        latest_id = startups[0][0]
        print(f"\n--- Agent Logs for Startup {latest_id} ---")
        cursor.execute(f"SELECT agent_name, created_at, output_json FROM agent_logs WHERE startup_id = ?", (latest_id,))
        logs = cursor.fetchall()
        for log in logs:
            print(f"[{log[0]}] {log[1]}: {log[2][:100]}...")
            
        print(f"\n--- Tasks for Startup {latest_id} ---")
        cursor.execute(f"SELECT id, title, category, status FROM tasks WHERE startup_id = ?", (latest_id,))
        tasks = cursor.fetchall()
        
        for t in tasks:
            print(t)
        
        print(f"\nTotal Tasks: {len(tasks)}")
        
except Exception as e:
    print(e)
finally:
    if 'conn' in locals():
        conn.close()
