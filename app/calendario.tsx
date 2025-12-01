import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../src/services/database.services';
import { MoodEntry } from '../src/models/Mood';
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
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [availableMoods, setAvailableMoods] = useState<string[]>([]);

    // Carregar registros do banco de dados
    const loadMoodEntries = useCallback(async () => {
        try {
            setIsLoading(true);
            const entries = await databaseService.getAllMoodEntries();
            // Garantir que os registros tenham a estrutura correta
            const formattedEntries = (entries || []).map(entry => ({
                id: entry.id,
                date: entry.date || new Date().toISOString(),
                notes: entry.notes || entry.texto || null,
                humores: entry.humores || entry.humoresNomes || [],
                tags: entry.tags || entry.tagsNomes || []
            }));
            setMoodEntries(formattedEntries);
            
            // Extrair humores únicos para cores
            const allHumores = formattedEntries.flatMap(entry => entry.humores);
            const uniqueHumores = Array.from(new Set(allHumores));
            setAvailableMoods(uniqueHumores);
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            // Fallback para dados mock em caso de erro
            const { MOCK_RECORDS } = require('../src/models/Mood');
            setMoodEntries(MOCK_RECORDS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Recarregar registros quando a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            loadMoodEntries();
        }, [loadMoodEntries])
    );

    // Carregar inicial
    useEffect(() => {
        loadMoodEntries();
    }, []);

    // Navegação entre meses
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

    // Cores para diferentes humores
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
        
        return mood ? (moodColors[mood] || '#7C3AED') : '#E5E7EB';
    }, []);

    // Obter humor predominante para um conjunto de entradas
    const getPrimaryMood = useCallback((entries: MoodEntry[]): string | null => {
        if (entries.length === 0) return null;
        
        // Contar frequência de humores
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
        
        // Encontrar humor mais frequente
        const primaryMood = Object.entries(moodCount).reduce((prev, current) => 
            prev[1] > current[1] ? prev : current
        )[0];
        
        return primaryMood;
    }, []);

    // Gerar dias do calendário
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
            
            // Filtrar registros para este dia específico
            const dayMoodEntries = moodEntries.filter(entry => {
                try {
                    const entryDate = parseISO(entry.date);
                    return isSameDay(entryDate, date);
                } catch (error) {
                    // Tentar formato alternativo se parseISO falhar
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

    // Obter registros do dia selecionado
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

    // Nomes dos dias da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatar data para exibição
    const formatSelectedDate = useCallback((date: Date) => {
        return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }, []);

    // Navegar para tela de criar/editar registro
    const navigateToCreateEntry = () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Aqui navega para tela de criação/edição de registro
        // router.push({ pathname: '/criar-registro', params: { date: dateStr } });
        alert(`Criar registro para ${dateStr}`);
    };

    // Estatísticas do mês atual
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
        <LinearGradient colors={["#F3E8FF", "#FCE7F3", "#DBEAFE"]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen 
                    options={{
                        title: "Calendário",
                        headerTintColor: "#7C3AED",
                        headerStyle: { backgroundColor: "transparent" },
                        headerShadowVisible: false,
                    }}
                />

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Cabeçalho do calendário */}
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color="#7C3AED" />
                        </TouchableOpacity>
                        
                        <View style={styles.monthContainer}>
                            <Text style={styles.monthText}>
                                {format(currentDate, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
                            </Text>
                            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                                <Text style={styles.todayButtonText}>HOJE</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color="#7C3AED" />
                        </TouchableOpacity>
                    </View>

                    {/* Estatísticas do mês */}
                    <View style={styles.statsContainer}> 
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{monthStats.totalEntries}</Text>
                            <Text style={styles.statLabel}>Total de registros</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.moodStatBadge, { backgroundColor: getMoodColor(monthStats.mostCommonMood) }]}>
                                <Text style={styles.moodStatText}>
                                    {monthStats.mostCommonMood || '-'}
                                </Text>
                            </View>
                            <Text style={styles.statLabel}>Humor mais comum</Text>
                        </View>
                    </View>

                    {/* Dias da semana */}
                    <View style={styles.weekDaysContainer}>
                        {weekDays.map((day, index) => (
                            <View key={index} style={styles.weekDayCell}>
                                <Text style={styles.weekDayText}>{day}</Text>
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
                                    day.isToday && styles.todayCell,
                                    day.isSelected && styles.selectedCell,
                                ]}
                                onPress={() => setSelectedDate(day.date)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.dayContent}>
                                    <Text style={[
                                        styles.dayText,
                                        !day.isCurrentMonth && styles.otherMonthText,
                                        day.isToday && styles.todayDayText,
                                        day.isSelected && styles.selectedDayText,
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
                                    
                                    {/* Indicador de seleção */}
                                    {day.isSelected && (
                                        <View style={styles.selectionRing} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Detalhes do dia selecionado */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailsHeader}>
                            <Text style={styles.detailsTitle}>
                                {formatSelectedDate(selectedDate)}
                            </Text>
                            <TouchableOpacity onPress={navigateToCreateEntry} style={styles.addButton}>
                                <Ionicons name="add-circle" size={28} color="#7C3AED" />
                            </TouchableOpacity>
                        </View>
                        {/* Botão tempoŕario para usar dados mock (retiraar depois)*/}
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
                        {/* Botão tempoŕario para usar dados mock (retiraar depois)*/}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Carregando...</Text>
                            </View>
                        ) : selectedDayEntries.length > 0 ? (
                            <View style={styles.entriesContainer}>
                                <View style={styles.summaryCard}>
                                    <View style={[styles.moodBadge, { backgroundColor: moodColor }]}>
                                        <Text style={styles.moodBadgeText}>
                                            {primaryMood || 'Sem registro'}
                                        </Text>
                                    </View>
                                    <Text style={styles.summaryText}>
                                        {selectedDayEntries.length} registro(s) neste dia
                                    </Text>
                                </View>

                                {selectedDayEntries.map((entry, index) => (
                                    <View key={`${entry.id || index}-${index}`} style={styles.entryCard}>
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
                                            <Text style={styles.entryTime}>
                                                {format(new Date(entry.date), 'HH:mm')}
                                            </Text>
                                        </View>
                                        
                                        {entry.notes && (
                                            <Text style={styles.entryNotes} numberOfLines={3}>
                                                {entry.notes}
                                            </Text>
                                        )}
                                        
                                        {entry.tags && entry.tags.length > 0 && (
                                            <View style={styles.tagsContainer}>
                                                {entry.tags.map((tag, idx) => (
                                                    <View key={`${tag}-${idx}`} style={styles.tag}>
                                                        <Text style={styles.tagText}>#{tag}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="calendar-outline" size={64} color="#D8B4FE" />
                                <Text style={styles.emptyText}>Nenhum registro para este dia</Text>
                                <TouchableOpacity 
                                    onPress={navigateToCreateEntry}
                                    style={styles.emptyButton}
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
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9D5FF',
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
        color: '#6B21A8',
        marginBottom: 4,
    },
    todayButton: {
        backgroundColor: '#7C3AED',
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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#7C3AED',
    },
    statLabel: {
        fontSize: 10,
        color: '#9333EA',
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
        color: '#6B21A8',
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
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: 8,
    },
    selectedCell: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
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
        color: '#6B21A8',
    },
    otherMonthText: {
        color: '#A78BFA',
        opacity: 0.5,
    },
    todayDayText: {
        fontWeight: '700',
        color: '#2563EB',
    },
    selectedDayText: {
        fontWeight: '700',
        color: '#7C3AED',
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
        borderColor: '#7C3AED',
    },
    detailsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        margin: 16,
        marginTop: 24,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E9D5FF',
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
        color: '#6B21A8',
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
        color: '#9333EA',
        fontSize: 16,
    },
    entriesContainer: {
        gap: 12,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3E8FF',
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
        color: '#6B21A8',
        fontSize: 14,
        fontWeight: '500',
    },
    entryCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E9D5FF',
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
        color: '#9333EA',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 8,
    },
    entryNotes: {
        color: '#333',
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
        backgroundColor: '#E9D5FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        color: '#7C3AED',
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#6B21A8',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#7C3AED',
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