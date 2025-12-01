import React, { useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
} from "react-native";
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

type DatePickerField = "startDate" | "endDate" | null;

interface SelectionChipProps {
    name: string;
    color: string;
    isSelected: boolean;
    onToggle: (name: string) => void;
}

const SelectionChip: React.FC<SelectionChipProps> = React.memo(
    ({ name, color, isSelected, onToggle }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.chip,
                    { backgroundColor: isSelected ? color : "#E0E0E0" },
                    isSelected && styles.chipSelected,
                ]}
                onPress={() => onToggle(name)}
            >
                <Text
                    style={[
                        styles.chipText,
                        { color: isSelected ? "#FFFFFF" : "#333333" },
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

    const initialFilters: RecordFilters = useMemo(() => {
        const typed = params as Record<string, string | string[]>;

        const toArray = (v: any) =>
            v ? (Array.isArray(v) ? v : [v]) : [];

        const safeDate = (v: any): Date | undefined =>
            typeof v === "string" ? new Date(v) : undefined;

        return {
            humoresNames: toArray(typed.humoresNames),
            tagNames: toArray(typed.tagNames),
            startDate: safeDate(typed.startDate),
            endDate: safeDate(typed.endDate),
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
    const [datePickerField, setDatePickerField] = useState<DatePickerField>(
        null
    );

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
            humoresNames:
                selectedHumores.length > 0 ? selectedHumores : undefined,
            tagNames: selectedTags.length > 0 ? selectedTags : undefined,

            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
        };

        router.replace({
            pathname: "/lista-registro",
            params: filtersToSend,
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
            colors={["#F3E8FF", "#FCE7F3", "#DBEAFE"]}
            style={styles.gradientContainer}
        >
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        title: "Filtros Avançados",
                        headerStyle: { backgroundColor: "transparent" },
                        headerTintColor: "#7C3AED",
                        headerShadowVisible: false,
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            1. Filtrar por Humores
                        </Text>
                        <View style={styles.chipContainer}>
                            {MOCK_STATUSES.map((status) => (
                                <SelectionChip
                                    key={status.nome}
                                    name={status.nome}
                                    color={status.cor}
                                    isSelected={selectedHumores.includes(
                                        status.nome
                                    )}
                                    onToggle={toggleHumor}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            2. Filtrar por Tags
                        </Text>

                        {isLoadingTags ? (
                            <Text style={styles.loadingText}>
                                Carregando tags...
                            </Text>
                        ) : (
                            <View style={styles.chipContainer}>
                                {availableTags.map((tag) => (
                                    <SelectionChip
                                        key={tag.id}
                                        name={tag.nome}
                                        color={tag.cor}
                                        isSelected={selectedTags.includes(
                                            tag.nome
                                        )}
                                        onToggle={toggleTag}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            3. Filtrar por Período
                        </Text>

                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>De:</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => showDatepicker("startDate")}
                            >
                                <Text style={styles.dateText}>
                                    {startDate
                                        ? startDate.toLocaleDateString("pt-BR")
                                        : "Selecione a data"}
                                </Text>
                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color="#7C3AED"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Até:</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => showDatepicker("endDate")}
                            >
                                <Text style={styles.dateText}>
                                    {endDate
                                        ? endDate.toLocaleDateString("pt-BR")
                                        : "Selecione a data"}
                                </Text>
                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color="#7C3AED"
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

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.clearButton]}
                        onPress={handleClearFilters}
                    >
                        <Text style={[styles.buttonText, { color: "#7C3AED" }]}>
                            Limpar Filtros
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.applyButton]}
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
        backgroundColor: "rgba(255,255,255,0.75)",
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: "#E9D5FF",
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6B21A8",
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
        borderWidth: 1,
        borderColor: "transparent",
    },

    chipSelected: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
        borderColor: "#7C3AED",
    },

    chipText: {
        fontSize: 14,
        fontWeight: "600",
    },

    loadingText: {
        color: "#9333EA",
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
        color: "#333",
    },

    dateInput: {
        flex: 1,
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F3F3F5",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#D8B4FE",
    },

    dateText: {
        color: "#6B21A8",
        fontSize: 16,
    },

    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#E9D5FF",
        backgroundColor: "rgba(255,255,255,0.9)",
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

    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFF",
    },

    applyButton: {
        backgroundColor: "#7C3AED",
    },

    clearButton: {
        backgroundColor: "#FFF",
        borderWidth: 2,
        borderColor: "#7C3AED",
    },
});
