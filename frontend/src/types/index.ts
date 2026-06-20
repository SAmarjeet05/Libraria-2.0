export interface User {
  id: string;
  email: string;
  role: 'User' | 'Admin';
  name: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

interface Book {
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
  location?: string;
  status: 'available' | 'reserved' | 'removed';
  added_at: string;
  avg_rating?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface ModuleConfig {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  requiresAuth: boolean;
  allowedRoles: ('User' | 'Admin')[];
}