import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'standard' | 'couple';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('standard');
  const [isMobileView, setIsMobileView] = useState<boolean>(true);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isMobileView, setIsMobileView }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
