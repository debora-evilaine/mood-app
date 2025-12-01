import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; // Adicionado useFocusEffect
import { Ionicons } from '@expo/vector-icons';
import {
  MoodEntry, StatusHumor,
  MOCK_STATUSES, RecordFilters
} from '../src/models/Mood';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext';
import { databaseService } from '../src/services/database.services'; // Importar o serviço

const normalize = (s: string) =>
  s
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() ?? "";

const safeDate = (value: any): Date | undefined => {
  if (!value || typeof value !== "string") return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

const findStatusByName = (name: string): StatusHumor | undefined => {
  return MOCK_STATUSES.find(s => s.nome === name);
};

// Componente do Item da Lista
const RecordItem: React.FC<{ record: MoodEntry }> = ({ record }) => {
  const { colors } = useTheme();
  const primaryMoodName = record.humores[0];
  const primaryMood = findStatusByName(primaryMoodName);

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.cardBorder
      }
    ]}>
      <View style={styles.header}>
        <View style={[styles.moodBadge, { backgroundColor: primaryMood?.cor || colors.icon }]}>
          <Text style={styles.moodIcon}>{primaryMood?.icone || '❓'}</Text>
          <Text style={styles.moodText}>{primaryMoodName}</Text>
        </View>

        <View style={styles.dateTime}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
            {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <Text style={[styles.notesText, { color: colors.text }]}>
        {record.notes || "Sem descrição"}
      </Text>

      <View style={styles.tagsContainer}>
        {[...record.humores.slice(1), ...record.tags].map((name, index) => {
          const isHumor = index < record.humores.length - 1;
          const status = isHumor ? findStatusByName(name) : undefined;

          return (
            <View
              key={name + index}
              style={[
                styles.tag,
                { backgroundColor: status?.cor || colors.tint }
              ]}
            >
              <Text style={[
                styles.tagText,
                { color: status?.cor ? '#FFF' : colors.textSecondary }
              ]}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default function ListaRegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [searchText, setSearchText] = useState('');
  const [records, setRecords] = useState<MoodEntry[]>([]); // Inicializa vazio
  const [isLoading, setIsLoading] = useState(true);

  // Carregar registros do banco
  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await databaseService.getAllMoodEntries();

      // Mapear para garantir que o formato bata com a interface MoodEntry
      const formattedEntries: MoodEntry[] = entries.map((e: any) => ({
        id: e.id,
        date: e.date,
        notes: e.notes || e.texto || null,
        humores: e.humores || [],
        tags: e.tags || []
      }));

      setRecords(formattedEntries);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recarregar sempre que a tela ganhar foco (útil ao voltar de um novo registro)
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const currentFilters: RecordFilters = useMemo(() => {
    return {
      humoresNames: params.humoresNames
        ? Array.isArray(params.humoresNames)
          ? params.humoresNames
          : [params.humoresNames]
        : undefined,

      tagNames: params.tagNames
        ? Array.isArray(params.tagNames)
          ? params.tagNames
          : [params.tagNames]
        : undefined,

      startDate: safeDate(params.startDate),
      endDate: safeDate(params.endDate),
    };
  }, [params]);

  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (currentFilters.humoresNames?.length) {
      list = list.filter(r =>
        r.humores.some(h =>
          currentFilters.humoresNames!.some(f =>
            normalize(h) === normalize(f)
          )
        )
      );
    }

    if (currentFilters.tagNames?.length) {
      list = list.filter(r =>
        currentFilters.tagNames!.every(tagFilter =>
          r.tags.some(tagRecord =>
            normalize(tagRecord) === normalize(tagFilter)
          )
        )
      );
    }

    list = list.filter(record => {
      const time = new Date(record.date).getTime();
      if (currentFilters.startDate && time < currentFilters.startDate.getTime()) return false;
      if (currentFilters.endDate) {
        const endLimit = currentFilters.endDate.getTime() + 86400000 - 1;
        if (time > endLimit) return false;
      }
      return true;
    });

    if (searchText.trim()) {
      const q = normalize(searchText);
      list = list.filter(record =>
        normalize(record.notes ?? "").includes(q) ||
        record.humores.some(h => normalize(h).includes(q)) ||
        record.tags.some(t => normalize(t).includes(q))
      );
    }

    return list;

  }, [records, searchText, currentFilters]);

  const goHome = () => router.back();

  const openFilterModal = () => {
    const filtersForNavigation = {
      humoresNames: currentFilters.humoresNames,
      tagNames: currentFilters.tagNames,
      startDate: currentFilters.startDate?.toISOString(),
      endDate: currentFilters.endDate?.toISOString(),
    };
    router.push({ pathname: "/filtros", params: filtersForNavigation as any });
  };

  return (
    <LinearGradient colors={colors.background as any} style={styles.gradientContainer}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 10, paddingBottom: 10 }]}>

        <Stack.Screen
          options={{
            title: "Meus Registros",
            headerTintColor: colors.icon,
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }}
        />

        <View style={styles.container}>

          <TouchableOpacity style={styles.backButton} onPress={goHome}>
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
            <Text style={[styles.backText, { color: colors.icon }]}>Voltar</Text>
          </TouchableOpacity>

          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />

            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por notas, humores ou tags..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.icon }]}
              onPress={openFilterModal}
            >
              <Ionicons name="options-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.icon} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando registros...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <RecordItem record={item} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Nenhum registro encontrado.
                  </Text>
                </View>
              )}
            />
          )}

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },

  filterButton: {
    padding: 8,
    borderRadius: 8,
  },

  listContent: { paddingBottom: 40 },

  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: "600" },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16
  },

  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  moodIcon: { fontSize: 18, marginRight: 6 },
  moodText: { color: "#FFF", fontWeight: "600" },

  dateTime: { flexDirection: "row", alignItems: "center" },
  dateTimeText: { fontSize: 12, marginLeft: 4 },

  notesText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 10,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
