"""
YouTube API service for fetching videos based on search queries.
Uses Google's YouTube Data API v3.
"""

import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# YouTube Data API configuration
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"

# Fallback: Use yt-dlp for video metadata extraction if API key not available
try:
    from yt_dlp import YoutubeDL
    HAS_YT_DLP = True
except ImportError:
    HAS_YT_DLP = False
    logger.warning("yt-dlp not installed. Install with: pip install yt-dlp")


class YouTubeVideoSearcher:
    """Service to search and fetch YouTube videos."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize YouTube searcher.
        
        Args:
            api_key: YouTube Data API key (defaults to YOUTUBE_API_KEY env var)
        """
        self.api_key = api_key or YOUTUBE_API_KEY
        self.has_api = bool(self.api_key)
        self.has_yt_dlp = HAS_YT_DLP
    
    def search_videos(
        self,
        query: str,
        max_results: int = 10,
        order: str = "relevance"
    ) -> List[Dict]:
        """Search YouTube videos using API or yt-dlp.
        
        Args:
            query: Search query (e.g., "Python programming tutorial")
            max_results: Number of results to return
            order: Sort order - "relevance", "viewCount", "rating", "videoCount"
        
        Returns:
            List of video information dicts with keys:
            - video_id: YouTube video ID
            - title: Video title
            - description: Video description
            - thumbnail_url: Thumbnail URL
            - channel_name: Channel name
            - view_count: View count
            - upload_date: Upload date
            - duration: Video duration in seconds
        """
        if self.has_api:
            return self._search_with_api(query, max_results, order)
        elif self.has_yt_dlp:
            return self._search_with_yt_dlp(query, max_results)
        else:
            logger.error("No YouTube search method available. Set YOUTUBE_API_KEY or install yt-dlp")
            return []
    
    def _search_with_api(
        self,
        query: str,
        max_results: int,
        order: str
    ) -> List[Dict]:
        """Search using YouTube Data API."""
        try:
            # Search for videos
            search_params = {
                "key": self.api_key,
                "part": "snippet",
                "q": query,
                "maxResults": min(max_results, 50),
                "type": "video",
                "order": order,
                "videoCaption": "closedCaption",
                "relevanceLanguage": "en"
            }
            
            search_response = requests.get(
                f"{YOUTUBE_API_BASE_URL}/search",
                params=search_params,
                timeout=10
            )
            search_response.raise_for_status()
            
            results = []
            video_ids = []
            
            # Extract video IDs from search results
            for item in search_response.json().get("items", []):
                if item["id"]["kind"] == "youtube#video":
                    video_ids.append(item["id"]["videoId"])
            
            if not video_ids:
                return []
            
            # Get detailed video statistics
            stats_response = requests.get(
                f"{YOUTUBE_API_BASE_URL}/videos",
                params={
                    "key": self.api_key,
                    "part": "statistics,contentDetails,snippet",
                    "id": ",".join(video_ids)
                },
                timeout=10
            )
            stats_response.raise_for_status()
            
            for item in stats_response.json().get("items", []):
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                content_details = item.get("contentDetails", {})
                
                # Parse duration (ISO 8601 format to seconds)
                duration_str = content_details.get("duration", "PT0S")
                duration = self._parse_duration(duration_str)
                
                video_info = {
                    "video_id": item["id"],
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "thumbnail_url": snippet.get("thumbnails", {}).get(
                        "high", {}
                    ).get("url", ""),
                    "channel_name": snippet.get("channelTitle", ""),
                    "view_count": int(stats.get("viewCount", 0)),
                    "upload_date": snippet.get("publishedAt", ""),
                    "duration": duration
                }
                results.append(video_info)
            
            logger.info(f"Found {len(results)} videos for query: {query}")
            return results
            
        except requests.exceptions.RequestException as e:
            logger.error(f"YouTube API error: {e}")
            return []
    
    def _search_with_yt_dlp(
        self,
        query: str,
        max_results: int
    ) -> List[Dict]:
        """Search using yt-dlp (web scraping alternative)."""
        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": "in_playlist",
                "skip_download": True,
                "default_search": "ytsearch",
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                search_result = ydl.extract_info(query, download=False)
            
            if not search_result:
                logger.warning(f"No search results for query: {query}")
                return []
            
            results = []
            entries = search_result.get("entries", [])
            
            if not entries:
                logger.warning(f"No entries found for query: {query}")
                return []
            
            for entry in entries[:max_results]:
                if not entry:
                    continue
                
                video_info = {
                    "video_id": entry.get("id", ""),
                    "title": entry.get("title", ""),
                    "description": entry.get("description", ""),
                    "thumbnail_url": entry.get("thumbnail", ""),
                    "channel_name": entry.get("uploader", ""),
                    "view_count": entry.get("view_count") or 0,
                    "upload_date": entry.get("upload_date", ""),
                    "duration": entry.get("duration") or 0
                }
                results.append(video_info)
            
            logger.info(f"Found {len(results)} videos for query: {query} (via yt-dlp)")
            return results
            
        except Exception as e:
            logger.error(f"yt-dlp search error: {e}")
            return []
    
    @staticmethod
    def _parse_duration(duration_str: str) -> int:
        """Parse ISO 8601 duration string to seconds.
        
        Example: PT1H30M45S -> 5445 seconds
        """
        import re
        pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
        match = re.match(pattern, duration_str)
        
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def get_video_url(self, video_id: str) -> str:
        """Get the YouTube URL for a video ID."""
        return f"https://www.youtube.com/watch?v={video_id}"
