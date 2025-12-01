import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from './components/HomeScreen';
import { SplashScreen } from './components/SplashScreen';
import { databaseService } from './services/database.services';
import * as Notifications from 'expo-notifications';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Timer do splash screen
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {showSplash ? <SplashScreen /> : <HomeScreen />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5e1ff',
    },
});


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
