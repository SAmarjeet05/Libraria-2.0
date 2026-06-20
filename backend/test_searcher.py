from app.utils.youtube_searcher import YouTubeVideoSearcher

searcher = YouTubeVideoSearcher()
print('Testing YouTube search...')
print('Has API key:', searcher.has_api)
print('Has yt-dlp:', searcher.has_yt_dlp)

print('\nSearching for programming tutorial...')
results = searcher.search_videos('python programming tutorial', max_results=3)
print(f'Found {len(results)} results')
for r in results:
    title = r.get('title', 'N/A')
    vid_id = r.get('video_id', 'N/A')
    duration = r.get('duration', 0)
    views = r.get('view_count', 0)
    print(f'Title: {title}')
    print(f'Video ID: {vid_id}')
    print(f'Duration: {duration} seconds, Views: {views}')
    print('---')
