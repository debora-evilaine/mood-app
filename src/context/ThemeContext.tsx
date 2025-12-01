import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { databaseService } from '../services/database.services';

type ThemeType = 'light' | 'dark';

// Definindo a estrutura das cores
interface ThemeColors {
  background: string[];
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  icon: string;
  tint: string;   // Cor de fundo para inputs/botões inativos
  danger: string; // Cor para ações destrutivas (ex: apagar)
  success: string;
}

interface ThemeContextData {
  theme: ThemeType;
  toggleTheme: () => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

const themes: Record<ThemeType, ThemeColors> = {
  light: {
    background: ["#F3E8FF", "#FCE7F3", "#DBEAFE"], // Gradiente claro
    card: "rgba(255, 255, 255, 0.8)",
    cardBorder: "#E9D5FF",
    text: "#4C1D95",        // Roxo escuro
    textSecondary: "#6B7280", // Cinza médio
    icon: "#7C3AED",        // Roxo vibrante
    tint: "#F3F4F6",        // Cinza claro
    danger: "#EF4444",      // Vermelho
    success: "#10B981"
  },
  dark: {
    background: ["#2E1065", "#1F2937", "#111827"], // Gradiente escuro
    card: "rgba(31, 41, 55, 0.8)", // Cinza escuro translúcido
    cardBorder: "#4B5563",
    text: "#E9D5FF",        // Roxo claro
    textSecondary: "#9CA3AF", // Cinza claro
    icon: "#A78BFA",        // Roxo pastel
    tint: "#374151",        // Cinza escuro
    danger: "#F87171",      // Vermelho claro
    success: "#34D399"
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const config = await databaseService.getConfiguracaoGlobal?.();
        if (config && config.tema) {
          setTheme(config.tema as ThemeType);
        } else {
          setTheme(systemScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.log('Erro ao ler tema', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await databaseService.updateConfiguracaoGlobal?.({ tema: newTheme });
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
    }
  };

  const colors = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
