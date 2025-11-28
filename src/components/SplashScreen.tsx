"use client"

import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef } from "react"
import { Animated, Platform, StyleSheet, Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"

function HeartIcon({ size = 64, color = "#9333EA" }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
    )
}

function SparklesIcon({ size = 24 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24">
            <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </Svg>
    )
}

export function SplashScreen() {
    const pulse1 = useRef(new Animated.Value(1)).current
    const pulse2 = useRef(new Animated.Value(1)).current
    const pulse3 = useRef(new Animated.Value(1)).current
    const fadeIn = useRef(new Animated.Value(0)).current
    const bounce = useRef(new Animated.Value(0)).current

    // On web the native animated module isn't available; avoid useNativeDriver there
    const useNativeDriver = Platform.OS !== "web"

    useEffect(() => {
        // Pulse animations for background elements
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

        // Fade in animation
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 800,
            useNativeDriver,
        }).start()

        // Bounce animation for sparkles
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, { toValue: -10, duration: 500, useNativeDriver }),
                Animated.timing(bounce, { toValue: 0, duration: 500, useNativeDriver }),
            ]),
        ).start()
    }, [])

    return (
        <LinearGradient colors={["#F3E8FF", "#FCE7F3", "#DBEAFE"]} style={styles.container}>
            {/* Background decorative elements */}
            <Animated.View style={[styles.blob1, { transform: [{ scale: pulse1 }] }]} />
            <Animated.View style={[styles.blob2, { transform: [{ scale: pulse2 }] }]} />
            <Animated.View style={[styles.blob3, { transform: [{ scale: pulse3 }] }]} />

            {/* Main content */}
            <Animated.View style={[styles.content, { opacity: fadeIn }]}>
                {/* Icon with glow effect */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconGlow} />
                    <View style={styles.iconWrapper}>
                        <HeartIcon size={64} color="#9333EA" />
                    </View>
                    <Animated.View style={[styles.sparklesIcon, { transform: [{ translateY: bounce }] }]}>
                        <SparklesIcon size={24} />
                    </Animated.View>
                </View>

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>MoodFlow</Text>
                    <Text style={styles.subtitle}>Registre seus sentimentos</Text>
                </View>

                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    <LoadingDot delay={0} />
                    <LoadingDot delay={150} />
                    <LoadingDot delay={300} />
                </View>
            </Animated.View>
        </LinearGradient>
    )
}

function LoadingDot({ delay }: { delay: number }) {
    const bounce = useRef(new Animated.Value(0)).current

    // define useNativeDriver locally because LoadingDot is a separate function
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

    return <Animated.View style={[styles.loadingDot, { transform: [{ translateY: bounce }] }]} />
}

const styles = StyleSheet.create({
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
        backgroundColor: "rgba(216, 180, 254, 0.3)",
        borderRadius: 64,
        opacity: 0.6,
    },
    blob2: {
        position: "absolute",
        bottom: 128,
        right: 40,
        width: 160,
        height: 160,
        backgroundColor: "rgba(251, 207, 232, 0.3)",
        borderRadius: 80,
        opacity: 0.6,
    },
    blob3: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -96,
        marginLeft: -96,
        width: 192,
        height: 192,
        backgroundColor: "rgba(191, 219, 254, 0.2)",
        borderRadius: 96,
        opacity: 0.6,
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
        backgroundColor: "#D8B4FE",
        borderRadius: 60,
        opacity: 0.4,
    },
    iconWrapper: {
        backgroundColor: "#E9D5FF",
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
        color: "#7C3AED",
    },
    subtitle: {
        fontSize: 16,
        color: "#A78BFA",
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
        backgroundColor: "#C084FC",
        borderRadius: 4,
    },
})
