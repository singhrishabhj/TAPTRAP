import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  onClose: () => void;
}

export default function StatsScreen({ stats, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const avgReaction =
    stats.reactionCount > 0
      ? Math.round(stats.totalReactionTime / stats.reactionCount)
      : null;

  const unlockProgress: Array<{ score: number; label: string; unlocked: boolean }> = [
    {
      score: 20,
      label: "Glow Trail effect",
      unlocked: stats.unlockedEffects.includes("glow_trail"),
    },
    {
      score: 50,
      label: "Retro theme + Pulse effect",
      unlocked:
        stats.unlockedThemes.includes("retro") &&
        stats.unlockedEffects.includes("pulse"),
    },
    {
      score: 100,
      label: "Gold theme",
      unlocked: stats.unlockedThemes.includes("gold"),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
      testID="stats-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          testID="button-close-stats"
        >
          <Feather name="x" size={20} color={C.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Focus Level Hero */}
        <View style={styles.focusCard}>
          <View style={styles.focusGlow} />
          <Text style={styles.focusLevelNumber}>{stats.focusLevel}</Text>
          <Text style={styles.focusLabel}>focus level</Text>
          <View style={styles.focusBar}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.focusSegment,
                  {
                    backgroundColor:
                      i < stats.focusLevel ? C.neon : "#1a1f2e",
                    shadowColor: i < stats.focusLevel ? C.neon : "transparent",
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.focusSub}>
            {stats.focusLevel >= 8
              ? "Elite reflexes"
              : stats.focusLevel >= 5
              ? "Getting sharp"
              : "Keep practicing"}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.grid}>
          <StatCard
            value={String(stats.bestScore)}
            label="Best Score"
            icon="award"
            accent={C.neonGold}
          />
          <StatCard
            value={String(stats.totalPlays)}
            label="Total Games"
            icon="play-circle"
            accent={C.neon}
          />
          <StatCard
            value={avgReaction ? `${avgReaction}ms` : "—"}
            label="Avg Reaction"
            icon="zap"
            accent={C.neonPink}
          />
          <StatCard
            value={String(stats.currentStreak)}
            label="Day Streak"
            icon="trending-up"
            accent={C.neonGreen}
          />
        </View>

        {/* Unlocks */}
        <Text style={styles.sectionLabel}>Unlocks</Text>
        <View style={styles.card}>
          {unlockProgress.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.unlockRow}>
                <View
                  style={[
                    styles.unlockIcon,
                    {
                      backgroundColor: item.unlocked
                        ? "rgba(166,77,255,0.15)"
                        : "#111620",
                    },
                  ]}
                >
                  <Feather
                    name={item.unlocked ? "unlock" : "lock"}
                    size={12}
                    color={item.unlocked ? C.neon : "#2a3040"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.unlockLabel,
                      { color: item.unlocked ? C.foreground : "#2a3040" },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.unlockScore}>
                    Score {item.score}+ to unlock
                  </Text>
                </View>
                {item.unlocked && (
                  <Feather name="check" size={14} color={C.neon} />
                )}
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Player info */}
        <View style={styles.playerRow}>
          <Text style={styles.playerName}>{stats.playerName}</Text>
          {stats.lastPlayedDate ? (
            <Text style={styles.lastPlayed}>
              last played {stats.lastPlayedDate}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: `${accent}22` }]}>
      <Feather name={icon as any} size={14} color={accent} />
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 18,
    color: C.foreground,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  focusCard: {
    backgroundColor: "#0d0f18",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a1f2e",
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  focusGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.neon,
    opacity: 0.05,
    top: -50,
  },
  focusLevelNumber: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 64,
    color: C.neon,
    textShadowColor: C.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 68,
  },
  focusLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: C.mutedForeground,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  focusBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  focusSegment: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },
  focusSub: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#2a3040",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#0d0f18",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-start",
    gap: 6,
  },
  statValue: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 24,
  },
  statLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: C.mutedForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: C.mutedForeground,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#0d0f18",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a1f2e",
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "#1a1f2e",
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unlockIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
  },
  unlockScore: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#2a3040",
    marginTop: 2,
    letterSpacing: 1,
  },
  playerRow: {
    marginTop: 20,
    alignItems: "center",
  },
  playerName: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 14,
    color: "#1e2533",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  lastPlayed: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#1a1f2e",
    marginTop: 4,
  },
});
