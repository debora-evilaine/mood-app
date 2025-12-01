import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importação correta
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../src/services/database.services';
import { MoodEntry } from '../src/models/Mood';
import { useTheme } from '../src/context/ThemeContext'; // 1. Hook do tema
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width } = Dimensions.get('window');

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasMood: boolean;
  moodEntries: MoodEntry[];
  primaryMood: string | null;
  moodColor: string;
}

export default function CalendarioScreen() {
  const router = useRouter();
  const goBack = () => router.back();
  const { colors, theme } = useTheme(); // 2. Cores do tema

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableMoods, setAvailableMoods] = useState<string[]>([]);

  const loadMoodEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await databaseService.getAllMoodEntries();
      const formattedEntries = (entries || []).map(entry => ({
        id: entry.id,
        date: entry.date || new Date().toISOString(),
        notes: entry.notes || entry.texto || null,
        humores: entry.humores || entry.humoresNomes || [],
        tags: entry.tags || entry.tagsNomes || []
      }));
      setMoodEntries(formattedEntries);

      const allHumores = formattedEntries.flatMap(entry => entry.humores);
      const uniqueHumores = Array.from(new Set(allHumores));
      setAvailableMoods(uniqueHumores);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      const { MOCK_RECORDS } = require('../src/models/Mood');
      setMoodEntries(MOCK_RECORDS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMoodEntries();
    }, [loadMoodEntries])
  );

  useEffect(() => {
    loadMoodEntries();
  }, []);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getMoodColor = useCallback((mood: string | null) => {
    const moodColors: Record<string, string> = {
      'Calmo': '#87CEEB',
      'Feliz': '#FFD700',
      'Triste': '#6495ED',
      'Bravo': '#FF4500',
      'Desapontado': '#B0C4DE',
      'Preocupado': '#FFA07A',
      'Assustado': '#8A2BE2',
      'Frustrado': '#A52A2A',
      'Estressado': '#FF6347',
      'Cansado': '#4B5563',
      'Ansioso': '#DC2626',
      'Energizado': '#EA580C',
      'Motivado': '#059669',
    };
    // Fallback usa a cor do ícone do tema se não achar a cor do humor
    return mood ? (moodColors[mood] || colors.icon) : '#E5E7EB';
  }, [colors]);

  const getPrimaryMood = useCallback((entries: MoodEntry[]): string | null => {
    if (entries.length === 0) return null;

    const moodCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.humores && entry.humores.length > 0) {
        entry.humores.forEach(humor => {
          if (humor) {
            moodCount[humor] = (moodCount[humor] || 0) + 1;
          }
        });
      }
    });

    if (Object.keys(moodCount).length === 0) return null;

    const primaryMood = Object.entries(moodCount).reduce((prev, current) =>
      prev[1] > current[1] ? prev : current
    )[0];

    return primaryMood;
  }, []);

  const generateCalendarDays = useCallback((): DayData[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const days: DayData[] = [];
    let currentDay = startDate;

    while (currentDay <= endDate) {
      const date = new Date(currentDay);
      const isCurrentMonth = isSameMonth(date, currentDate);
      const isToday = isSameDay(date, new Date());
      const isSelected = isSameDay(date, selectedDate);

      const dayMoodEntries = moodEntries.filter(entry => {
        try {
          const entryDate = parseISO(entry.date);
          return isSameDay(entryDate, date);
        } catch (error) {
          try {
            const entryDate = new Date(entry.date);
            return isSameDay(entryDate, date);
          } catch {
            return false;
          }
        }
      });

      const hasMood = dayMoodEntries.length > 0;
      const primaryMood = getPrimaryMood(dayMoodEntries);
      const moodColor = getMoodColor(primaryMood);

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        hasMood,
        moodEntries: dayMoodEntries,
        primaryMood,
        moodColor,
      });

      currentDay = addDays(currentDay, 1);
    }

    return days;
  }, [currentDate, selectedDate, moodEntries, getPrimaryMood, getMoodColor]);

  const calendarDays = useMemo(() => generateCalendarDays(), [generateCalendarDays]);

  const selectedDayEntries = useMemo(() => {
    return moodEntries.filter(entry => {
      try {
        const entryDate = parseISO(entry.date);
        return isSameDay(entryDate, selectedDate);
      } catch (error) {
        try {
          const entryDate = new Date(entry.date);
          return isSameDay(entryDate, selectedDate);
        } catch {
          return false;
        }
      }
    });
  }, [selectedDate, moodEntries]);

  const primaryMood = useMemo(() => getPrimaryMood(selectedDayEntries), [selectedDayEntries, getPrimaryMood]);
  const moodColor = useMemo(() => getMoodColor(primaryMood), [primaryMood, getMoodColor]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const formatSelectedDate = useCallback((date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, []);

  const navigateToCreateEntry = () => {
    const dateStr = selectedDate.toISOString();
    // Passa a data selecionada como parâmetro
    router.push({ pathname: '/novo-registro', params: { date: dateStr } });
  };

  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const monthEntries = moodEntries.filter(entry => {
      try {
        const entryDate = parseISO(entry.date);
        return isWithinInterval(entryDate, {
          start: startOfDay(monthStart),
          end: endOfDay(monthEnd)
        });
      } catch {
        return false;
      }
    });

    const daysWithEntries = new Set(
      monthEntries.map(entry => {
        try {
          const entryDate = parseISO(entry.date);
          return format(entryDate, 'yyyy-MM-dd');
        } catch {
          return '';
        }
      }).filter(date => date !== '')
    ).size;

    const totalEntries = monthEntries.length;
    const mostCommonMood = getPrimaryMood(monthEntries);

    return {
      daysWithEntries,
      totalEntries,
      mostCommonMood
    };
  }, [currentDate, moodEntries, getPrimaryMood]);

  return (
    // 3. Gradiente dinâmico
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 10, paddingBottom: 10 }]}>
        <Stack.Screen
          options={{
            title: "Calendário",
            headerTintColor: colors.icon,
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
            <Text style={[styles.backText, { color: colors.icon }]}>Voltar</Text>
          </TouchableOpacity>

          {/* Cabeçalho do calendário - Cores dinâmicas */}
          <View style={[
            styles.calendarHeader,
            { backgroundColor: colors.card, borderColor: colors.cardBorder }
          ]}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={colors.icon} />
            </TouchableOpacity>

            <View style={styles.monthContainer}>
              <Text style={[styles.monthText, { color: colors.text }]}>
                {format(currentDate, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={goToToday}
                style={[styles.todayButton, { backgroundColor: colors.icon }]}
              >
                <Text style={styles.todayButtonText}>HOJE</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Estatísticas do mês */}
          <View style={[
            styles.statsContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder }
          ]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.icon }]}>{monthStats.totalEntries}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total de registros</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.moodStatBadge, { backgroundColor: getMoodColor(monthStats.mostCommonMood) }]}>
                <Text style={styles.moodStatText}>
                  {monthStats.mostCommonMood || '-'}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Humor mais comum</Text>
            </View>
          </View>

          {/* Dias da semana */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Grid do calendário */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.otherMonthDay,
                  day.isToday && [styles.todayCell, { backgroundColor: colors.tint }], // Cor dinâmica para "Hoje"
                  day.isSelected && [styles.selectedCell, { backgroundColor: colors.tint + '80' }], // Cor dinâmica para "Selecionado"
                ]}
                onPress={() => setSelectedDate(day.date)}
                activeOpacity={0.7}
              >
                <View style={styles.dayContent}>
                  <Text style={[
                    styles.dayText,
                    { color: colors.text }, // Cor padrão do texto
                    !day.isCurrentMonth && { color: colors.textSecondary, opacity: 0.5 },
                    day.isToday && [styles.todayDayText, { color: colors.icon }],
                    day.isSelected && [styles.selectedDayText, { color: colors.icon }],
                  ]}>
                    {format(day.date, 'd')}
                  </Text>

                  {/* Indicador de humor */}
                  {day.hasMood && (
                    <View style={[
                      styles.moodIndicator,
                      { backgroundColor: day.moodColor }
                    ]} />
                  )}

                  {/* Indicador de seleção (anel) */}
                  {day.isSelected && (
                    <View style={[styles.selectionRing, { borderColor: colors.icon }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Detalhes do dia selecionado */}
          <View style={[
            styles.detailsContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder }
          ]}>
            <View style={styles.detailsHeader}>
              <Text style={[styles.detailsTitle, { color: colors.text }]}>
                {formatSelectedDate(selectedDate)}
              </Text>
              <TouchableOpacity onPress={navigateToCreateEntry} style={styles.addButton}>
                <Ionicons name="add-circle" size={28} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Botão de Mock (Opcional: pode remover ou estilizar também) */}
            <TouchableOpacity
              onPress={() => {
                const { MOCK_RECORDS } = require('../src/models/Mood');
                setMoodEntries(MOCK_RECORDS);
                alert('Mostrando dados mock para teste visual');
              }}
              style={{
                backgroundColor: '#FFD700',
                padding: 10,
                borderRadius: 8,
                margin: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#333', fontWeight: '600' }}>
                🧪 Mostrar Dados Mock (Teste)
              </Text>
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</Text>
              </View>
            ) : selectedDayEntries.length > 0 ? (
              <View style={styles.entriesContainer}>
                <View style={[styles.summaryCard, { backgroundColor: colors.tint }]}>
                  <View style={[styles.moodBadge, { backgroundColor: moodColor }]}>
                    <Text style={styles.moodBadgeText}>
                      {primaryMood || 'Sem registro'}
                    </Text>
                  </View>
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    {selectedDayEntries.length} registro(s) neste dia
                  </Text>
                </View>

                {selectedDayEntries.map((entry, index) => (
                  <View
                    key={`${entry.id || index}-${index}`}
                    style={[
                      styles.entryCard,
                      // Card interno mais claro/escuro que o fundo
                      { backgroundColor: theme === 'dark' ? colors.background[1] : '#FFF', borderColor: colors.cardBorder }
                    ]}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.entryMoods}>
                        {entry.humores && entry.humores.map((mood, idx) => (
                          <View
                            key={`${mood}-${idx}`}
                            style={[
                              styles.moodChip,
                              { backgroundColor: getMoodColor(mood) }
                            ]}
                          >
                            <Text style={styles.moodChipText}>{mood}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                        {format(new Date(entry.date), 'HH:mm')}
                      </Text>
                    </View>

                    {entry.notes && (
                      <Text style={[styles.entryNotes, { color: colors.text }]} numberOfLines={3}>
                        {entry.notes}
                      </Text>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {entry.tags.map((tag, idx) => (
                          <View key={`${tag}-${idx}`} style={[styles.tag, { backgroundColor: colors.tint }]}>
                            <Text style={[styles.tagText, { color: colors.icon }]}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={colors.textSecondary + '80'} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum registro para este dia</Text>
                <TouchableOpacity
                  onPress={navigateToCreateEntry}
                  style={[styles.emptyButton, { backgroundColor: colors.icon }]}
                >
                  <Text style={styles.emptyButtonText}>Registrar Humor</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  monthContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  moodStatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  moodStatText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: width / 7 - 2,
    aspectRatio: 1,
    padding: 4,
    margin: 1,
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  todayCell: {
    borderRadius: 8,
  },
  selectedCell: {
    borderRadius: 8,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayDayText: {
    fontWeight: '700',
  },
  selectedDayText: {
    fontWeight: '700',
  },
  moodIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectionRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  detailsContainer: {
    margin: 16,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  entriesContainer: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  moodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moodBadgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMoods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  moodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  entryNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
