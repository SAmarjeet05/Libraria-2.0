import sqlite3, os, json
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
q = "SELECT title, id, category_id FROM books WHERE category_id IN (SELECT id FROM categories WHERE name = 'test category')"
rows = list(c.execute(q))
print(json.dumps({'count': len(rows), 'rows': rows}, default=str, indent=2))
conn.close()
