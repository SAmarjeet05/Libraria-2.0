import sqlite3, json, os
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
rows = list(c.execute("select id, title, author, status, available_copies from books limit 100"))
count = c.execute("select count(*) from books").fetchone()[0]
print(json.dumps({'count': count, 'rows': rows}, default=str, indent=2))
conn.close()
