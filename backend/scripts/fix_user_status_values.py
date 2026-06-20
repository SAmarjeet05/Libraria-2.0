import sqlite3

db = r'C:\Old Data\Amarjeet\Libraria 2.0\Libraria-main\backend\libraria.db'
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute('SELECT DISTINCT status FROM users')
print('Before:', [r[0] for r in cur.fetchall()])
cur.execute("UPDATE users SET status='ACTIVE' WHERE status='active'")
cur.execute("UPDATE users SET status='SUSPENDED' WHERE status='suspended'")
cur.execute("UPDATE users SET status='DELETED' WHERE status='deleted'")
cur.execute("UPDATE users SET status='ACTIVE' WHERE status IS NULL")
conn.commit()
cur.execute('SELECT DISTINCT status FROM users')
print('After:', [r[0] for r in cur.fetchall()])
print('Total changes:', conn.total_changes)
conn.close()
