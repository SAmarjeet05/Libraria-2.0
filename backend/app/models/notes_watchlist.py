"""
NotesWatchlist model removed.

This file previously defined the `notes_watchlist` table. The model has been
removed to prevent the table from being recreated on app startup. Use the
`backend/scripts/drop_old_tables.py` script to remove the old table from the
database safely (the script makes a backup before making changes).
"""

__all__ = []
