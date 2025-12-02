import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MoodEntry, StatusHumor,
  MOCK_STATUSES, RecordFilters
} from '../src/models/Mood';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext';
import { databaseService } from '../src/services/database.services';

const parseListParam = (param: string | string[] | undefined): string[] => {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return param.split(',').map(s => s.trim()).filter(Boolean);
};

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

interface RecordItemProps {
  record: MoodEntry;
  onPress: (id: number) => void;
  onDelete: (id: number) => void;
}

const RecordItem = ({ record, onPress, onDelete }: RecordItemProps) => {
  const { colors } = useTheme();
  const primaryMoodName = record.humores[0];
  const primaryMood = findStatusByName(primaryMoodName);

  // CORREÇÃO: Separa e remove duplicatas
  const secondaryHumores = [...new Set(record.humores.slice(1))];
  const tags = [...new Set(record.tags || [])];

  const handleDeleteConfirm = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza de que deseja excluir este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDelete(record.id) },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(record.id)} style={{ marginBottom: 12 }}>
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
              {new Date(record.date).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        <Text style={[styles.notesText, { color: colors.text }]}>
          {record.notes || "Sem descrição"}
        </Text>

        {/* CORREÇÃO: Renderização separada com keys únicas */}
        <View style={styles.tagsContainer}>
          {/* Humores secundários */}
          {secondaryHumores.map((name, index) => {
            const status = findStatusByName(name);
            return (
              <View
                key={`humor-${record.id}-${index}`}
                style={[
                  styles.tag,
                  { backgroundColor: status?.cor || colors.tint }
                ]}
              >
                <Text style={[
                  styles.tagText,
                  { color: '#FFF' }
                ]}>
                  {name}
                </Text>
              </View>
            );
          })}
          
          {/* Tags */}
          {tags.map((name, index) => (
            <View
              key={`tag-${record.id}-${index}`}
              style={[
                styles.tag,
                { backgroundColor: colors.tint }
              ]}
            >
              <Text style={[
                styles.tagText,
                { color: colors.textSecondary }
              ]}>
                {name}
              </Text>
            </View>
          ))}
        </View>

        {/* Botão de Exclusão */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteConfirm}>
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );
};

export default function ListaRegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [searchText, setSearchText] = useState('');
  const [records, setRecords] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CORREÇÃO: Remove duplicatas ao carregar
  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await databaseService.getAllMoodEntries();

      const formattedEntries: MoodEntry[] = entries.map((e: any) => ({
        id: e.id,
        date: e.date,
        notes: e.notes || e.texto || null,
        humores: [...new Set((e.humores || []) as string[])] as string[],
        tags: [...new Set((e.tags || []) as string[])] as string[]
      }));

      setRecords(formattedEntries);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const currentFilters: RecordFilters = useMemo(() => {
    return {
      humoresNames: parseListParam(params.humoresNames),
      tagNames: parseListParam(params.tagNames),
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

  const goHome = () => router.dismissAll();

  const openFilterModal = () => {
    const filtersForNavigation = {
      humoresNames: currentFilters.humoresNames,
      tagNames: currentFilters.tagNames,
      startDate: currentFilters.startDate?.toISOString(),
      endDate: currentFilters.endDate?.toISOString(),
    };
    router.push({ pathname: "/filtros", params: filtersForNavigation as any });
  };
  
  const handleEditRecord = (id: number) => {
    router.push({ 
      pathname: "/registro/[id]", 
      params: { id: id.toString() } 
    } as any);
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const success = await databaseService.deleteMoodEntry(id); 
      if (success) {
        loadRecords(); 
      } else {
        console.warn(`Falha ao excluir o registro ${id}.`);
      }
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      Alert.alert("Erro de Exclusão", "Não foi possível excluir o registro. Tente novamente.");
    }
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

          <View style={[styles.searchContainer, { 
            backgroundColor: colors.card, 
            borderColor: colors.cardBorder, 
            borderWidth: 1 
          }]}>
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
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Carregando registros...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={item => `record-${item.id}`}
              renderItem={({ item }) => (
                <RecordItem 
                  record={item} 
                  onPress={handleEditRecord}
                  onDelete={handleDeleteRecord}
                />
              )}
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
    borderRadius: 12,
    borderWidth: 2,
  },
  
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingRight: 30,
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