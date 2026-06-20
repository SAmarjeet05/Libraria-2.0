import sqlite3

# Connect to the database
conn = sqlite3.connect('libraria.db')
cursor = conn.cursor()

# Add the new columns
try:
    # Add has_ebook column with default value False
    cursor.execute('ALTER TABLE books ADD COLUMN has_ebook BOOLEAN NOT NULL DEFAULT 0')
    # Add ebook_url column
    cursor.execute('ALTER TABLE books ADD COLUMN ebook_url TEXT')
    # Commit the changes
    conn.commit()
    print("Successfully added ebook columns!")
except sqlite3.OperationalError as e:
    if 'duplicate column name' in str(e):
        print("Columns already exist")
    else:
        print(f"Error: {e}")
finally:
    # Close the connection
    conn.close()