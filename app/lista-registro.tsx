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


// 1. Definição das Props para Edição/Exclusão 
interface RecordItemProps {
  record: MoodEntry;
  onPress: (id: number) => void;
  onDelete: (id: number) => void;
}

// 2. Modificação do Componente RecordItem para ser interativo e ter botão de exclusão
// FIX: Removida a anotação React.FC<RecordItemProps> para resolver o erro de inferência de 'void'.
const RecordItem = ({ record, onPress, onDelete }: RecordItemProps) => {
  const { colors } = useTheme();
  const primaryMoodName = record.humores[0];
  const primaryMood = findStatusByName(primaryMoodName);

  // Lógica de Confirmação de Exclusão
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
    // Usa TouchableOpacity para ser clicável (Ação de Edição)
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

        {/* Botão de Exclusão (Novo) */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteConfirm}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );
}; // Fim da modificação do RecordItem


// 3. Modificações em ListaRegistroScreen (Implementação das funções)
export default function ListaRegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [searchText, setSearchText] = useState('');
  const [records, setRecords] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar registros do banco (loadRecords permanece inalterada)
  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await databaseService.getAllMoodEntries();

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
  
  // NOVA FUNÇÃO: Manipular Edição
  const handleEditRecord = (id: number) => {
    // FIX: Alterado para usar o formato de objeto { pathname, params } para resolver o erro de tipagem do expo-router.
    // O id é convertido para string pois parâmetros de rota são tipados como string.
    router.push({ 
        pathname: "/registro/[id]", 
        params: { id: id.toString() } 
    } as any);
  };

  // NOVA FUNÇÃO: Manipular Exclusão
  const handleDeleteRecord = async (id: number) => {
    try {
      // Chama o método implementado no database.services
      const success = await databaseService.deleteMoodEntry(id); 
      if (success) {
        // Se a exclusão for bem-sucedida, recarrega a lista para atualizar a UI
        loadRecords(); 
      } else {
        console.warn(`Falha ao excluir o registro ${id}.`);
      }
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      // Opcional: mostrar Alert de erro para o usuário
      Alert.alert("Erro de Exclusão", "Não foi possível excluir o registro. Tente novamente.");
    }
  }; // Fim da modificação das funções de manipulação

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
              // 4. Repassando as funções para o RecordItem
              renderItem={({ item }) => (
                <RecordItem 
                  record={item} 
                  onPress={handleEditRecord} // Ação de toque para Edição
                  onDelete={handleDeleteRecord} // Ação de botão para Exclusão
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


// 5. Adicionar o estilo deleteButton (Fim da modificação)
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
    // Remover marginBottom daqui, pois foi movido para o TouchableOpacity
    borderRadius: 12,
    borderWidth: 2,
  },
  
  // NOVO ESTILO: Posicionamento do botão de exclusão
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 10, // FIX aplicado: Garante que o botão seja renderizado acima de outros elementos.
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingRight: 30, // Adiciona padding para o ícone de exclusão não sobrepor o cabeçalho
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