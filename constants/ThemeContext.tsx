import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItem, saveItem } from '../utils/storage';
import Colors from './Colors';

type ThemeColors = typeof Colors.dark;

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: Colors.dark,
  isDark: true,
  toggleTheme: async () => {},
  isAuthenticated: true,
  checkAuth: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getItem('appTheme');
      if (saved !== null) setIsDark(saved === 'dark');
    })();
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    await saveItem('appTheme', next);
  };

  const checkAuth = async () => {
    const token = await getItem('userToken');
    setIsAuthenticated(!!token);
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? Colors.dark : Colors.light, isDark, toggleTheme, isAuthenticated, checkAuth }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
