import sqlite3, os
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
# Check columns
cols = [r[1] for r in c.execute("PRAGMA table_info('logs')").fetchall()]
print('Existing columns:', cols)
if 'sql_query' in cols and 'ai_response' not in cols:
    try:
        print('Renaming column sql_query -> ai_response')
        c.execute("ALTER TABLE logs RENAME COLUMN sql_query TO ai_response")
        conn.commit()
        print('Renamed successfully')
    except Exception as e:
        print('Rename failed:', e)
else:
    print('No rename needed')
conn.close()
