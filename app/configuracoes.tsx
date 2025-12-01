import React, { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../src/services/notification.service';
import { useTheme } from '../src/context/ThemeContext'; 
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { databaseService, Configuracao } from '../src/services/database.services';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<Configuracao | null>(null);

  // Estado para o DateTimePicker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const goBack = () => router.back();

  // Carregar configurações do banco
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const currentConfig = await databaseService.getConfiguracaoGlobal?.();
      if (currentConfig) {
        setConfig(currentConfig);
        const [hours, minutes] = currentConfig.horaLembrete.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 8);
        date.setMinutes(minutes || 0);
        setTempTime(date);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      Alert.alert("Erro", "Não foi possível carregar as configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLembrete = async (value: boolean) => {
        if (!config) return;
        try {
            const newValue = value ? 1 : 0;
            const success = await databaseService.updateConfiguracaoGlobal?.({ lembreteAtivo: newValue });
            
            if (success) {
                setConfig({ ...config, lembreteAtivo: newValue });
                
                if (value) {
                    await NotificationService.scheduleDailyReminder(config.horaLembrete);
                } else {
                    await NotificationService.cancelReminders();
                }
            }
        } catch (error) {
            Alert.alert("Erro", "Falha ao atualizar lembrete.");
        }
    };

  const onChangeTime = async (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (event.type === 'set' && selectedDate && config) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            try {
                const success = await databaseService.updateConfiguracaoGlobal?.({ horaLembrete: timeString });
                
                if (success) {
                    setConfig({ ...config, horaLembrete: timeString });
                    setTempTime(selectedDate);

                    if (config.lembreteAtivo) {
                        await NotificationService.scheduleDailyReminder(timeString);
                    }
                }
            } catch (error) {
                Alert.alert("Erro", "Falha ao atualizar horário.");
            }
        }
    };

  // Limpar Dados
  const handleClearData = () => {
    Alert.alert(
      "Limpar Dados",
      "Tem certeza que deseja apagar todos os registros de humor? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar Tudo",
          style: "destructive",
          onPress: async () => {
            try {
              await databaseService.deleteAllMoodEntries();
              Alert.alert("Sucesso", "Todos os registros foram apagados.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar os dados.");
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#F3E8FF", "#FCE7F3", "#DBEAFE"]} style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: "Configurações",
            headerTintColor: "#7C3AED",
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }}
        />

        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#7C3AED" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Seção de Notificações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificações</Text>

            <View style={styles.row}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="notifications-outline" size={22} color="#6B21A8" />
                <Text style={styles.rowLabel}>Lembrete Diário</Text>
              </View>
              <Switch
                value={!!config?.lembreteAtivo}
                onValueChange={toggleLembrete}
                trackColor={{ false: "#D1D5DB", true: "#A78BFA" }}
                thumbColor={!!config?.lembreteAtivo ? "#7C3AED" : "#f4f3f4"}
              />
            </View>

            {!!config?.lembreteAtivo && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.rowLabelContainer}>
                    <Ionicons name="time-outline" size={22} color="#6B21A8" />
                    <Text style={styles.rowLabel}>Horário</Text>
                  </View>
                  <View style={styles.timeValueContainer}>
                    <Text style={styles.timeValueText}>{config?.horaLembrete}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Seção de Aparência */}
          <View style={[styles.section, { backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.icon }]}>Aparência</Text>
              <View style={styles.row}>
                  <View style={styles.rowLabelContainer}>
                      <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={22} color={colors.icon} />
                      <Text style={[styles.rowLabel, { color: colors.text }]}>Modo Escuro</Text>
                  </View>
                  <Switch
                      value={theme === 'dark'}
                      onValueChange={() => toggleTheme()} // Chama a função do contexto
                      trackColor={{ false: "#D1D5DB", true: "#A78BFA" }}
                      thumbColor={theme === 'dark' ? "#7C3AED" : "#f4f3f4"}
                  />
              </View>
          </View>

          {/* Seção de Dados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados</Text>
            <TouchableOpacity style={styles.row} onPress={handleClearData}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                <Text style={[styles.rowLabel, { color: "#EF4444" }]}>Apagar todos os registros</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sobre o App */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <View style={styles.aboutContainer}>
              <Ionicons name="heart" size={40} color="#7C3AED" style={{ marginBottom: 10 }} />
              <Text style={styles.appName}>MoodFlow</Text>
              <Text style={styles.version}>Versão 1.0.0</Text>
              <Text style={styles.aboutText}>
                Desenvolvido para ajudar você a monitorar e entender suas emoções diariamente.
              </Text>
            </View>
          </View>

        </ScrollView>

        {showTimePicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeTime}
          />
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backText: {
    marginLeft: 4,
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#6B21A8',
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9333EA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeValueText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4C1D95',
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});
