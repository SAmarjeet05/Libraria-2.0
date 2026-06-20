import { useState, useEffect } from 'react';
import { AuthState } from '../types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  useEffect(() => {
    // Check for existing session on mount
    const savedAuth = localStorage.getItem('libraria_auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        // Only update if the state is different
        if (JSON.stringify(parsed) !== JSON.stringify(authState)) {
          setAuthState(parsed);
        }
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        localStorage.removeItem('libraria_auth');
      }
    } else if (authState.isAuthenticated) {
      // If there's no saved auth but we're authenticated, reset the state
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null
      });
    }
  }, []);

  const login = async (token: string, userData: any): Promise<boolean> => {
    try {
      // Convert backend user data to frontend User type
      const userRole: 'Admin' | 'User' = userData.role?.toUpperCase() === 'ADMIN' ? 'Admin' : 'User';
      
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user: {
          id: String(userData.id), // Convert to string as frontend expects string
          email: userData.email,
          role: userRole,
          name: userData.full_name,
          avatar: userData.avatar || `https://www.gravatar.com/avatar/${encodeURIComponent(userData.email)}?d=mp`
        },
        token
      };
      
      setAuthState(newAuthState);
      localStorage.setItem('libraria_auth', JSON.stringify(newAuthState));
      // Prefetch a welcome quote for this user so the Library welcome page can show it immediately
      (async () => {
        try {
          const uid = String(newAuthState.user?.id || '');
          if (!uid) return;
              // Fetch library welcome
              const res = await fetch('/api/ai/welcome');
              if (res.ok) {
                const j = await res.json();
                if (j && j.quote) {
                  try {
                    sessionStorage.setItem(`libraria_welcome_quote_${uid}`, j.quote);
                  } catch (e) { /* ignore storage errors */ }
                }
              }
              // Also fetch notes-specific welcome concurrently
              (async () => {
                try {
                  const r2 = await fetch('/api/ai/welcome?module=notes');
                  if (!r2.ok) return;
                  const j2 = await r2.json();
                  if (j2 && j2.quote) {
                    try {
                      sessionStorage.setItem(`libraria_welcome_notes_${uid}`, j2.quote);
                    } catch (e) { /* ignore storage errors */ }
                  }
                } catch (err) {
                  console.warn('Prefetch notes welcome failed', err);
                }
              })();
        } catch (e) {
          // Don't block login on quote generation errors
          console.warn('Prefetch welcome quote failed', e);
        }
      })();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
    localStorage.removeItem('libraria_auth');
  };

  const hasRole = (requiredRole: 'User' | 'Admin'): boolean => {
    if (!authState.user) return false;
    if (requiredRole === 'User') return true; // Users can access user-level features
    return authState.user.role === 'Admin'; // Only admins can access admin features
  };

  return {
    ...authState,
    login,
    logout,
    hasRole
  };
};