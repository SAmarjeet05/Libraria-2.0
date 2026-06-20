from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo
from app.models.notes import Note
from sqlalchemy import func

db = SessionLocal()

print("Subjects in YouTube videos:")
video_subjects = db.query(func.distinct(YouTubeVideo.subject)).all()
for s in video_subjects:
    print(f"  - '{s[0]}'")

print("\nSubjects in Notes:")
note_subjects = db.query(func.distinct(Note.subject)).filter(
    Note.status == 'approved'
).all()
for s in note_subjects:
    print(f"  - '{s[0]}'")

db.close()
