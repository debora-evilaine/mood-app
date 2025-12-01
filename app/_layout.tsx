import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'; // Import useTheme
import { databaseService } from '../src/services/database.services';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Componente separado para a navegação poder usar o hook useTheme
function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Define a cor de fundo do container de navegação igual ao tema
        contentStyle: { backgroundColor: colors.rootBackground },
        // Animação padrão suave (opcional, 'default', 'fade', 'slide_from_right')
        animation: 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="configuracoes" />
      {/* Outras telas... */}
    </Stack>
  );
}

export default function Layout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await databaseService.init();
        setIsDbReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error("Erro crítico DB:", e);
        setIsDbReady(true);
        await SplashScreen.hideAsync();
      }
    };
    initDB();
  }, []);

  if (!isDbReady) return null;

  return (
    <ThemeProvider>
      {/* O Navigator fica dentro do Provider para acessar as cores */}
      <AppNavigator />
    </ThemeProvider>
  );
}
