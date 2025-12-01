import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importação corrigida
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MoodEntry, MOCK_RECORDS, StatusHumor,
  MOCK_STATUSES, RecordFilters
} from '../src/models/Mood';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext'; // 1. Importar o hook

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

// Componente do Item da Lista (agora consome o tema)
const RecordItem: React.FC<{ record: MoodEntry }> = ({ record }) => {
  const { colors } = useTheme(); // 2. Usar o tema no item
  const primaryMoodName = record.humores[0];
  const primaryMood = findStatusByName(primaryMoodName);

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,       // Fundo dinâmico
        borderColor: colors.cardBorder      // Borda dinâmica
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
            {record.date}
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
                // Tags usam a cor do humor ou uma cor de fundo genérica (tint) do tema
                { backgroundColor: status?.cor || colors.tint }
              ]}
            >
              <Text style={[
                styles.tagText,
                // Se for tag genérica, usa texto secundário, se for humor, texto branco (geralmente)
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
  const { colors } = useTheme(); // 3. Usar o tema na tela principal

  const [searchText, setSearchText] = useState('');
  const [records] = useState<MoodEntry[]>(MOCK_RECORDS);

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

  const goBack = () => router.back();

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
    // 4. Gradiente dinâmico
    <LinearGradient colors={colors.background as any} style={styles.gradientContainer}>

      {/* 5. SafeArea com padding para não cortar botões */}
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

          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
            <Text style={[styles.backText, { color: colors.icon }]}>Voltar</Text>
          </TouchableOpacity>

          {/* Barra de Pesquisa com cores do tema */}
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

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Estilos estruturais (cores movidas para inline styles)
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
