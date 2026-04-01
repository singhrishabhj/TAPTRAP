import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");
const C = colors.dark;

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Main title entrance
    Animated.spring(titleScale, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Tagline
    const t1 = setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 700);

    // Subtitle
    const t2 = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1200);

    // Neon pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto advance
    const t3 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  function handleTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  }

  // Floating particles
  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <Pressable onPress={handleTap} testID="splash-screen" style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Ambient glow */}
        <View style={styles.glowCenter} />
        <View style={styles.glowLeft} />

        {/* Particles */}
        {particles.map((i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${8 + i * 11}%` as any,
                top: `${15 + (i % 4) * 18}%` as any,
                opacity: 0.25 + (i % 3) * 0.1,
                backgroundColor:
                  i % 3 === 0 ? C.neon : i % 3 === 1 ? C.neonPink : C.neonGold,
              },
            ]}
          />
        ))}

        {/* Main title block */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ scale: Animated.multiply(titleScale, pulse) }],
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>
            <Text style={styles.titleTap}>TAP</Text>
            <Text style={styles.titleTrap}>TRAP</Text>
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          you were so close.
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Made for focus &amp; reflex
        </Animated.Text>

        <Text style={styles.tapHint}>tap to skip</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCenter: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.neon,
    opacity: 0.06,
    top: "50%",
    left: "50%",
    marginLeft: -150,
    marginTop: -150,
  },
  glowLeft: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.neonPink,
    opacity: 0.04,
    top: "30%",
    left: "20%",
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 52,
    letterSpacing: 6,
    marginBottom: 8,
  },
  titleTap: {
    color: C.neon,
    textShadowColor: C.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleTrap: {
    color: C.neonPink,
    textShadowColor: C.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  tagline: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 8,
  },
  subtitle: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#2a3040",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 24,
  },
  tapHint: {
    position: "absolute",
    bottom: 48,
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#1e2533",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
