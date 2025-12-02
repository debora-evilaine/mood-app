import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Path, Line, G, Rect, Circle, Text as SvgText } from "react-native-svg"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useFocusEffect } from "expo-router"
import { useTheme } from '../context/ThemeContext';
import { databaseService } from '../services/database.services';
import { MOCK_STATUSES, MoodEntry } from '../models/Mood';
import { format, subDays, isSameDay, startOfWeek, addDays, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width } = Dimensions.get('window');

// --- Icons ---
function HeartIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  )
}

function PlusIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

function CalendarIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  )
}

function ListIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="8" y1="6" x2="21" y2="6" />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Line x1="3" y1="6" x2="3.01" y2="6" />
      <Line x1="3" y1="12" x2="3.01" y2="12" />
      <Line x1="3" y1="18" x2="3.01" y2="18" />
    </Svg>
  )
}

function MoreIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 12h.01M12 6h.01M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// --- Helpers for Color Mixing ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const mixMoodColors = (moods: string[]) => {
  if (!moods || moods.length === 0) return '#E5E7EB'; // Gray default

  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;

  moods.forEach(mood => {
    const status = MOCK_STATUSES.find(s => s.nome === mood);
    if (status) {
      const rgb = hexToRgb(status.cor);
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
      count++;
    }
  });

  if (count === 0) return '#E5E7EB';

  return rgbToHex(
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count)
  );
}

// --- Chart Components ---

const PieChart = ({ data, colors }: { data: { label: string, count: number, color: string }[], colors: any }) => {
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const radius = 50;
  const center = 60;
  let startAngle = 0;

  if (total === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={{ color: colors.textSecondary }}>Sem dados para exibir</Text>
      </View>
    );
  }

  return (
    <View style={styles.pieContainer}>
      <Svg width={120} height={120}>
        <G x={center} y={center}>
          {data.map((item, index) => {
            const angle = (item.count / total) * 360;
            const endAngle = startAngle + angle;

            const x1 = radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            const slice = (
              <Path
                key={index}
                d={pathData}
                fill={item.color}
              />
            );
            startAngle = endAngle;
            return slice;
          })}
          <Circle cx={0} cy={0} r={radius * 0.6} fill={colors.card} />
        </G>
      </Svg>
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {item.label} ({Math.round((item.count / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const HeatMap = ({ entries, colors }: { entries: MoodEntry[], colors: any }) => {
  const squareSize = 12;
  const gap = 3;
  const numColumns = 16;
  const daysPerColumn = 7;
  const totalDays = numColumns * daysPerColumn;

  const today = new Date();
  const startDate = subDays(today, totalDays - 1);

  const weeks = [];

  for (let w = 0; w < numColumns; w++) {
    const days = [];
    for (let d = 0; d < daysPerColumn; d++) {
      const date = addDays(startDate, (w * daysPerColumn) + d);

      const dayEntries = entries.filter(e => {
        try { return isSameDay(new Date(e.date), date); } catch { return false; }
      });

      const count = dayEntries.length;
      let color = colors.tint;
      let opacity = 0.3;

      if (count > 0) {
        const allMoods = dayEntries.flatMap(e => e.humores);
        color = mixMoodColors(allMoods);
        opacity = Math.min(0.4 + (count * 0.15), 1);
      }

      days.push({ date, count, color, opacity });
    }
    weeks.push(days);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.heatmapContainer}>
        {weeks.map((week, wIndex) => (
          <View key={wIndex} style={styles.heatmapColumn}>
            {week.map((day, dIndex) => (
              <View
                key={dIndex}
                style={[
                  styles.heatmapSquare,
                  {
                    backgroundColor: day.count > 0 ? day.color : colors.tint,
                    opacity: day.count > 0 ? day.opacity : 0.5,
                    width: squareSize,
                    height: squareSize,
                    marginBottom: gap
                  }
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme(); // 2. Pegue as cores do tema atual

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          const data = await databaseService.getAllMoodEntries();
          setEntries(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  // Process Data for Pie Chart
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.humores && e.humores.length > 0) {
        const mood = e.humores[0]; // Primary mood
        counts[mood] = (counts[mood] || 0) + 1;
      }
    });

    return Object.keys(counts).map(key => {
      const status = MOCK_STATUSES.find(s => s.nome === key);
      return {
        label: key,
        count: counts[key],
        color: status?.cor || colors.icon
      };
    }).sort((a, b) => b.count - a.count); // Sort by count
  }, [entries, colors]);

  return (
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 10, paddingBottom: 10 }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <HeartIcon size={24} color={colors.icon} />
              <Text style={[styles.title, { color: colors.text }]}>MoodFlow</Text>
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{today}</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greeting}>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              Como você está se sentindo?
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
              Acompanhe seu bem-estar emocional.
            </Text>
          </View>

          {/* Dashboard Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.icon} />
            </View>
          ) : (
            <View style={styles.dashboardGrid}>

              {/* Card 1: Total Records */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TOTAL DE REGISTROS</Text>
                <Text style={[styles.bigNumber, { color: colors.text }]}>{entries.length}</Text>
              </View>

              {/* Card 2: Mood Proportions */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: colors.textSecondary, marginBottom: 16 }]}>PROPORÇÃO DE HUMOR</Text>
                <PieChart data={pieData} colors={colors} />
              </View>

              {/* Card 3: Heatmap */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.heatmapHeader}>
                  <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>FREQUÊNCIA DIÁRIA</Text>
                  <Text style={[styles.heatmapSubtitle, { color: colors.textSecondary }]}>Últimos meses</Text>
                </View>
                <HeatMap entries={entries} colors={colors} />
              </View>

            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Bottom navigation */}
        <View style={styles.bottomNav}>
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push("/novo-registro")}
            >
              <LinearGradient colors={["#C084FC", "#F472B6"]} style={styles.fabGradient}>
                <PlusIcon size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.navBar, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/calendario")}>
              <CalendarIcon size={20} color={colors.icon} />
              <Text style={[styles.navButtonText, { color: colors.icon }]}>Calendário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/lista-registro")}
            >
              <ListIcon size={20} color={colors.success || colors.icon} />
              <Text style={[styles.navButtonText, { color: colors.success || colors.icon }]}>Registros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/configuracoes")}
            >
              <MoreIcon size={20} color={colors.textSecondary} />
              <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Mais</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
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
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: "capitalize",
  },
  greeting: {
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  dashboardGrid: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: "800",
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyChart: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heatmapSubtitle: {
    fontSize: 12,
  },
  heatmapContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapColumn: {
    flexDirection: 'column',
  },
  heatmapSquare: {
    borderRadius: 2,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 16,
  },
  fabContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    flexDirection: "row",
    borderRadius: 28,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 2,
  },
  navButtonText: {
    fontSize: 11,
    fontWeight: "500",
  },
})
