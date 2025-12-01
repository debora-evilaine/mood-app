import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from './components/HomeScreen';
import { SplashScreen } from './components/SplashScreen';
import { databaseService } from './services/database.services';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Inicializa o banco de dados quando o app inicia
        const initializeApp = async () => {
            try {
                await databaseService.init();
                console.log('✅ Database inicializado com sucesso');
            } catch (error) {
                console.error('❌ Erro ao inicializar database:', error);
            }
        };

        initializeApp();

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