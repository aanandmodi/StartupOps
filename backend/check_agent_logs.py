"""Check the latest agent logs for errors."""
import sqlite3
import json

conn = sqlite3.connect('startupops.db')

# Get latest startup id
cursor = conn.execute('SELECT MAX(id) FROM startups')
latest_id = cursor.fetchone()[0]

print(f"Checking agent logs for startup ID: {latest_id}")
print("=" * 70)

cursor = conn.execute(
    'SELECT agent_name, output_json FROM agent_logs WHERE startup_id = ? ORDER BY id',
    (latest_id,)
)

for row in cursor.fetchall():
    agent_name = row[0]
    output = json.loads(row[1]) if isinstance(row[1], str) else row[1]
    
    if 'error' in output:
        print(f"\n❌ {agent_name.upper()}: ERROR")
        print(f"   {output.get('error', 'Unknown error')[:100]}...")
    else:
        print(f"\n✅ {agent_name.upper()}: SUCCESS")
        # Print a sample of the output
        keys = list(output.keys())[:3]
        print(f"   Keys: {keys}")

print("\n" + "=" * 70)
