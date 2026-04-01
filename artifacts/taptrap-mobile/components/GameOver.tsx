import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

const C = colors.dark;

const MOTIVATIONAL = [
  "Again.",
  "You had it.",
  "Don't stop.",
  "So close.",
  "One more.",
  "Focus.",
  "Almost.",
  "Reset.",
  "Breathe.",
  "Try again.",
];

interface Props {
  score: number;
  bestScore: number;
  playerName: string;
  focusLevel: number;
  isNewBest: boolean;
  onRetry: () => void;
  onMainMenu: () => void;
}

export default function GameOver({
  score,
  bestScore,
  playerName,
  focusLevel,
  isNewBest,
  onRetry,
  onMainMenu,
}: Props) {
  const insets = useSafeAreaInsets();
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const buttonsTranslate = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const [motivational] = useState(
    () => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]
  );

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(
      isNewBest
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );

    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.spring(scoreScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsTranslate, {
        toValue: 0,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `I just scored ${score} in TapTrap! 🎯 Focus Level: ${focusLevel}/10. Can you beat it?`,
      });
    } catch {}
  }

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      testID="game-over-screen"
    >
      {/* Ambient glow */}
      <View
        style={[
          styles.glow,
          { backgroundColor: isNewBest ? C.neonGold : C.neonPink },
        ]}
      />

      <View
        style={[
          styles.content,
          { paddingTop: topInset + 32, paddingBottom: bottomInset + 24 },
        ]}
      >
        {/* Top label */}
        <Text style={styles.gameOverLabel}>GAME OVER</Text>
        <Text style={styles.motivational}>{motivational}</Text>

        {/* Score */}
        <Animated.View
          style={[
            styles.scoreBlock,
            { transform: [{ scale: scoreScale }] },
          ]}
        >
          <Text
            style={[
              styles.score,
              {
                color: isNewBest ? C.neonGold : C.neon,
                textShadowColor: isNewBest ? C.neonGold : C.neon,
              },
            ]}
          >
            {score}
          </Text>
          {isNewBest && (
            <View style={styles.newBestBadge}>
              <Text style={styles.newBestText}>NEW BEST</Text>
            </View>
          )}
          {!isNewBest && (
            <Text style={styles.bestLine}>best: {bestScore}</Text>
          )}
        </Animated.View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{focusLevel}/10</Text>
            <Text style={styles.statLabel}>focus</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playerName}</Text>
            <Text style={styles.statLabel}>player</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttons,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslate }],
            },
          ]}
        >
          <TouchableOpacity
            testID="button-retry"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRetry();
            }}
            style={[styles.primaryButton, { borderColor: `${C.neon}55` }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.primaryButtonText, { color: C.neon }]}>
              play again
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              testID="button-share"
              onPress={handleShare}
              style={styles.secondaryButton}
              activeOpacity={0.7}
            >
              <Feather name="share" size={16} color={C.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="button-main-menu"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onMainMenu();
              }}
              style={styles.secondaryButton}
              activeOpacity={0.7}
            >
              <Feather name="home" size={16} color={C.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.06,
    top: "35%",
    alignSelf: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  gameOverLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: C.mutedForeground,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  motivational: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 14,
    color: "#2a3040",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 32,
  },
  scoreBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  score: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 96,
    lineHeight: 96,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  newBestBadge: {
    backgroundColor: "rgba(255,204,51,0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  newBestText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 11,
    color: C.neonGold,
    letterSpacing: 3,
  },
  bestLine: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 12,
    color: "#2a3040",
    letterSpacing: 2,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 18,
    color: C.foreground,
  },
  statLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: C.mutedForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#1a1f2e",
  },
  spacer: {
    flex: 1,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: "rgba(166,77,255,0.06)",
  },
  primaryButtonText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 13,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0d0f18",
    borderWidth: 1,
    borderColor: "#1a1f2e",
    alignItems: "center",
    justifyContent: "center",
  },
});
