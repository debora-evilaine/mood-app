import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RegistroHumor from '../src/components/RegistroHumor';
import { useTheme } from '../src/context/ThemeContext';
import { StyleSheet } from 'react-native';

export default function NovoRegistroRoute() {
    const { colors } = useTheme();
    const params = useLocalSearchParams();

    // Recupera a data passada via params ou usa a data atual
    const dateParam = params.date ? new Date(params.date as string) : new Date();

    return (
        <LinearGradient colors={colors.background as any} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />
                
                {/* Renderiza o componente reutilizável */}
                <RegistroHumor initialDate={dateParam} />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: 10,
    }
});
