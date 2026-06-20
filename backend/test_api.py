#!/usr/bin/env python
"""Test the YouTube recommendations API directly."""

from app.core.database import SessionLocal
from app.models.notes_access_log import NotesAccessLog
from app.crud.crud_youtube_recommendations import get_recommended_videos, get_user_interest_subjects_from_all_activity

db = SessionLocal()

# Get a real user
user_log = db.query(NotesAccessLog).first()
if not user_log:
    print("No users with activity found")
    db.close()
    exit()

user_id = str(user_log.user_id)
print(f"Testing with user: {user_id}")

# Get user's interest subjects
subjects = get_user_interest_subjects_from_all_activity(db, user_id)
print(f"\nUser's interest subjects: {subjects}")

# Get recommendations
videos, reason = get_recommended_videos(db, user_id, 6)
print(f"\nRecommendations (reason: {reason}):")
print(f"Videos returned: {len(videos)}")

for v in videos:
    print(f"  - {v.title}")
    print(f"    Subject: {v.subject}, Score: {v.popularity_score}")
    print(f"    Video ID: {v.video_id}")

db.close()
