import React, { useState, useMemo, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
    MoodEntry, MOCK_RECORDS, StatusHumor, 
    MOCK_STATUSES, RecordFilters 
} from '../src/models/Mood';
import { LinearGradient } from 'expo-linear-gradient';

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

const RecordItem: React.FC<{ record: MoodEntry }> = ({ record }) => {
    const primaryMoodName = record.humores[0];
    const primaryMood = findStatusByName(primaryMoodName);

    return (
        <View style={[styles.card, { borderColor: primaryMood?.cor || '#D8B4FE' }]}>
            <View style={styles.header}>
                <View style={[styles.moodBadge, { backgroundColor: primaryMood?.cor || '#A78BFA' }]}>
                    <Text style={styles.moodIcon}>{primaryMood?.icone || '❓'}</Text>
                    <Text style={styles.moodText}>{primaryMoodName}</Text>
                </View>

                <View style={styles.dateTime}>
                    <Ionicons name="time-outline" size={14} color="#9333EA" />
                    <Text style={styles.dateTimeText}>{record.date}</Text>
                </View>
            </View>

            <Text style={styles.notesText}>{record.notes || "Sem descrição"}</Text>

            <View style={styles.tagsContainer}>
                {[...record.humores.slice(1), ...record.tags].map((name, index) => {
                    const isHumor = index < record.humores.length - 1;
                    const status = isHumor ? findStatusByName(name) : undefined;

                    return (
                        <View
                            key={name + index}
                            style={[
                                styles.tag,
                                { backgroundColor: status?.cor || '#5856D6' }
                            ]}
                        >
                            <Text style={styles.tagText}>{name}</Text>
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

    const [searchText, setSearchText] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const goHome = () => router.push("/");

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
        <LinearGradient colors={["#F3E8FF", "#FCE7F3", "#DBEAFE"]} style={styles.gradientContainer}>
            <SafeAreaView style={styles.safeArea}>

                <Stack.Screen 
                    options={{
                        title: "Meus Registros",
                        headerTintColor: "#7C3AED",
                        headerStyle: { backgroundColor: "transparent" },
                        headerShadowVisible: false,
                    }}
                />

                <View style={styles.container}>

                    <TouchableOpacity style={styles.backButton} onPress={goHome}>
                        <Ionicons name="arrow-back" size={22} color="#7C3AED" />
                        <Text style={styles.backText}>Voltar</Text>
                    </TouchableOpacity>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#7C3AED" />

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por notas, humores ou tags..."
                            placeholderTextColor="#9333EA"
                            value={searchText}
                            onChangeText={setSearchText}
                        />

                        <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
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
                                <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
                            </View>
                        )}
                    />

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
        color: "#7C3AED",
        fontSize: 16,
        fontWeight: "600",
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E9D5FF",
        padding: 10,
        borderRadius: 12,
        marginBottom: 16,
    },

    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: "#6B21A8",
        fontSize: 16,
    },

    filterButton: {
        backgroundColor: "#7C3AED",
        padding: 8,
        borderRadius: 8,
    },

    listContent: { paddingBottom: 40 },

    emptyContainer: { alignItems: "center", marginTop: 50 },
    emptyText: { fontSize: 18, color: "#6B21A8", fontWeight: "600" },

    card: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: "#FFF",
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
    dateTimeText: { fontSize: 12, color: "#9333EA", marginLeft: 4 },

    notesText: {
        color: "#333",
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
        color: "#FFF",
    },
});
