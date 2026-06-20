import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpenIcon, EyeIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { VideoModal } from './VideoModal';
import { recommendedVideosService, YouTubeVideoRecommendation } from '../services/youtubeRecommendationService';
import { useAuth } from '../hooks/useAuth';

interface RecommendationsResponse {
  recommendations: YouTubeVideoRecommendation[];
  reason: string;
  activity_count?: number;
  interested_subjects?: number;
}

export const RecommendedVideosSection: React.FC = () => {
  const { user } = useAuth();
  const [allVideos, setAllVideos] = useState<YouTubeVideoRecommendation[]>([]);
  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoRecommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchRecommendations = async () => {
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this fetch
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setHasLoaded(true);
    
    try {
      // Fetch 10 videos with abort signal
      const result: RecommendationsResponse = await recommendedVideosService.getRecommendedVideos(
        10, 
        abortControllerRef.current.signal
      );
      
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setAllVideos(result.recommendations || []);
      setReason(result.reason || '');
      
      // Initialize watched videos from localStorage
      const watchedKey = `watched_videos_${user?.id}`;
      const savedWatched = localStorage.getItem(watchedKey);
      if (savedWatched) {
        setWatchedVideoIds(new Set(JSON.parse(savedWatched)));
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        console.log('Video recommendations fetch was cancelled');
        return;
      }
      console.error('Error fetching recommendations:', err);
      setAllVideos([]);
      setReason('error');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Cleanup on unmount - cancel any ongoing fetch
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleVideoClick = (video: YouTubeVideoRecommendation) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    
    // Mark video as watched (only in localStorage, no backend call needed for real-time videos)
    if (selectedVideo) {
      // Add to watched videos
      const updatedWatched = new Set(watchedVideoIds);
      updatedWatched.add(selectedVideo.id);
      setWatchedVideoIds(updatedWatched);
      
      // Save to localStorage
      const watchedKey = `watched_videos_${user?.id}`;
      localStorage.setItem(watchedKey, JSON.stringify(Array.from(updatedWatched)));
    }
    
    setSelectedVideo(null);
  };

  // New user with no activity
  if (!loading && hasLoaded && reason === 'new_user') {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Recommended Videos For You</h2>
        <Card className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-amber-100 mb-2">
            No Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-amber-200 mb-4">
            Start exploring notes and resources to get personalized video recommendations!
          </p>
          <p className="text-sm text-gray-500 dark:text-amber-100">
            Your interests will help us recommend relevant educational videos.
          </p>
        </Card>
      </div>
    );
  }

  // No recommendations found
  if (!loading && hasLoaded && allVideos.length === 0 && reason !== 'new_user') {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Recommended Videos For You</h2>
        <Card className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-amber-100 mb-2">
            No Videos Available
          </h3>
          <p className="text-gray-600 dark:text-amber-200 mb-4">
            No videos match your interests right now. Check back soon!
          </p>
        </Card>
      </div>
    );
  }

  // Initial state - not loaded yet
  if (!hasLoaded) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Recommended Videos For You</h2>
        <Card className="text-center py-12 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-purple-200 dark:border-purple-800">
          <PlayIcon className="w-16 h-16 mx-auto mb-4 text-purple-500 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-amber-100 mb-2">
            Personalized Video Recommendations
          </h3>
          <p className="text-gray-600 dark:text-amber-200 mb-6 max-w-md mx-auto">
            Click below to discover educational videos tailored to your interests and learning activity.
          </p>
          <Button
            onClick={fetchRecommendations}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <PlayIcon className="w-5 h-5 inline mr-2" />
            Load Video Recommendations
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This may take a few seconds to find the best videos for you
          </p>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Recommended Videos For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-video rounded-lg mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Separate videos into unwatched and watched
  const unwatchedVideos = allVideos.filter(v => !watchedVideoIds.has(v.id));
  const watchedVideos = allVideos.filter(v => watchedVideoIds.has(v.id));

  // Display recommendations
  return (
    <div className="py-12 space-y-12">
      {/* Unwatched Videos Section */}
      {unwatchedVideos.length > 0 && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Recommended Videos For You</h2>
            <p className="text-gray-600 dark:text-amber-200">
              Based on your activity and interests in specific subjects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unwatchedVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                <Card hover className="h-full flex flex-col overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3" style={{ aspectRatio: '16 / 9' }}>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900">
                        <PlayIcon className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <PlayIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Popularity Badge */}
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-md">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {(video.popularity_score).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900 dark:text-white">
                      {video.title}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {video.subject && (
                        <p><strong>Subject:</strong> {video.subject}</p>
                      )}
                      {video.course && (
                        <p><strong>Course:</strong> {video.course}</p>
                      )}
                    </div>

                    {video.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    {/* Watch Button */}
                    <div className="mt-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full flex items-center justify-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(video);
                        }}
                      >
                        <PlayIcon className="w-4 h-4" />
                        Watch
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Watched Videos Section */}
      {watchedVideos.length > 0 && (
        <div>
          <div className="mb-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">
              <EyeIcon className="w-6 h-6 text-gray-900 dark:text-amber-300" />
              Videos You've Watched
            </h2>
            <p className="text-gray-600 dark:text-amber-200">
              {watchedVideos.length} video{watchedVideos.length !== 1 ? 's' : ''} watched
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchedVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                <Card hover className="h-full flex flex-col overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                  {/* Thumbnail with watched overlay */}
                  <div className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3" style={{ aspectRatio: '16 / 9' }}>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900">
                        <PlayIcon className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}

                    {/* Watched badge overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <EyeIcon className="w-12 h-12 text-white" />
                    </div>

                    {/* Popularity Badge */}
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-md">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {(video.popularity_score).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900 dark:text-white">
                      {video.title}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {video.subject && (
                        <p><strong>Subject:</strong> {video.subject}</p>
                      )}
                      {video.course && (
                        <p><strong>Course:</strong> {video.course}</p>
                      )}
                    </div>

                    {video.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    {/* Watch Again Button */}
                    <div className="mt-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full flex items-center justify-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(video);
                        }}
                      >
                        <PlayIcon className="w-4 h-4" />
                        Watch Again
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          videoId={selectedVideo.video_id}
          title={selectedVideo.title}
          thumbnail={selectedVideo.thumbnail_url}
        />
      )}
    </div>
  );
};
