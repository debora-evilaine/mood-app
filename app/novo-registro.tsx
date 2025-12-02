import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../src/context/ThemeContext';
import { databaseService } from '../src/services/database.services';
import { MOCK_STATUSES, getAllAvailableTags, Tag } from '../src/models/Mood';

export default function NovoRegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [date, setDate] = useState(() => {
    const now = new Date();

    if (params.date) {
      try {
        const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
        const parts = dateParam.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);

          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const newDate = new Date(now);
            newDate.setFullYear(year);
            newDate.setMonth(month);
            newDate.setDate(day);
            return newDate;
          }
        }

        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (e) {
        console.error("Erro ao processar data:", e);
      }
    }

    return now;
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const moodsList = MOCK_STATUSES;

  
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const tags = await getAllAvailableTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error("Erro ao carregar tags:", error);
        Alert.alert("Erro", "Não foi possível carregar as tags disponíveis.");
      } finally {
        setIsLoadingTags(false);
      }
    };
    fetchTags();
  }, []);

  const toggleMood = (moodName: string) => {
    setSelectedMoods(prev => {
      if (prev.includes(moodName)) {
        return prev.filter(m => m !== moodName);
      } else {
        return [...prev, moodName];
      }
    });
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleSave = async () => {
    if (selectedMoods.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um humor.");
      return;
    }

    setIsSaving(true);
    try {
      await databaseService.createMoodEntry({
        date: date.toISOString(),
        humores: selectedMoods,
        notes: note,
        tags: selectedTags,
        intensity: 3
      });

      Alert.alert("Sucesso", "Registro salvo com sucesso!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar o registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const displayTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 10, paddingBottom: 10 }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Novo Registro</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Data e Hora */}
          <View style={styles.dateTimeRow}>
            <View style={[styles.dateBadge, { backgroundColor: colors.card }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {displayDate}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.timeBadge, { backgroundColor: colors.icon }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color="#FFF" />
              <Text style={styles.timeText}>{displayTime}</Text>
            </TouchableOpacity>
          </View>

          {/* Humores */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Como você está se sentindo?
          </Text>

          <View style={styles.moodsGrid}>
            {moodsList.map((item) => {
              const isSelected = selectedMoods.includes(item.nome);
              return (
                <TouchableOpacity
                  key={item.idStatusHumor}
                  style={[
                    styles.moodButton,
                    {
                      backgroundColor: isSelected ? item.cor : colors.card,
                      borderColor: isSelected ? item.cor : colors.cardBorder
                    }
                  ]}
                  onPress={() => toggleMood(item.nome)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodIcon}>{item.icone}</Text>
                  <Text style={[
                    styles.moodLabel,
                    { color: isSelected ? '#FFF' : colors.textSecondary }
                  ]}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notas */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Notas (opcional)
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.cardBorder
              }
            ]}
            placeholder="Escreva sobre o seu momento..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />

          {/* Tags */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Tags (opcional)
          </Text>

          <TouchableOpacity
            style={[
              styles.tagSelector,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder
              }
            ]}
            onPress={() => setShowTagModal(true)}
          >
            <Text style={[
              styles.tagSelectorText,
              { color: selectedTags.length > 0 ? colors.text : colors.textSecondary }
            ]}>
              {selectedTags.length > 0 
                ? `${selectedTags.length} tag(s) selecionada(s)` 
                : 'Selecionar tags'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {selectedTags.length > 0 && (
            <View style={styles.tagsDisplayArea}>
              {selectedTags.map((tagName, index) => {
                const tag = availableTags.find(t => t.nome === tagName);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.tagPill, { backgroundColor: tag?.cor || colors.icon }]}
                    onPress={() => handleTagRemove(tagName)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tagText}>{tagName}</Text>
                    <Ionicons name="close" size={16} color="#FFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Botão Salvar */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: colors.icon, 
                opacity: isSaving ? 0.7 : 1 
              }
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Registro</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de Seleção de Tags */}
        <Modal
          visible={showTagModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTagModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Selecionar Tags
                </Text>
                <TouchableOpacity onPress={() => setShowTagModal(false)}>
                  <Ionicons name="close" size={28} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                {isLoadingTags ? (
                  <ActivityIndicator size="large" color={colors.icon} style={{ marginTop: 20 }} />
                ) : availableTags.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Nenhuma tag disponível
                  </Text>
                ) : (
                  <View style={styles.tagsGrid}>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.nome);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagOption,
                            {
                              backgroundColor: isSelected ? tag.cor : 'transparent',
                              borderColor: isSelected ? tag.cor : colors.cardBorder,
                              borderWidth: 1
                            }
                          ]}
                          onPress={() => toggleTag(tag.nome)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.tagOptionText,
                            { color: isSelected ? '#FFF' : colors.text }
                          ]}>
                            {tag.nome}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.icon }]}
                onPress={() => setShowTagModal(false)}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  dateBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  moodButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moodIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    minHeight: 120,
    fontSize: 16,
  },
  
  tagSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  tagSelectorText: {
    fontSize: 16,
  },
  tagsDisplayArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});