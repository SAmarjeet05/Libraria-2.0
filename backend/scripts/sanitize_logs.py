import sqlite3, os
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
# Clear action field when it equals the ai_response (to avoid duplicating AI answer in action)
c.execute("UPDATE logs SET action = '' WHERE action IS NOT NULL AND ai_response IS NOT NULL AND action = ai_response")
conn.commit()
print('Sanitized rows:', conn.total_changes)
conn.close()
