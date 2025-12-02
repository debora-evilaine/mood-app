import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Path } from "react-native-svg"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useTheme } from '../context/ThemeContext'; // 1. Importe o hook

// Ícones agora aceitam a cor via props, sem valor default fixo (opcional)
function HeartIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  )
}

function PlusIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M5 12h14M12 5v14" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CalendarIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ListIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function MoreIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 12h.01M12 6h.01M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme(); // 2. Pegue as cores do tema atual

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    // 3. Aplique o gradiente dinâmico
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              {/* Ícone e Texto com cor dinâmica */}
              <HeartIcon size={24} color={colors.icon} />
              <Text style={[styles.title, { color: colors.text }]}>MoodFlow</Text>
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{today}</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greeting}>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              Como você está se sentindo?
            </Text>
          </View>

          {/* Dashboard placeholder */}
          {/* Dashboard placeholder */}
          <View style={styles.dashboardContainer}>
            {/* Cartão com fundo e borda dinâmicos */}
            <View style={[
              styles.dashboard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder
              }
            ]}>
              <Text style={styles.dashboardIcon}>🌈</Text>
              <Text style={[styles.dashboardText, { color: colors.textSecondary }]}>
                Bem-vindo ao MoodFlow!
                Aqui você pode registrar seus sentimentos, refletir sobre suas emoções
                e acompanhar sua jornada de bem-estar ao longo do tempo.
              </Text>
            </View>
          </View>

        </ScrollView>

        {/* Bottom navigation */}
        <View style={styles.bottomNav}>
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push("/novo-registro")}
            >
              <LinearGradient colors={["#C084FC", "#F472B6"]} style={styles.fabGradient}>
                <PlusIcon size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Navigation buttons */}
          <View style={[
            styles.navBar,
            { backgroundColor: colors.card } // Fundo da nav bar
          ]}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/calendario")}>
              {/* Usando colors.icon para manter consistência no tema escuro */}
              <CalendarIcon size={20} color={colors.icon} />
              <Text style={[styles.navButtonText, { color: colors.icon }]}>Calendário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/lista-registro")}
            >
              <ListIcon size={20} color={colors.success || colors.icon} />
              <Text style={[styles.navButtonText, { color: colors.success || colors.icon }]}>Registros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/configuracoes")}
            >
              <MoreIcon size={20} color={colors.textSecondary} />
              <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Mais</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

// Mantivemos apenas estilos estruturais (layout, margens, tamanhos)
// Cores foram movidas para inline styles no componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: "capitalize",
  },
  greeting: {
    marginBottom: 32,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  dashboardContainer: {
    flex: 1,
    minHeight: 400,
  },
  dashboard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  dashboardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  dashboardText: {
    fontSize: 14,
    opacity: 0.6,
  },
  bottomNav: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 16,
  },
  fabContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    flexDirection: "row",
    borderRadius: 28,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 2,
  },
  navButtonText: {
    fontSize: 11,
    fontWeight: "500",
  },
})
