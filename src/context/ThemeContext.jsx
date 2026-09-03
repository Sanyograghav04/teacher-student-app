import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  // Always lock into warm, human-crafted light theme
  const [theme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('gurukul-theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Keep in human-made warm theme
    const root = document.documentElement;
    root.classList.remove('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
