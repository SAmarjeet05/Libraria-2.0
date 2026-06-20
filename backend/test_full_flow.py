from app.core.database import SessionLocal
from app.models.youtube_video_access import YouTubeVideoAccess
from app.crud.crud_youtube_recommendations import (
    get_recommended_videos,
    get_user_watched_videos,
    get_user_interest_subjects_from_all_activity
)
from app.models.notes_access_log import NotesAccessLog

db = SessionLocal()

# Get a real user
user_log = db.query(NotesAccessLog).first()
if not user_log:
    print("No users")
    db.close()
    exit()

user_id = str(user_log.user_id)
print(f"User: {user_id}")

# Check watched videos
watched = get_user_watched_videos(db, user_id)
print(f"\nWatched videos: {watched}")

# Check subjects
subjects = get_user_interest_subjects_from_all_activity(db, user_id)
print(f"\nInterest subjects: {subjects}")
print(f"Subjects (lowercase): {[s.lower() for s in subjects]}")

# Get recommendations
videos, reason = get_recommended_videos(db, user_id, 6)
print(f"\nRecommendations (reason: {reason}): {len(videos)} videos")
for v in videos:
    print(f"  - {v.title}")

db.close()
