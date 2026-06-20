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

export interface WishlistCreate {
    book_id: string;
    notes?: string;
}

export interface WishlistItem {
    id: number;
    user_id: string;
    book_id: string;
    added_at?: string;
    status: string;
    notes?: string;
}

export const wishlistService = {
    getWishlist: async (): Promise<WishlistItem[]> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/wishlist`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    addToWishlist: async (payload: WishlistCreate): Promise<WishlistItem> => {
        const token = getAuthToken();
        const response = await axios.post(`${API_URL}/wishlist`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    deleteWishlistItem: async (id: number): Promise<void> => {
        const token = getAuthToken();
        await axios.delete(`${API_URL}/wishlist/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    },

    updateWishlistItem: async (id: number, payload: Partial<WishlistItem>): Promise<WishlistItem> => {
        const token = getAuthToken();
        const response = await axios.patch(`${API_URL}/wishlist/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};
