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

export interface NoteRecommendation {
    id: number;
    title: string;
    subject?: string;
    course?: string;
    semester?: string;
    file_type: string;
    status: string;
    ai_summary?: string;
}

export interface RecommendationsResponse {
    recommendations: NoteRecommendation[];
    reason: string;
    activity_count?: number;
    interested_subjects?: number;
}

export const recommendedNotesService = {
    getRecommendedNotes: async (limit: number = 8): Promise<RecommendationsResponse> => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/notes-recommendations/notes`, {
                params: { limit },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching recommended notes:', error.response?.data || error.message);
            throw error;
        }
    },

    getUserActivity: async (): Promise<any> => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/notes-recommendations/user-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching user activity:', error.response?.data || error.message);
            throw error;
        }
    }
};
