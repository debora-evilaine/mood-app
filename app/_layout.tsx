import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { databaseService } from '../src/services/database.services';
import * as SplashScreen from 'expo-splash-screen';

// Mantém a tela de splash nativa visível até dizermos para esconder
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        // 1. Inicia o Banco de Dados
        await databaseService.init();
        // 2. Avisa que está pronto
        setIsDbReady(true);
        // 3. Esconde a splash screen nativa
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error("Erro crítico ao iniciar DB:", e);
        // Mesmo com erro, liberamos o app (talvez num estado de erro)
        setIsDbReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initDB();
  }, []);

  // Enquanto o banco não carrega, não renderizamos nada (a Splash nativa segura a onda)
  if (!isDbReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="configuracoes" />
      </Stack>
    </ThemeProvider>
  );
}
