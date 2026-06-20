from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo
from app.models.youtube_video_access import YouTubeVideoAccess

db = SessionLocal()

# Get first user with watched videos
access = db.query(YouTubeVideoAccess).first()
if access:
    user_id = str(access.user_id)
    print(f"User: {user_id}")
    print(f"Has watched videos: {access.user_id}")
    
    # Clear watched videos for testing
    watched_records = db.query(YouTubeVideoAccess).filter(
        YouTubeVideoAccess.user_id == user_id
    ).all()
    
    print(f"\nClearing {len(watched_records)} watched records...")
    for record in watched_records:
        db.delete(record)
    
    db.commit()
    print("Cleared!")

db.close()
