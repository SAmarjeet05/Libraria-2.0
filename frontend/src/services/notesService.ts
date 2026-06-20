import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Note {
  id: string | number;
  title: string;
  description?: string;
  content?: string;
  uploader?: string;
  tags: string[] | string;
  thumbnail?: string | null;
  subject?: string;
  semester?: string;
  course?: string;
  status?: string;
  ai_keywords?: string | string[] | null;
  category?: string;
  created_at?: string;
  file_type?: string;
}

const getAuthToken = () => {
  const auth = localStorage.getItem('libraria_auth');
  if (!auth) return null;
  try {
    const parsed = JSON.parse(auth);
    return parsed?.token || parsed?.access_token || null;
  } catch (e) {
    return null;
  }
};

export const notesService = {
  getNotes: async (): Promise<Note[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/notes`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  getNote: async (id: string | number): Promise<Note | null> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/api/notes/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }
};

export default notesService;
