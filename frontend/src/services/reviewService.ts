import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthToken = () => {
  const auth = localStorage.getItem('libraria_auth');
  if (auth) return JSON.parse(auth).token;
  return null;
};

export interface Review {
  id: number;
  user_id: string;
  book_id: string;
  rating: number;
  review_text?: string | null;
  upvotes?: number;
  downvotes?: number;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
}

export interface CreateReviewPayload {
  book_id: string;
  rating: number;
  review_text?: string;
}

export const reviewService = {
  getReviews: async (bookId: string, options?: { limit?: number; offset?: number; filter?: string; sort?: string }) => {
    const token = getAuthToken();
    const params: any = { limit: options?.limit || 50, offset: options?.offset || 0 };
    if (options?.filter) params.filter = options.filter;
    if (options?.sort) params.sort = options.sort;
    const res = await axios.get(`${API_URL}/reviews/book/${bookId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data as Review[];
  },

  createReview: async (payload: CreateReviewPayload) => {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/reviews/`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data as Review;
  },

  updateReview: async (reviewId: string, payload: Partial<CreateReviewPayload>) => {
    const token = getAuthToken();
    const res = await axios.put(`${API_URL}/reviews/${reviewId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data as Review;
  },

  deleteReview: async (reviewId: string) => {
    const token = getAuthToken();
    const res = await axios.delete(`${API_URL}/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },

  voteReview: async (reviewId: string, vote: 'up' | 'down') => {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/reviews/${reviewId}/vote`, null, {
      params: { vote },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data as Review;
  }
};

export default reviewService;
