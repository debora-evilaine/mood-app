import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext"; // Hook do tema
import { databaseService } from "../services/database.services"; // Banco de dados
import { MOCK_STATUSES } from "../models/Mood"; // Lista de humores com ícones/cores

interface RegistroHumorProps {
  initialDate?: Date;
}

export default function RegistroHumor({ initialDate = new Date() }: RegistroHumorProps) {
  const router = useRouter();
  const { colors } = useTheme(); // Cores dinâmicas

  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Formatar data para exibição
  const displayDate = initialDate.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const toggleMood = (moodName: string) => {
    setSelectedMoods(prev => {
      if (prev.includes(moodName)) {
        return prev.filter(m => m !== moodName);
      } else {
        return [...prev, moodName];
      }
    });
  };

  const handleSave = async () => {
    if (selectedMoods.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um humor.");
      return;
    }

    setIsSaving(true);
    try {
      await databaseService.createMoodEntry({
        date: initialDate.toISOString(),
        humores: selectedMoods,
        notes: description,
        tags: [], // Tags podem ser implementadas futuramente
        intensity: 3
      });

      Alert.alert("Sucesso", "Humor registrado com sucesso!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar o registro.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Interno do Componente */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Novo Registro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Data */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {displayDate}
          </Text>
        </View>

        {/* Grid de Humores */}
        <Text style={[styles.label, { color: colors.text }]}>Como você está se sentindo?</Text>
        <View style={styles.moodsGrid}>
          {MOCK_STATUSES.map((item) => {
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
              >
                <Text style={styles.moodIcon}>{item.icone}</Text>
                <Text style={[
                  styles.moodText,
                  { color: isSelected ? '#FFF' : colors.textSecondary }
                ]}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Input de Descrição */}
        <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Descreva seu momento:</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              color: colors.text
            }
          ]}
          placeholder="Digite aqui..."
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.icon, opacity: isSaving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Salvar Registro</Text>
          )}
        </TouchableOpacity>

        {/* Espaço extra no final para scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  moodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  moodButton: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
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
  moodText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: 'center',
  },
  label: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
