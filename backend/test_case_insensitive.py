from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo
from sqlalchemy import func

db = SessionLocal()

# Test case-insensitive query directly
test_subjects = ['constitution of india', 'engineering physics']

query = db.query(YouTubeVideo).filter(
    YouTubeVideo.status == 'active',
    func.lower(YouTubeVideo.subject).in_(test_subjects)
)

result = query.all()
print(f"Found {len(result)} videos:")
for v in result:
    print(f"  - {v.title} (subject: {v.subject})")

# Debug: check what's in database
print("\nAll active videos:")
all_videos = db.query(YouTubeVideo).filter(YouTubeVideo.status == 'active').all()
for v in all_videos:
    print(f"  ID: {v.id}, Subject: '{v.subject}', Subject lower: '{v.subject.lower() if v.subject else 'NONE'}'")

db.close()
