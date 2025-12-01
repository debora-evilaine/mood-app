import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui'; // <--- Importar SystemUI
import { databaseService } from '../services/database.services';

type ThemeType = 'light' | 'dark';

interface ThemeColors {
  background: string[];
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  icon: string;
  tint: string;
  danger: string;
  success: string;
  rootBackground: string; // <--- Nova cor sólida para o fundo da navegação
}

interface ThemeContextData {
  theme: ThemeType;
  toggleTheme: () => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

const themes: Record<ThemeType, ThemeColors> = {
  light: {
    background: ["#F3E8FF", "#FCE7F3", "#DBEAFE"],
    card: "rgba(255, 255, 255, 0.8)",
    cardBorder: "#E9D5FF",
    text: "#4C1D95",
    textSecondary: "#6B7280",
    icon: "#7C3AED",
    tint: "#F3F4F6",
    danger: "#EF4444",
    success: "#10B981",
    rootBackground: "#F3E8FF" // Cor sólida similar ao início do gradiente
  },
  dark: {
    background: ["#2E1065", "#1F2937", "#111827"],
    card: "rgba(31, 41, 55, 0.8)",
    cardBorder: "#4B5563",
    text: "#E9D5FF",
    textSecondary: "#9CA3AF",
    icon: "#A78BFA",
    tint: "#374151",
    danger: "#F87171",
    success: "#34D399",
    rootBackground: "#2E1065" // Cor sólida similar ao início do gradiente
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('light');

  // Função auxiliar para aplicar cor de fundo na raiz
  const updateSystemBackground = (newTheme: ThemeType) => {
    const color = themes[newTheme].rootBackground;
    SystemUI.setBackgroundColorAsync(color);
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const config = await databaseService.getConfiguracaoGlobal?.();
        let loadedTheme: ThemeType = 'light';

        if (config && config.tema) {
          loadedTheme = config.tema as ThemeType;
        } else {
          loadedTheme = systemScheme === 'dark' ? 'dark' : 'light';
        }

        setTheme(loadedTheme);
        updateSystemBackground(loadedTheme); // Aplica ao iniciar

      } catch (error) {
        console.log('Erro ao ler tema', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateSystemBackground(newTheme); // Aplica ao trocar

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
