import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { type GameStats } from "@/lib/storage";

const C = colors.dark;

interface Props {
  stats: GameStats;
  onPlay: (mode: "endless" | "zen") => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

export default function MainMenu({
  stats,
  onPlay,
  onOpenSettings,
  onOpenStats,
}: Props) {
  const insets = useSafeAreaInsets();
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      testID="main-menu"
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: topInset + 24,
            paddingBottom: bottomInset + 24,
          },
        ]}
      >
        {/* Ambient glow */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoBlock,
            { transform: [{ scale: pulse }] },
          ]}
        >
          <Text style={styles.logo}>
            <Text style={styles.logoTap}>TAP</Text>
            <Text style={styles.logoTrap}>TRAP</Text>
          </Text>
          <Text style={styles.tagline}>you were so close.</Text>
        </Animated.View>

        {/* Player card */}
        {stats.playerName ? (
          <View style={styles.playerCard}>
            <View style={styles.playerCardLeft}>
              <Text style={styles.playerCardName}>{stats.playerName}</Text>
              <Text style={styles.playerCardSub}>
                Focus Lv. {stats.focusLevel} · Streak {stats.currentStreak}d
              </Text>
            </View>
            <View style={styles.playerCardRight}>
              <Text style={styles.playerCardBestValue}>{stats.bestScore}</Text>
              <Text style={styles.playerCardBestLabel}>best</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.spacer} />

        {/* Play buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            testID="button-play-endless"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onPlay("endless");
            }}
            style={styles.primaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>PLAY</Text>
            <Text style={styles.primaryButtonSub}>endless mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="button-play-zen"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPlay("zen");
            }}
            style={styles.zenButton}
            activeOpacity={0.8}
          >
            <Text style={styles.zenButtonText}>ZEN</Text>
            <Text style={styles.zenButtonSub}>slow & forgiving</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={onOpenStats}
            testID="button-menu-stats"
            style={styles.navButton}
          >
            <Feather name="bar-chart-2" size={18} color={C.mutedForeground} />
            <Text style={styles.navButtonLabel}>stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenSettings}
            testID="button-menu-settings"
            style={styles.navButton}
          >
            <Feather name="settings" size={18} color={C.mutedForeground} />
            <Text style={styles.navButtonLabel}>settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  glowTop: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: C.neon,
    opacity: 0.04,
    top: -60,
    alignSelf: "center",
  },
  glowBottom: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: C.neonPink,
    opacity: 0.03,
    bottom: 0,
    right: -40,
  },
  logoBlock: {
    alignItems: "center",
    marginTop: 16,
  },
  logo: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 40,
    letterSpacing: 6,
  },
  logoTap: {
    color: C.neon,
    textShadowColor: C.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  logoTrap: {
    color: C.neonPink,
    textShadowColor: C.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#2a3040",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 8,
  },
  playerCard: {
    flexDirection: "row",
    backgroundColor: "#0d0f18",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a1f2e",
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: "100%",
    marginTop: 24,
    alignItems: "center",
  },
  playerCardLeft: {
    flex: 1,
  },
  playerCardName: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 15,
    color: C.foreground,
  },
  playerCardSub: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: C.mutedForeground,
    letterSpacing: 1,
    marginTop: 2,
  },
  playerCardRight: {
    alignItems: "flex-end",
  },
  playerCardBestValue: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 28,
    color: C.neonGold,
    textShadowColor: C.neonGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  playerCardBestLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: C.mutedForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  spacer: {
    flex: 1,
  },
  buttons: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#15073a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${C.neon}44`,
    paddingVertical: 22,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 22,
    color: C.neon,
    letterSpacing: 8,
    textShadowColor: C.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  primaryButtonSub: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#3a2060",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 4,
  },
  zenButton: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a1f2e",
    paddingVertical: 16,
    alignItems: "center",
  },
  zenButtonText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 14,
    color: "#2a3040",
    letterSpacing: 6,
  },
  zenButtonSub: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#1e2533",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: "row",
    gap: 16,
  },
  navButton: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  navButtonLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#2a3040",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
