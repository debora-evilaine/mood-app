"use client"

import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef } from "react"
import { Animated, Platform, StyleSheet, Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"
import { useTheme } from "../context/ThemeContext"

// ... (Mantenha os componentes HeartIcon e SparklesIcon iguais ao anterior) ...
function HeartIcon({ size = 64, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  )
}

function SparklesIcon({ size = 24, color = "#FBBF24" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </Svg>
  )
}

// Adicionamos a prop onFinish
interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors, theme } = useTheme();

  // Animações Decorativas
  const pulse1 = useRef(new Animated.Value(1)).current
  const pulse2 = useRef(new Animated.Value(1)).current
  const pulse3 = useRef(new Animated.Value(1)).current
  const bounce = useRef(new Animated.Value(0)).current

  // Animações de Transição
  const contentOpacity = useRef(new Animated.Value(0)).current // Fade In dos elementos
  const containerOpacity = useRef(new Animated.Value(1)).current // Fade Out da tela toda

  const useNativeDriver = Platform.OS !== "web"

  useEffect(() => {
    // 1. Loops Decorativos (iniciam imediatamente)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.2, duration: 2000, useNativeDriver }),
        Animated.timing(pulse1, { toValue: 1, duration: 2000, useNativeDriver }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2, { toValue: 1.3, duration: 2500, useNativeDriver }),
        Animated.timing(pulse2, { toValue: 1, duration: 2500, useNativeDriver }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse3, { toValue: 1.25, duration: 3000, useNativeDriver }),
        Animated.timing(pulse3, { toValue: 1, duration: 3000, useNativeDriver }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 500, useNativeDriver }),
        Animated.timing(bounce, { toValue: 0, duration: 500, useNativeDriver }),
      ]),
    ).start()

    // 2. Sequência Principal: Entrar -> Esperar -> Sair
    Animated.sequence([
      // Fade In (Conteúdo aparece)
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
      // Espera um pouco com a tela visível
      Animated.delay(1000),
      // Fade Out (Tela toda desaparece revelando a Home por baixo)
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver,
      })
    ]).start(({ finished }) => {
      // Quando terminar o Fade Out, avisa o App para desmontar este componente
      if (finished) {
        onFinish();
      }
    });

  }, [])

  return (
    // Envolvemos tudo num Animated.View absoluto para controlar a opacidade total
    <Animated.View style={[styles.overlay, { opacity: containerOpacity }]}>
      <LinearGradient colors={colors.background as any} style={styles.container}>

        {/* Blobs de fundo */}
        <Animated.View
          style={[
            styles.blob1,
            { transform: [{ scale: pulse1 }], backgroundColor: theme === 'dark' ? colors.icon : "rgba(216, 180, 254, 0.3)", opacity: theme === 'dark' ? 0.2 : 0.6 }
          ]}
        />
        <Animated.View
          style={[
            styles.blob2,
            { transform: [{ scale: pulse2 }], backgroundColor: theme === 'dark' ? colors.text : "rgba(251, 207, 232, 0.3)", opacity: theme === 'dark' ? 0.1 : 0.6 }
          ]}
        />
        <Animated.View
          style={[
            styles.blob3,
            { transform: [{ scale: pulse3 }], backgroundColor: theme === 'dark' ? colors.tint : "rgba(191, 219, 254, 0.2)", opacity: theme === 'dark' ? 0.2 : 0.6 }
          ]}
        />

        {/* Conteúdo (controlado pelo contentOpacity para entrada suave) */}
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <View style={styles.iconContainer}>
            <View style={[
              styles.iconGlow,
              { backgroundColor: theme === 'dark' ? colors.icon : "#D8B4FE", opacity: 0.4 }
            ]} />
            <View style={[
              styles.iconWrapper,
              { backgroundColor: theme === 'dark' ? colors.tint : "#E9D5FF" }
            ]}>
              <HeartIcon size={64} color={colors.icon} />
            </View>
            <Animated.View style={[styles.sparklesIcon, { transform: [{ translateY: bounce }] }]}>
              <SparklesIcon size={24} />
            </Animated.View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>MoodFlow</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Registre seus sentimentos</Text>
          </View>

          <View style={styles.loadingContainer}>
            <LoadingDot delay={0} color={colors.icon} />
            <LoadingDot delay={150} color={colors.icon} />
            <LoadingDot delay={300} color={colors.icon} />
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  )
}

function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const bounce = useRef(new Animated.Value(0)).current
  const useNativeDriver = Platform.OS !== "web"

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -8, duration: 400, useNativeDriver }),
          Animated.timing(bounce, { toValue: 0, duration: 400, useNativeDriver }),
        ]),
      ).start()
    }, delay)

    return () => clearTimeout(t)
  }, [bounce, delay])

  return <Animated.View style={[styles.loadingDot, { transform: [{ translateY: bounce }], backgroundColor: color }]} />
}

const styles = StyleSheet.create({
  // Overlay absoluto para cobrir a Home
  overlay: {
    ...StyleSheet.absoluteFillObject, // Ocupa toda a tela
    zIndex: 100, // Fica por cima de tudo
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  blob1: {
    position: "absolute",
    top: 80,
    left: 40,
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  blob2: {
    position: "absolute",
    bottom: 128,
    right: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  blob3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -96,
    marginLeft: -96,
    width: 192,
    height: 192,
    borderRadius: 96,
  },
  content: {
    zIndex: 10,
    alignItems: "center",
    gap: 24,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  iconWrapper: {
    padding: 32,
    borderRadius: 64,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sparklesIcon: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  textContainer: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
