import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthToken = () => {
  const auth = localStorage.getItem('libraria_auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      return parsed.token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export interface BorrowRecord {
  id: string;
  user_id: string;
  book_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string | null;
  status: string;
  book?: any;
}

export const borrowService = {
  getUserBorrows: async (userId: string): Promise<BorrowRecord[]> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/borrows/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    // Normalize embedded book cover_url values so UI doesn't treat 'null' or '' as valid URLs
    const normalizeCover = (url: any) => {
      if (!url || typeof url !== 'string') return undefined;
      const s = url.trim();
      if (!s) return undefined;
      if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return undefined;
      return s;
    };

    const data = response.data || [];
    return data.map((rec: any) => {
      if (rec.book && typeof rec.book === 'object') {
        rec.book.cover_url = normalizeCover(rec.book.cover_url);
      }
      return rec as BorrowRecord;
    });
  }
};
