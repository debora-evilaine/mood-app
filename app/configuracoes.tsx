import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { databaseService, Configuracao } from '../src/services/database.services';
import { NotificationService } from '../src/services/notification.service';
import { useTheme } from '../src/context/ThemeContext'; // Importando o hook

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme(); // Pegando cores do contexto

  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const goBack = () => router.back();

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
      console.error("Erro config:", error);
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

  const handleClearData = () => {
    Alert.alert(
      "Limpar Dados",
      "Tem certeza? Essa ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar Tudo",
          style: "destructive",
          onPress: async () => {
            await databaseService.deleteAllMoodEntries();
            Alert.alert("Sucesso", "Registros apagados.");
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background[0] }]}>
        <ActivityIndicator size="large" color={colors.icon} />
      </View>
    );
  }

  return (
    // 1. Gradiente dinâmico vindo do contexto
    <LinearGradient colors={colors.background as any} style={styles.gradientContainer}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 30, paddingBottom: 30 }]}>
        <Stack.Screen
          options={{
            title: "Configurações",
            headerTintColor: colors.icon, // Cor dinâmica
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }}
        />

        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
            <Text style={[styles.backText, { color: colors.icon }]}>Voltar</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Seção Notificações */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.icon }]}>Notificações</Text>

            <View style={styles.row}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Lembrete Diário</Text>
              </View>
              <Switch
                value={!!config?.lembreteAtivo}
                onValueChange={toggleLembrete}
                trackColor={{ false: colors.tint, true: colors.icon }} // Cores dinâmicas
                thumbColor={!!config?.lembreteAtivo ? "#FFF" : "#f4f3f4"}
              />
            </View>

            {!!config?.lembreteAtivo && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.rowLabelContainer}>
                    <Ionicons name="time-outline" size={22} color={colors.text} />
                    <Text style={[styles.rowLabel, { color: colors.text }]}>Horário</Text>
                  </View>
                  <View style={[styles.timeValueContainer, { backgroundColor: colors.tint }]}>
                    <Text style={[styles.timeValueText, { color: colors.icon }]}>
                      {config?.horaLembrete}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Seção Aparência */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.icon }]}>Aparência</Text>
            <View style={styles.row}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={22} color={colors.text} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Modo Escuro</Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={() => toggleTheme()} // Chama a função do contexto
                trackColor={{ false: colors.tint, true: colors.icon }}
                thumbColor={theme === 'dark' ? "#FFF" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Seção Dados */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.icon }]}>Dados</Text>
            <TouchableOpacity style={styles.row} onPress={handleClearData}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <Text style={[styles.rowLabel, { color: colors.danger }]}>Apagar todos os registros</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sobre */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.icon }]}>Sobre</Text>
            <View style={styles.aboutContainer}>
              <Ionicons name="heart" size={40} color={colors.icon} style={{ marginBottom: 10 }} />
              <Text style={[styles.appName, { color: colors.text }]}>MoodFlow</Text>
              <Text style={[styles.version, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
              <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
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

// Styles "estruturais" ficam aqui. Cores foram movidas para inline styles acima.
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
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
  },
  version: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
