#!/usr/bin/env python
"""Test real-time YouTube video recommendations."""

from app.core.database import SessionLocal
from app.crud.crud_youtube_recommendations import get_recommended_videos

# Test user ID
test_user_id = "ad2163ab-b9d9-4a55-9da9-07bc3987c4fe"

db = SessionLocal()

print("=" * 80)
print("TESTING REAL-TIME YOUTUBE SEARCH")
print("=" * 80)

print("\nFetching real-time recommendations from YouTube...")
videos, reason = get_recommended_videos(db, test_user_id, limit=15)

print(f"\nReason: {reason}")
print(f"Videos found: {len(videos)}")

if videos:
    print("\n" + "=" * 80)
    print("RECOMMENDED VIDEOS (Real-time from YouTube)")
    print("=" * 80)
    for i, video in enumerate(videos, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   Subject: {video['subject']}")
        print(f"   Video ID: {video['video_id']}")
        print(f"   Popularity: {video['popularity_score']:.2f}")
        print(f"   URL: {video['youtube_url']}")
else:
    print("\nNo videos found!")

print("\n" + "=" * 80)

db.close()
