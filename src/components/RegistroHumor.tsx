import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";

const moods = [
  "Calmo", "Feliz", "Triste", "Bravo", "Desapontado",
  "Preocupado", "Assustado", "Frustrado", "Estressado",
];

export default function RegistroHumor() {
  const [mood, setMood] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!mood) {
      alert("Selecione um humor.");
      return;
    }

    const registro = {
      humor: mood,
      descricao: description,
      criadoEm: new Date(),
    };

    console.log("Registro salvo:", registro);

    alert("Humor registrado com sucesso!");

    setMood(null);
    setDescription("");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Como você está se sentindo?</Text>

      <View style={styles.moodsGrid}>
        {moods.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.moodButton, mood === item && styles.selectedMood]}
            onPress={() => setMood(item)}
          >
            <Text style={[styles.moodText, mood === item && styles.selectedMoodText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descreva seu momento:</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite aqui..."
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Salvar Registro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F4F0FF",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6A3EA1",
    textAlign: "center",
    marginBottom: 20,
  },
  moodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  moodButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#C9B8FF",
  },
  selectedMood: {
    backgroundColor: "#A678FF",
    borderColor: "#7B48D9",
  },
  moodText: {
    color: "#6A3EA1",
    fontSize: 16,
  },
  selectedMoodText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  label: {
    marginTop: 25,
    marginBottom: 10,
    color: "#4C2E96",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#FFF",
    height: 130,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: "#9062FF",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  saveText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});