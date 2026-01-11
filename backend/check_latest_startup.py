
import sqlite3
import pandas as pd

try:
    conn = sqlite3.connect('startupops.db')
    query = "SELECT id, created_at, goal FROM startups ORDER BY id DESC LIMIT 5"
    df = pd.read_sql_query(query, conn)
    print(df)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
