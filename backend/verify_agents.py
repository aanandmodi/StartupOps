"""Verify all agent logs are successful."""
import sqlite3
import json

conn = sqlite3.connect('startupops.db')
cursor = conn.execute(
    'SELECT agent_name, output_json FROM agent_logs WHERE startup_id = 4 ORDER BY id'
)

print("Agent Log Status for Startup #4:")
print("=" * 50)
all_success = True
for row in cursor.fetchall():
    agent_name = row[0]
    output = json.loads(row[1])
    if 'error' in output:
        print(f"  X {agent_name}: ERROR - {output['error'][:80]}...")
        all_success = False
    else:
        keys = list(output.keys())[:3]
        print(f"  OK {agent_name}: SUCCESS (keys: {keys})")

print("=" * 50)
if all_success:
    print("ALL AGENTS SUCCESSFUL!")
else:
    print("SOME AGENTS FAILED")
