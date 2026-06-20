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

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface CategoryCreate {
    name: string;
    description?: string;
}

export const categoryService = {
    getCategories: async (): Promise<Category[]> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/categories`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    getCategory: async (id: number): Promise<Category> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/categories/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    createCategory: async (category: CategoryCreate): Promise<Category> => {
        const token = getAuthToken();
        const response = await axios.post(`${API_URL}/categories`, category, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};