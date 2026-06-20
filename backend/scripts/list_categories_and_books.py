import sqlite3, os, json
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
cats = list(c.execute("SELECT id, name FROM categories"))
books = list(c.execute("SELECT id, title, author, category_id FROM books"))
print(json.dumps({'categories': cats, 'books': books}, default=str, indent=2))
conn.close()
