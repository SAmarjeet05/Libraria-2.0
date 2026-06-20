import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

export const notesAnalyticsService = {
  getSummary: async () => {
    const token = getAuthToken();
    const res = await axios.get(`${API}/notes/analytics/summary`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return res.data;
  },

  getMostDownloaded: async (limit = 10) => {
    const token = getAuthToken();
    const res = await axios.get(`${API}/notes/analytics/most_downloaded?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return res.data;
  },

  getDownloadsPerDay: async (days = 14) => {
    const token = getAuthToken();
    const res = await axios.get(`${API}/notes/analytics/downloads_per_day?days=${days}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return res.data;
  },

  getViewsPerDay: async (days = 7) => {
    const token = getAuthToken();
    const res = await axios.get(`${API}/notes/analytics/views_per_day?days=${days}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return res.data;
  },

  getTopContributors: async (limit = 10) => {
    const token = getAuthToken();
    const res = await axios.get(`${API}/notes/analytics/top_contributors?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return res.data;
  }
};

export default notesAnalyticsService;
