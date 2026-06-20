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

export const bookRequestService = {
  listRequests: async () => {
    const url = `${API}/book-requests/`;
    const token = getAuthToken();
    const res = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: true
    });
    return res.data;
  },

  createRequest: async (payload: { book_id?: string | null }) => {
    const url = `${API}/book-requests/`;
    const token = getAuthToken();
    try {
      const res = await axios.post(url, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true
      });
      return res.data;
    } catch (err: any) {
      if (err.response) {
        const msg = `Request failed: ${err.response.status} ${err.response.statusText}`;
        const detail = err.response.data || err.response.data?.detail || err.message;
        const e = new Error(`${msg} - ${JSON.stringify(detail)}`);
        (e as any).status = err.response.status;
        throw e;
      } else if (err.request) {
        throw new Error('Network Error: no response received from server');
      } else {
        throw new Error(`Request setup error: ${err.message}`);
      }
    }
  },

  updateStatus: async (requestId: number, status: string) => {
    const url = `${API}/book-requests/${requestId}/status`;
    const token = getAuthToken();
    try {
      const res = await axios.put(url, { status }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        withCredentials: true
      });
      return res.data;
    } catch (err: any) {
      if (err.response) {
        const msg = `Update failed: ${err.response.status} ${err.response.statusText}`;
        const detail = err.response.data || err.response.data?.detail || err.message;
        const e = new Error(`${msg} - ${JSON.stringify(detail)}`);
        (e as any).status = err.response.status;
        throw e;
      } else if (err.request) {
        throw new Error('Network Error: no response received from server');
      } else {
        throw new Error(`Request setup error: ${err.message}`);
      }
    }
  }
};
