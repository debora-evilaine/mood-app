
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  MOCK_STATUSES,
  getAllAvailableTags,
  RecordFilters,
  Tag,
} from "../src/models/Mood";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/context/ThemeContext";

type DatePickerField = "startDate" | "endDate" | null;

const parseListParam = (param: string | string[] | undefined): string[] => {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return param.split(',').map(s => s.trim()).filter(Boolean);
};

interface SelectionChipProps {
  name: string;
  color: string;
  isSelected: boolean;
  onToggle: (name: string) => void;
  textColor: string;
}

const SelectionChip: React.FC<SelectionChipProps> = React.memo(
  ({ name, color, isSelected, onToggle, textColor }) => {
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? color : 'transparent',
            borderColor: isSelected ? color : textColor + '40',
            borderWidth: 1
          },
        ]}
        onPress={() => onToggle(name)}
      >
        <Text
          style={[
            styles.chipText,
            { color: isSelected ? "#FFFFFF" : textColor },
          ]}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  }
);

export default function FiltrosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, theme } = useTheme();

  const initialFilters: RecordFilters = useMemo(() => {
    const safeDate = (v: any): Date | undefined =>
      (v && typeof v === "string") ? new Date(v) : undefined;

    return {
      humoresNames: parseListParam(params.humoresNames),
      tagNames: parseListParam(params.tagNames),
      startDate: safeDate(params.startDate),
      endDate: safeDate(params.endDate),
    };
  }, [params]);

  const [selectedHumores, setSelectedHumores] = useState<string[]>(
    initialFilters.humoresNames || []
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters.tagNames || []
  );

  const [startDate, setStartDate] = useState<Date | undefined>(
    initialFilters.startDate
  );

  const [endDate, setEndDate] = useState<Date | undefined>(
    initialFilters.endDate
  );

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<DatePickerField>(null);

  React.useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getAllAvailableTags();
        setAvailableTags(tags);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar as tags.");
      } finally {
        setIsLoadingTags(false);
      }
    };
    fetchTags();
  }, []);

  const toggleSelection = useCallback(
    (
      list: string[],
      setList: React.Dispatch<React.SetStateAction<string[]>>,
      name: string
    ) => {
      setList((prev) =>
        prev.includes(name)
          ? prev.filter((n) => n !== name)
          : [...prev, name]
      );
    },
    []
  );

  const toggleHumor = (name: string) =>
    toggleSelection(selectedHumores, setSelectedHumores, name);

  const toggleTag = (name: string) =>
    toggleSelection(selectedTags, setSelectedTags, name);

  const showDatepicker = (field: DatePickerField) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      if (datePickerField === "startDate") setStartDate(selectedDate);
      if (datePickerField === "endDate") setEndDate(selectedDate);
    }
    setDatePickerField(null);
  };

  const handleApplyFilters = useCallback(() => {
    const filtersToSend = {
      humoresNames: selectedHumores.join(','),
      tagNames: selectedTags.join(','),
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    };

    router.replace({
      pathname: "/lista-registro",
      params: filtersToSend as any,
    });
  }, [router, selectedHumores, selectedTags, startDate, endDate]);

  const handleClearFilters = () => {
    setSelectedHumores([]);
    setSelectedTags([]);
    setStartDate(undefined);
    setEndDate(undefined);
    router.replace("/lista-registro");
  };

  return (
    <LinearGradient
      colors={colors.background as any}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={[styles.safeArea, { paddingTop: 10, paddingBottom: 10 }]}>
        <Stack.Screen
          options={{
            title: "Filtros Avançados",
            headerStyle: { backgroundColor: "transparent" },
            headerTintColor: colors.icon,
            headerShadowVisible: false,
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Seção 1: Humores */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              1. Filtrar por Humores
            </Text>
            <View style={styles.chipContainer}>
              {MOCK_STATUSES.map((status) => (
                <SelectionChip
                  key={status.nome}
                  name={status.nome}
                  color={status.cor}
                  isSelected={selectedHumores.includes(status.nome)}
                  onToggle={toggleHumor}
                  textColor={colors.text}
                />
              ))}
            </View>
          </View>

          {/* Seção 2: Tags */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              2. Filtrar por Tags
            </Text>

            {isLoadingTags ? (
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Carregando tags...
              </Text>
            ) : (
              <View style={styles.chipContainer}>
                {availableTags.map((tag) => (
                  <SelectionChip
                    key={tag.id}
                    name={tag.nome}
                    color={tag.cor}
                    isSelected={selectedTags.includes(tag.nome)}
                    onToggle={toggleTag}
                    textColor={colors.text}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Seção 3: Período */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              3. Filtrar por Período
            </Text>

            <View style={styles.dateRow}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>De:</Text>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}
                onPress={() => showDatepicker("startDate")}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {startDate
                    ? startDate.toLocaleDateString("pt-BR")
                    : "Selecione a data"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>Até:</Text>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}
                onPress={() => showDatepicker("endDate")}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {endDate
                    ? endDate.toLocaleDateString("pt-BR")
                    : "Selecione a data"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={
              (datePickerField === "startDate" && startDate) ||
              (datePickerField === "endDate" && endDate) ||
              new Date()
            }
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton, { borderColor: colors.icon, backgroundColor: 'transparent' }]}
            onPress={handleClearFilters}
          >
            <Text style={[styles.buttonText, { color: colors.icon }]}>
              Limpar Filtros
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.icon }]}
            onPress={handleApplyFilters}
          >
            <Text style={styles.buttonText}>Aplicar</Text>
            <Ionicons
              name="filter"
              size={20}
              color="#FFF"
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  section: {
    marginBottom: 25,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  loadingText: {
    fontSize: 14,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  dateLabel: {
    width: 50,
    fontSize: 16,
    fontWeight: "500",
  },

  dateInput: {
    flex: 1,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },

  dateText: {
    fontSize: 16,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },

  clearButton: {
    borderWidth: 2,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
