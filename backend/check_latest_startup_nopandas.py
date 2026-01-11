
import sqlite3

try:
    conn = sqlite3.connect('startupops.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, created_at, goal FROM startups ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
