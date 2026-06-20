#!/usr/bin/env python
"""Debug script to check why recommendations aren't showing."""

from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo
from app.models.notes import Note
from app.models.notes_access_log import NotesAccessLog
from sqlalchemy import func

# Test user ID - replace with actual user ID
test_user_id = "ad2163ab-b9d9-4a55-9da9-07bc3987c4fe"

db = SessionLocal()

print("=" * 80)
print("DEBUGGING YOUTUBE RECOMMENDATIONS")
print("=" * 80)

# 1. Check total videos in database
total_videos = db.query(YouTubeVideo).count()
print(f"\n1. Total YouTube Videos in DB: {total_videos}")

if total_videos > 0:
    print("\nVideos:")
    for video in db.query(YouTubeVideo).limit(5).all():
        print(f"   - {video.title} (Subject: {video.subject})")

# 2. Check user's notes activity
notes_activity = db.query(NotesAccessLog).filter(
    NotesAccessLog.user_id == test_user_id
).count()
print(f"\n2. User's Notes Activity Count: {notes_activity}")

# 3. Get user's interest subjects
result = db.query(func.distinct(Note.subject)).join(
    NotesAccessLog,
    Note.id == NotesAccessLog.note_id
).filter(
    NotesAccessLog.user_id == test_user_id,
    Note.status == 'approved'
).all()

subjects = [subject[0] for subject in result if subject[0]]
print(f"\n3. User's Interest Subjects ({len(subjects)}):")
for subject in subjects:
    print(f"   - {subject}")

# 4. Check which video subjects are available
video_subjects = db.query(func.distinct(YouTubeVideo.subject)).filter(
    YouTubeVideo.status == 'active'
).all()
video_subjects_list = [s[0] for s in video_subjects if s[0]]
print(f"\n4. Available Video Subjects ({len(video_subjects_list)}):")
for subject in video_subjects_list:
    print(f"   - {subject}")

# 5. Check for case-insensitive matches
if subjects:
    subjects_lower = [s.lower() for s in subjects]
    matching_videos = db.query(YouTubeVideo).filter(
        YouTubeVideo.status == 'active',
        func.lower(YouTubeVideo.subject).in_(subjects_lower)
    ).all()
    
    print(f"\n5. Matching Videos (case-insensitive): {len(matching_videos)}")
    for video in matching_videos:
        print(f"   - {video.title} (Subject: {video.subject})")
else:
    print("\n5. No user subjects found - cannot match videos")

# 6. Check CRUD function
from app.crud.crud_youtube_recommendations import get_recommended_videos

videos, reason = get_recommended_videos(db, test_user_id, limit=15)
print(f"\n6. get_recommended_videos() result:")
print(f"   Reason: {reason}")
print(f"   Videos returned: {len(videos)}")

if videos:
    print("\n   Videos:")
    for video in videos[:5]:
        print(f"   - {video.title} (Popularity: {video.popularity_score})")

print("\n" + "=" * 80)
print("DEBUG COMPLETE")
print("=" * 80)

db.close()
