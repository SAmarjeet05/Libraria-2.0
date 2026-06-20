import sqlite3, os
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
cols = [r[1] for r in c.execute("PRAGMA table_info('logs')").fetchall()]
print('Existing columns:', cols)
if 'execution_result' not in cols:
    try:
        print('Adding execution_result column to logs')
        c.execute("ALTER TABLE logs ADD COLUMN execution_result TEXT")
        conn.commit()
        print('Added successfully')
    except Exception as e:
        print('Add column failed:', e)
else:
    print('execution_result column already exists')
conn.close()
