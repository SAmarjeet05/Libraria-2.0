from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo

db = SessionLocal()
count = db.query(YouTubeVideo).count()
print(f'Total videos in database: {count}')

# Show some samples
videos = db.query(YouTubeVideo).order_by(YouTubeVideo.created_at.desc()).limit(5).all()
print('\nLatest videos:')
for v in videos:
    title = v.title[:60] if v.title else 'N/A'
    subject = v.subject or 'N/A'
    print(f'Title: {title}')
    print(f'Subject: {subject}')
    print('---')

db.close()
