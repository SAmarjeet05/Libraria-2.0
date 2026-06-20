"""Utility script to ensure the `notes_ai_logs` table has the desired columns.

Usage (PowerShell):
    cd backend
    .\venv\Scripts\activate
    python scripts\add_notes_ai_logs_columns.py

The script will:
 - add `execution_result TEXT` and `user_input TEXT` columns if missing
 - remove the `outcome` column if it already exists (recreates the table safely)
This script is safe to run multiple times.
"""
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))


def table_columns(conn, table_name):
    cur = conn.execute(f"PRAGMA table_info('{table_name}')")
    return [row[1] for row in cur.fetchall()]


def add_column_if_missing(conn, table_name, column_def):
    # column_def like "execution_result TEXT"
    col_name = column_def.split()[0]
    cols = table_columns(conn, table_name)
    if col_name in cols:
        print(f"Column '{col_name}' already present in {table_name}")
        return False
    sql = f"ALTER TABLE {table_name} ADD COLUMN {column_def};"
    print(f"Adding column: {sql}")
    conn.execute(sql)
    return True


def drop_column_if_exists(conn, table_name, col_name):
    cols = table_columns(conn, table_name)
    if col_name not in cols:
        print(f"Column '{col_name}' not present in {table_name}; nothing to drop")
        return False

    print(f"Dropping column '{col_name}' from {table_name} (recreating table without this column)")
    # Build new column definitions from PRAGMA table_info
    cur = conn.execute(f"PRAGMA table_info('{table_name}')")
    rows = cur.fetchall()
    new_cols = [r for r in rows if r[1] != col_name]
    if not new_cols:
        raise RuntimeError('Cannot drop the only column in table')

    col_defs = []
    col_names = []
    pk_cols = []
    for r in new_cols:
        name = r[1]
        typ = r[2] or ''
        notnull = ' NOT NULL' if r[3] else ''
        dflt = f" DEFAULT {r[4]}" if r[4] is not None else ''
        col_defs.append(f"{name} {typ}{notnull}{dflt}")
        col_names.append(name)
        if r[5]:
            pk_cols.append(name)

    pk_clause = ''
    if pk_cols:
        pk_clause = f", PRIMARY KEY ({', '.join(pk_cols)})"

    tmp_table = f"{table_name}__new"
    create_sql = f"CREATE TABLE {tmp_table} ({', '.join(col_defs)}{pk_clause});"
    conn.execute('PRAGMA foreign_keys=off;')
    conn.execute('BEGIN TRANSACTION;')
    conn.execute(create_sql)
    cols_list = ', '.join(col_names)
    conn.execute(f"INSERT INTO {tmp_table} ({cols_list}) SELECT {cols_list} FROM {table_name};")
    conn.execute(f"DROP TABLE {table_name};")
    conn.execute(f"ALTER TABLE {tmp_table} RENAME TO {table_name};")
    conn.execute('COMMIT;')
    conn.execute('PRAGMA foreign_keys=on;')
    return True


def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH)
    try:
        changed = False
        # If an old `outcome` column exists, remove it first
        changed |= drop_column_if_exists(conn, 'notes_ai_logs', 'outcome')
        # If an old `note_id` column exists, remove it and replace with `user_id`
        changed |= drop_column_if_exists(conn, 'notes_ai_logs', 'note_id')
        # Ensure desired columns exist
        changed |= add_column_if_missing(conn, 'notes_ai_logs', 'execution_result TEXT')
        changed |= add_column_if_missing(conn, 'notes_ai_logs', 'user_input TEXT')
        changed |= add_column_if_missing(conn, 'notes_ai_logs', 'user_id INTEGER')
        if changed:
            conn.commit()
            print("Schema changes applied.")
        else:
            print("No schema changes needed.")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
