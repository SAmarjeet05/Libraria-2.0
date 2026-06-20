import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthToken = () => {
  const auth = localStorage.getItem('libraria_auth');
  if (auth) {
    try {
      return JSON.parse(auth).token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const ebookIssueService = {
  getUserIssues: async (userId: string) => {
    const token = getAuthToken();
    const resp = await axios.get(`${API_URL}/ebook_issues/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return resp.data || [];
  },

  revokeIssue: async (issueId: string) => {
    const token = getAuthToken();
    const resp = await axios.post(`${API_URL}/ebook_issues/revoke/${issueId}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return resp.data;
  }
  ,
  createIssue: async (payload: { user_id: string; book_id: string; expiry_date?: string | null; status?: string }) => {
    const token = getAuthToken();
    try {
      const resp = await axios.post(`${API_URL}/ebook_issues/issue`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      return resp.data;
    } catch (err: any) {
      // Normalize axios/network errors so callers can show more details
      if (err.response) {
        // Server responded with a status outside 2xx
        const status = err.response.status;
        const detail = err.response.data || err.response.data?.detail || err.message;

        // Map the specific "already issued" case to a friendly message
        try {
          const det = typeof detail === 'string' ? detail : (detail.detail || JSON.stringify(detail));
          if (status === 400 && /already issued/i.test(String(det))) {
            const e = new Error('User already has this ebook');
            (e as any).status = 409; // use 409-like semantics client-side
            throw e;
          }
        } catch (parseErr) {
          // fall through to default behavior
        }

        const msg = `Request failed: ${status} ${err.response.statusText}`;
        const e = new Error(`${msg} - ${JSON.stringify(detail)}`);
        (e as any).status = status;
        throw e;
      } else if (err.request) {
        // Request was sent but no response received (network error / CORS / server down)
        const e = new Error(`Network Error: no response received from ${API_URL}/ebook_issues/issue`);
        throw e;
      } else {
        throw new Error(`Request setup error: ${err.message}`);
      }
    }
  }
};
