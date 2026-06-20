import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get the auth token
const getAuthToken = () => {
    const auth = localStorage.getItem('libraria_auth');
    if (auth) {
        const { token } = JSON.parse(auth);
        return token;
    }
    return null;
};

export interface YouTubeVideoRecommendation {
    id: number;
    title: string;
    description?: string;
    youtube_url: string;
    video_id: string;
    thumbnail_url?: string;
    subject?: string;
    course?: string;
    semester?: string;
    popularity_score: number;
}

export interface RecommendationsResponse {
    recommendations: YouTubeVideoRecommendation[];
    reason: string;
    activity_count?: number;
    interested_subjects?: number;
}

export const recommendedVideosService = {
    getRecommendedVideos: async (limit: number = 6, signal?: AbortSignal): Promise<RecommendationsResponse> => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/youtube-recommendations/videos`, {
                params: { limit },
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal // Pass abort signal to axios
            });
            return response.data;
        } catch (error: any) {
            // Re-throw abort errors so they can be handled properly
            if (axios.isCancel(error) || error.name === 'CanceledError') {
                const abortError = new Error('Request aborted');
                abortError.name = 'AbortError';
                throw abortError;
            }
            console.error('Error fetching recommended videos:', error);
            throw error;
        }
    },

    getUserActivity: async (): Promise<any> => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/youtube-recommendations/user-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user activity:', error);
            throw error;
        }
    }
};
