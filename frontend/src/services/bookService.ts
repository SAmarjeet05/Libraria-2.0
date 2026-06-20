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

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category_id?: number;
    publisher?: string;
    publication_year?: number;
    description?: string;
    cover_url?: string;
    total_copies: number;
    available_copies: number;
    status: 'available' | 'reserved' | 'removed';
    added_at: string;
    has_ebook: boolean;
    ebook_url?: string;
    location?: string;
    category?: {
        id: number;
        name: string;
        description?: string;
    };
};

export interface BookCreate {
    title: string;
    author: string;
    isbn: string;
    category_id?: number;
    publisher?: string;
    publication_year?: number;
    description?: string;
    cover_url?: string;
    total_copies: number;
    available_copies: number;
    status?: string;
    has_ebook?: boolean;
    ebook_url?: string;
    location?: string;
}

export const bookService = {
    getBooks: async (): Promise<Book[]> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/books`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Normalize cover_url values (sometimes backend returns literal "null"/empty strings)
        const normalize = (b: any) => ({
            ...b,
            cover_url: (b?.cover_url && typeof b.cover_url === 'string' && b.cover_url.trim() && b.cover_url.toLowerCase() !== 'null' && b.cover_url.toLowerCase() !== 'undefined') ? b.cover_url : undefined
        });
        return (response.data || []).map((b: any) => normalize(b));
    },

    getBookIssues: async (): Promise<Array<{book_id: string; title: string; issues: number;}>> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/reports/book_issues`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    getUserBorrowRecords: async (): Promise<Array<{id: string; book_id: string; status: string; borrowed_at: string; due_date: string; returned_at?: string;}>> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/borrows/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data || [];
    },

    getBook: async (id: string): Promise<Book> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/books/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const b = response.data;
        return {
            ...b,
            cover_url: (b?.cover_url && typeof b.cover_url === 'string' && b.cover_url.trim() && b.cover_url.toLowerCase() !== 'null' && b.cover_url.toLowerCase() !== 'undefined') ? b.cover_url : undefined
        } as Book;
    },

    createBook: async (book: BookCreate): Promise<Book> => {
        const token = getAuthToken();
        const response = await axios.post(`${API_URL}/books`, book, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    updateBook: async (id: string, book: Partial<BookCreate>): Promise<Book> => {
        const token = getAuthToken();
        const response = await axios.put(`${API_URL}/books/${id}`, book, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    deleteBook: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await axios.delete(`${API_URL}/books/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    ,
    uploadEbook: async (file: File): Promise<{ mega_public_link: string; mega_path: string }> => {
        const token = getAuthToken();
        const form = new FormData();
        form.append('file', file, file.name);

        const response = await axios.post(`${API_URL}/books/upload-ebook`, form, {
            headers: {
                Authorization: `Bearer ${token}`
                // Let axios set Content-Type with boundary for FormData
            }
        });
        return response.data;
    },

    // Book Views API
    recordBookView: async (bookId: string, sessionId?: string): Promise<any> => {
        const token = getAuthToken();
        const response = await axios.post(`${API_URL}/book-views/`, 
            { book_id: bookId, session_id: sessionId },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getBookViewCount: async (bookId: string): Promise<number> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/book-views/book/${bookId}/count`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.total_views || 0;
    },

    getAllBooksViews: async (): Promise<Array<{book_id: string; total_views: number}>> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/book-views/all-books-views`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data || [];
    },

    getAllBooksPopularity: async (): Promise<Array<any>> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/books/popularity/all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data || [];
    },

    getBookPopularity: async (bookId: string): Promise<any> => {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/books/${bookId}/popularity`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
}

// Recommendations API
export const recommendationService = {
    getRecommendedBooks: async (limit: number = 8): Promise<any> => {
        const token = getAuthToken();
        try {
            const response = await axios.get(`${API_URL}/recommendations/books`, {
                params: { limit },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching recommendations:', error.response?.data || error.message);
            return {
                recommendations: [],
                reason: 'error',
                error: error.message
            };
        }
    },

    getUserActivity: async (): Promise<any> => {
        const token = getAuthToken();
        try {
            const response = await axios.get(`${API_URL}/recommendations/user-activity`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching user activity:', error.response?.data || error.message);
            return { has_activity: false };
        }
    },

    getUserCategories: async (): Promise<any> => {
        const token = getAuthToken();
        try {
            const response = await axios.get(`${API_URL}/recommendations/user-categories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching user categories:', error.response?.data || error.message);
            return { interested_categories: [], count: 0 };
        }
    }
}