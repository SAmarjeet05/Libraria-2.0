import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  enableSystem?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  enableSystem = true,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('libraria_theme_mode');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemeMode;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const getSystemTheme = (): ResolvedTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const updateResolvedTheme = (currentTheme: ThemeMode) => {
    const resolved = currentTheme === 'system' ? getSystemTheme() : currentTheme;
    setResolvedTheme(resolved);
    return resolved;
  };

  useEffect(() => {
    const resolved = updateResolvedTheme(theme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    
    localStorage.setItem('libraria_theme_mode', theme);
    localStorage.setItem('libraria_resolved_theme', resolved);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#121212' : '#ffffff');
    }
  }, [theme]);

  useEffect(() => {
    if (!enableSystem || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      updateResolvedTheme('system');
      const resolved = getSystemTheme();
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, enableSystem]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme(enableSystem ? 'system' : 'light');
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hooks for theme-specific styling
export const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  
  return {
    isDark: resolvedTheme === 'dark',
    surface: resolvedTheme === 'dark' ? '#121212' : '#ffffff',
    surfaceVariant: resolvedTheme === 'dark' ? '#1e1e1e' : '#f8fafc',
    surfaceContainer: resolvedTheme === 'dark' ? '#2d2d2d' : '#f1f5f9',
    onSurface: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.87)' : '#1c1b1f',
    onSurfaceVariant: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.60)' : '#49454f',
    onSurfaceMuted: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.60)' : '#73777f',
    primary: resolvedTheme === 'dark' ? '#bae6fd' : '#0ea5e9',
    primaryContainer: resolvedTheme === 'dark' ? '#075985' : '#e0f2fe',
    onPrimary: resolvedTheme === 'dark' ? '#0c4a6e' : '#ffffff',
    secondary: resolvedTheme === 'dark' ? '#99f6e4' : '#14b8a6',
    secondaryContainer: resolvedTheme === 'dark' ? '#115e59' : '#ccfbf1',
    error: resolvedTheme === 'dark' ? '#CF6679' : '#B00020',
    outline: resolvedTheme === 'dark' ? '#938f99' : '#79747e',
    outlineVariant: resolvedTheme === 'dark' ? '#49454f' : '#cac5cd',
  };
};

// Material Design elevation utility
export const useElevation = (level: 0 | 1 | 2 | 3 | 4 | 5 = 1) => {
  const { resolvedTheme } = useTheme();
  
  const elevations = {
    light: {
      0: 'none',
      1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
    },
    dark: {
      0: 'none',
      1: '0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.30)',
      2: '0 3px 6px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.35)',
      3: '0 10px 20px rgba(0,0,0,0.30), 0 6px 6px rgba(0,0,0,0.35)',
      4: '0 14px 28px rgba(0,0,0,0.35), 0 10px 10px rgba(0,0,0,0.30)',
      5: '0 19px 38px rgba(0,0,0,0.40), 0 15px 12px rgba(0,0,0,0.30)',
    },
  };
  
  return elevations[resolvedTheme][level];
};