#!/usr/bin/env python
"""Generate YouTube thumbnail URLs for all videos based on video_id."""

import sys
from datetime import datetime
sys.path.insert(0, '/'.join(__file__.split('/')[:-3]))

from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo

def generate_thumbnails():
    """Generate YouTube thumbnail URLs for all videos."""
    db = SessionLocal()
    
    try:
        videos = db.query(YouTubeVideo).all()
        
        if not videos:
            print("No videos found in database.")
            return
        
        print(f"Processing {len(videos)} videos...")
        print("-" * 80)
        
        updated_count = 0
        
        for video in videos:
            if video.video_id:
                # YouTube thumbnail URL pattern
                # Available sizes: default, mqdefault (320x180), hqdefault (480x360), sddefault (640x480), maxresdefault
                thumbnail_url = f"https://img.youtube.com/vi/{video.video_id}/mqdefault.jpg"
                
                if not video.thumbnail_url or video.thumbnail_url != thumbnail_url:
                    old_url = video.thumbnail_url
                    video.thumbnail_url = thumbnail_url
                    video.updated_at = datetime.utcnow()
                    updated_count += 1
                    
                    print(f"✓ {video.title}")
                    if old_url:
                        print(f"  Old: {old_url}")
                    print(f"  New: {thumbnail_url}")
                else:
                    print(f"- {video.title} (already set)")
        
        db.commit()
        print("-" * 80)
        print(f"✅ Successfully updated {updated_count} videos with thumbnail URLs!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    generate_thumbnails()
