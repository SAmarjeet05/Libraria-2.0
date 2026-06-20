import sqlite3

def show_schema():
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    
    # Get list of tables
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    
    for table in tables:
        table_name = table[0]
        print(f"\nTable: {table_name}")
        print("Columns:")
        c.execute(f"PRAGMA table_info({table_name})")
        columns = c.fetchall()
        for column in columns:
            print(f"  {column[1]}: {column[2]} (Primary Key: {column[5]})")
    
    conn.close()

if __name__ == "__main__":
    show_schema()