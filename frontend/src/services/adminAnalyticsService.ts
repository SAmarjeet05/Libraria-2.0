import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const adminAnalyticsService = {
  // Dashboard metrics (books, users, borrows, trends)
  getDashboardMetrics: async () => {
    const res = await axios.get(`${API}/api/reports/`);
    return res.data;
  },

  // Notes analytics summary
  getNotesAnalytics: async () => {
    const res = await axios.get(`${API}/api/notes/analytics/summary`);
    return res.data;
  },

  // Most downloaded notes
  getMostDownloadedNotes: async (limit = 10) => {
    const res = await axios.get(`${API}/api/notes/analytics/most_downloaded?limit=${limit}`);
    return res.data;
  },

  // Downloads per day trend
  getDownloadTrends: async (days = 7) => {
    const res = await axios.get(`${API}/api/notes/analytics/downloads_per_day?days=${days}`);
    return res.data;
  },

  // Views per day trend
  getViewTrends: async (days = 7) => {
    const res = await axios.get(`${API}/api/notes/analytics/views_per_day?days=${days}`);
    return res.data;
  },

  // Top contributors
  getTopContributors: async (limit = 10) => {
    const res = await axios.get(`${API}/api/notes/analytics/top_contributors?limit=${limit}`);
    return res.data;
  },

  // Book view statistics
  getBookViewStats: async () => {
    const res = await axios.get(`${API}/api/book-views/stats`);
    return res.data;
  },

  // Book issues by book
  getBookIssues: async () => {
    const res = await axios.get(`${API}/api/reports/book_issues`);
    return res.data;
  },
};
