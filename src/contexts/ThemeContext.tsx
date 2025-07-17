import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Theme {
  name: string;
  primary: string;
  primaryRGB: string;
  secondary: string;
  accent: string;
  warning: string;
  background: string;
  backgroundGradient: string;
  borderGradient: string;
  textShadow: string;
  glowColor: string;
  // Additional app-wide theme properties
  appBackground: string;
  cardBackground: string;
  navBackground: string;
  textPrimary: string;
  textSecondary: string;
  buttonBackground: string;
  inputBackground: string;
}

export const themes: Record<string, Theme> = {
  matrix: {
    name: "Matrix",
    primary: "#00ff41",
    primaryRGB: "0, 255, 65",
    secondary: "#00aaff",
    accent: "#ffaa00",
    warning: "#ff6600",
    background: "linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(20, 20, 20, 0.90) 100%)",
    backgroundGradient: "linear-gradient(135deg, rgba(0, 255, 65, 0.5), rgba(0, 170, 255, 0.3), rgba(255, 170, 0, 0.3))",
    borderGradient: "rgba(0, 255, 65, 0.3)",
    textShadow: "0 0 10px rgba(0, 255, 65, 0.5)",
    glowColor: "rgba(0, 255, 65, 0.3)",
    // App-wide properties
    appBackground: "linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)",
    cardBackground: "rgba(0, 20, 10, 0.8)",
    navBackground: "rgba(10, 10, 10, 0.95)",
    textPrimary: "#00ff41",
    textSecondary: "#aaa",
    buttonBackground: "rgba(0, 255, 65, 0.1)",
    inputBackground: "rgba(0, 20, 10, 0.6)",
  },
  iceBlue: {
    name: "Ice Blue",
    primary: "#00d4ff",
    primaryRGB: "0, 212, 255",
    secondary: "#ffffff",
    accent: "#b3e5fc",
    warning: "#ff9900",
    background: "linear-gradient(135deg, rgba(10, 20, 30, 0.95) 0%, rgba(20, 30, 40, 0.90) 100%)",
    backgroundGradient: "linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(255, 255, 255, 0.3), rgba(179, 229, 252, 0.3))",
    borderGradient: "rgba(0, 212, 255, 0.3)",
    textShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
    glowColor: "rgba(0, 212, 255, 0.3)",
    // App-wide properties
    appBackground: "linear-gradient(135deg, #0a1420 0%, #142030 50%, #0a1420 100%)",
    cardBackground: "rgba(10, 25, 40, 0.8)",
    navBackground: "rgba(15, 25, 35, 0.95)",
    textPrimary: "#00d4ff",
    textSecondary: "#cce6ff",
    buttonBackground: "rgba(0, 212, 255, 0.1)",
    inputBackground: "rgba(10, 25, 40, 0.6)",
  }
};

interface ThemeContextType {
  currentTheme: keyof typeof themes;
  theme: Theme;
  setTheme: (themeName: keyof typeof themes) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('matrix');

  const setTheme = (themeName: keyof typeof themes) => {
    setCurrentTheme(themeName);
  };

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'matrix' ? 'iceBlue' : 'matrix');
  };

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
