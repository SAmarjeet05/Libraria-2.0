import sqlite3, os, uuid
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
# Insert a sample Dan Brown book
id_str = str(uuid.uuid4())
try:
    c.execute("INSERT INTO books (id, title, author, isbn, category_id, publisher, publication_year, description, cover_url, total_copies, available_copies, status, has_ebook, ebook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              (id_str, 'Inferno', 'Dan Brown', '9780307887443', None, 'Doubleday', 2013, 'A mystery thriller novel.', None, 3, 3, 'available', 0, None))
    conn.commit()
    print('Inserted', id_str)
except Exception as e:
    print('Error inserting:', e)
finally:
    conn.close()
