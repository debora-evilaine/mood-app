
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from './components/HomeScreen';
import { SplashScreen } from './components/SplashScreen';
import * as Notifications from 'expo-notifications';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    return (
        <View style={styles.container}>
            <HomeScreen />

            {showSplash && (
                <SplashScreen onFinish={() => setShowSplash(false)} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5e1ff', // Cor de fundo de fallback
    },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
