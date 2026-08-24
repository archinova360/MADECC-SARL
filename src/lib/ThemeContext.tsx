import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase.ts';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, dbUser }: { children: React.ReactNode; dbUser: any }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Load theme when dbUser loads/changes
  useEffect(() => {
    if (dbUser && dbUser.theme) {
      setThemeState(dbUser.theme as Theme);
    } else {
      setThemeState('dark'); // Default appearance for new users is dark
    }
  }, [dbUser]);

  // Apply CSS theme class to html/body elements on state change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Smooth transitions for background and text
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // If authenticated, persist to Neon database
    if (dbUser) {
      try {
        const bypassToken = sessionStorage.getItem('admin_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (bypassToken) {
          headers['Authorization'] = `Bearer ${bypassToken}`;
        } else if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }

        if (headers['Authorization']) {
          await fetch('/api/user-theme', {
            method: 'POST',
            headers,
            body: JSON.stringify({ theme: newTheme })
          });
        }
      } catch (err) {
        console.warn('Non-fatal: Error saving theme preference to Neon DB:', err);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
