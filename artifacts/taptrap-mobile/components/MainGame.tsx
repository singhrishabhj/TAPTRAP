import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import {
  getDotPosition,
  getSpeedForScore,
  getPatternForScore,
  generateTapZones,
  generateFakeZones,
  checkTapZone,
  type ZoneArea,
  type DotPosition,
} from "@/lib/gameEngine";
import { type GameSettings } from "@/lib/storage";

const C = colors.dark;
const { width, height } = Dimensions.get("window");
const ARENA_RADIUS = Math.min(width, height) * 0.32;
const DOT_SIZE = 18;
const GHOST_MAX = 20;

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
  playerName: string;
  bestScore: number;
  settings: GameSettings;
  onGameOver: (
    score: number,
    timingError: number,
    reactionTime: number
  ) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  gameMode: "endless" | "zen";
}

export default function MainGame({
  playerName,
  bestScore,
  settings,
  onGameOver,
  onOpenSettings,
  onOpenStats,
  gameMode,
}: Props) {
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState(0);
  const [tapZones, setTapZones] = useState<ZoneArea[]>([]);
  const [fakeZones, setFakeZones] = useState<ZoneArea[]>([]);
  const [ghostTrail, setGhostTrail] = useState<DotPosition[]>([]);
  const [isAlive, setIsAlive] = useState(true);
  const [showNearMiss, setShowNearMiss] = useState(false);
  const [nearMissText, setNearMissText] = useState("");
  const [showAlmostBest, setShowAlmostBest] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isStarted, setIsStarted] = useState(false);

  // Refs for gameplay-critical values — never stale, always current
  const angleRef = useRef(0);
  const scoreRef = useRef(0);
  const isAliveRef = useRef(true);
  const tapZonesRef = useRef<ZoneArea[]>([]);
  const fakeZonesRef = useRef<ZoneArea[]>([]);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const phaseRef = useRef(0);
  const lastTimeRef = useRef(0);
  const trailTickRef = useRef(0);

  // Animated values driven directly from the rAF loop via setValue() —
  // zero React re-render lag, visual always matches game logic exactly
  const dotXAnim = useRef(new Animated.Value(0)).current;
  const dotYAnim = useRef(new Animated.Value(0)).current;

  // Animations
  const scoreScale = useRef(new Animated.Value(1)).current;
  const nearMissOpacity = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1.5)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  const themePrimary =
    settings.theme === "gold"
      ? C.neonGold
      : settings.theme === "retro"
      ? C.neonGreen
      : C.neon;

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  // Countdown
  useEffect(() => {
    if (countdown <= 0) {
      setIsStarted(true);
      lastTimeRef.current = performance.now();
      return;
    }

    // Animate countdown number
    countdownScale.setValue(1.5);
    countdownOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(countdownScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.timing(countdownOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(countdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setCountdown((c) => c - 1));
    }, 550);
    return () => clearTimeout(t);
  }, [countdown]);

  // Setup tap zones when score changes
  useEffect(() => {
    const s = scoreRef.current;
    const zones = generateTapZones(s, angleRef.current, gameMode === "zen");
    const fakes = generateFakeZones(s, zones);
    tapZonesRef.current = zones;
    fakeZonesRef.current = fakes;
    setTapZones(zones);
    setFakeZones(fakes);
  }, [score, gameMode]);

  // Game loop
  useEffect(() => {
    if (!isStarted) return;

    function tick(now: number) {
      if (!isAliveRef.current) return;
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      const speed = getSpeedForScore(scoreRef.current, gameMode === "zen");
      angleRef.current += speed * (dt / 16);
      phaseRef.current += 0.02;

      const pattern = getPatternForScore(scoreRef.current);
      const pos = getDotPosition(
        angleRef.current,
        pattern,
        phaseRef.current,
        ARENA_RADIUS
      );

      // Drive visual directly — no React re-render needed, zero lag
      dotXAnim.setValue(pos.x);
      dotYAnim.setValue(pos.y);

      // Throttle ghost trail to ~20fps to avoid hammering React
      if (settings.ghostTrail && settings.graphicsMode === "high") {
        trailTickRef.current++;
        if (trailTickRef.current % 3 === 0) {
          setGhostTrail((prev) => {
            const next = [...prev, pos];
            return next.slice(-GHOST_MAX);
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isStarted, settings.ghostTrail, settings.graphicsMode, gameMode]);

  const handleTap = useCallback(() => {
    if (!isAliveRef.current || !isStarted) return;

    const now = Date.now();
    const currentAngle = angleRef.current;
    const zones = tapZonesRef.current;
    const fakes = fakeZonesRef.current;

    const fakeHit = checkTapZone(currentAngle, fakes, 0.04);
    const hit = checkTapZone(currentAngle, zones, 0.06);   // small tolerance — fairness
    const nearHit = !hit && checkTapZone(currentAngle, zones, 0.2);

    if (hit && !fakeHit) {
      // Correct tap
      if (settings.haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scoreScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);

      if (bestScore > 0 && newScore === bestScore - 1) {
        setShowAlmostBest(true);
        setTimeout(() => setShowAlmostBest(false), 2000);
      }
    } else if (nearHit && !fakeHit) {
      // Near miss
      if (settings.haptic) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      const errorMs = 150;
      setNearMissText(`${(errorMs / 1000).toFixed(2)}s too close`);
      setShowNearMiss(true);

      Animated.sequence([
        Animated.timing(nearMissOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(nearMissOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowNearMiss(false));

      isAliveRef.current = false;
      setIsAlive(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setTimeout(() => {
        onGameOver(scoreRef.current, errorMs, 200);
      }, 500);
    } else {
      // Wrong tap
      if (settings.haptic) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      isAliveRef.current = false;
      setIsAlive(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setTimeout(() => {
        onGameOver(scoreRef.current, 500, 300);
      }, 300);
    }
  }, [isStarted, settings, bestScore, onGameOver]);

  const centerX = width / 2;
  const centerY = height / 2 - 20;

  return (
    <Pressable onPressIn={handleTap} testID="game-area" style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Ambient glow */}
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: themePrimary,
              top: centerY - 160,
              left: centerX - 160,
            },
          ]}
        />

        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            { paddingTop: topInset + 8 },
          ]}
        >
          <View>
            <Text style={styles.playerName}>{playerName}</Text>
            {gameMode === "zen" && (
              <Text style={[styles.zenBadge, { color: C.neonGreen }]}>
                zen mode
              </Text>
            )}
          </View>
          <View style={styles.topRight}>
            <View style={styles.bestContainer}>
              <Text style={styles.bestLabel}>best</Text>
              <Text style={styles.bestValue}>{Math.max(bestScore, score)}</Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onOpenStats();
              }}
              testID="button-open-stats"
            >
              <View style={styles.iconButton}>
                <Feather name="bar-chart-2" size={16} color={C.mutedForeground} />
              </View>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onOpenSettings();
              }}
              testID="button-open-settings"
            >
              <View style={styles.iconButton}>
                <Feather name="settings" size={16} color={C.mutedForeground} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Score */}
        <Animated.Text
          testID="text-score"
          style={[
            styles.score,
            {
              color: C.foreground,
              transform: [{ scale: scoreScale }],
              marginTop: topInset + 60,
            },
          ]}
        >
          {score}
        </Animated.Text>

        {/* Game Arena */}
        <View
          style={[
            styles.arena,
            { top: centerY - ARENA_RADIUS, left: centerX - ARENA_RADIUS },
          ]}
        >
          {/* Track circle */}
          <View
            style={[
              styles.track,
              {
                width: ARENA_RADIUS * 2,
                height: ARENA_RADIUS * 2,
                borderRadius: ARENA_RADIUS,
                borderColor: "#1a1f2e",
              },
            ]}
          />

          {/* Ghost trail */}
          {settings.ghostTrail &&
            settings.graphicsMode === "high" &&
            ghostTrail.map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.ghostDot,
                  {
                    width: (DOT_SIZE / 2) * (i / ghostTrail.length),
                    height: (DOT_SIZE / 2) * (i / ghostTrail.length),
                    borderRadius: (DOT_SIZE / 4) * (i / ghostTrail.length),
                    backgroundColor: themePrimary,
                    opacity: (i / ghostTrail.length) * 0.25,
                    left: ARENA_RADIUS + pos.x - (DOT_SIZE / 4) * (i / ghostTrail.length),
                    top: ARENA_RADIUS + pos.y - (DOT_SIZE / 4) * (i / ghostTrail.length),
                  },
                ]}
              />
            ))}

          {/* Tap zone arc indicators — always visible */}
          {tapZones.map((zone, zi) => {
            const steps = 9;
            return Array.from({ length: steps }, (_, k) => {
              const a = zone.startAngle + (k / (steps - 1)) * (zone.endAngle - zone.startAngle);
              const isMid = k === Math.floor(steps / 2);
              const dotSz = isMid ? 10 : 5;
              const px = ARENA_RADIUS + ARENA_RADIUS * Math.cos(a);
              const py = ARENA_RADIUS + ARENA_RADIUS * Math.sin(a);
              const col = gameMode === "zen" ? C.neonGreen : themePrimary;
              return (
                <View
                  key={`zone-${zi}-${k}`}
                  style={{
                    position: "absolute",
                    width: dotSz,
                    height: dotSz,
                    borderRadius: dotSz / 2,
                    backgroundColor: col,
                    opacity: isMid ? 0.55 : 0.2,
                    left: px - dotSz / 2,
                    top: py - dotSz / 2,
                  }}
                />
              );
            });
          })}

          {/* Fake zone arc indicators (danger markers) */}
          {fakeZones.map((zone, zi) => {
            const steps = 5;
            return Array.from({ length: steps }, (_, k) => {
              const a = zone.startAngle + (k / (steps - 1)) * (zone.endAngle - zone.startAngle);
              const px = ARENA_RADIUS + ARENA_RADIUS * Math.cos(a);
              const py = ARENA_RADIUS + ARENA_RADIUS * Math.sin(a);
              return (
                <View
                  key={`fake-${zi}-${k}`}
                  style={{
                    position: "absolute",
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#882020",
                    opacity: 0.4,
                    left: px - 2,
                    top: py - 2,
                  }}
                />
              );
            });
          })}

          {/* Main dot — position driven directly by Animated.Value via setValue()
              from the rAF loop, zero React render lag, always in sync with logic */}
          {isAlive && (
            <Animated.View
              style={[
                styles.dot,
                {
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: DOT_SIZE / 2,
                  backgroundColor: themePrimary,
                  left: ARENA_RADIUS - DOT_SIZE / 2,
                  top: ARENA_RADIUS - DOT_SIZE / 2,
                  transform: [
                    { translateX: dotXAnim },
                    { translateY: dotYAnim },
                  ],
                  boxShadow: `0 0 12px ${themePrimary}`,
                } as any,
              ]}
            />
          )}
        </View>

        {/* Countdown overlay */}
        {!isStarted && (
          <Animated.Text
            style={[
              styles.countdown,
              {
                color: themePrimary,
                opacity: countdownOpacity,
                transform: [{ scale: countdownScale }],
              },
            ]}
          >
            {countdown === 0 ? "GO" : countdown}
          </Animated.Text>
        )}

        {/* Near miss */}
        {showNearMiss && (
          <Animated.View
            style={[styles.nearMissContainer, { opacity: nearMissOpacity }]}
          >
            <Text style={styles.nearMissText}>SO CLOSE</Text>
            <Text style={styles.nearMissDetail}>{nearMissText}</Text>
          </Animated.View>
        )}

        {/* Almost best banner */}
        {showAlmostBest && (
          <View style={styles.almostBestBanner}>
            <Text style={styles.almostBestText}>
              almost beat your best ({bestScore})
            </Text>
          </View>
        )}

        {/* First tap hint */}
        {isStarted && score === 0 && (
          <Text
            style={[
              styles.tapHint,
              { bottom: bottomInset + 24 },
            ]}
          >
            tap when the dot reaches the glowing arc
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  ambientGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.05,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  playerName: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: C.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  zenBadge: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bestContainer: {
    alignItems: "flex-end",
    marginRight: 4,
  },
  bestLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: C.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  bestValue: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 14,
    color: "#4a5568",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontFamily: "SpaceMono_700Bold",
    fontSize: 64,
    lineHeight: 64,
    zIndex: 5,
  },
  arena: {
    position: "absolute",
    width: ARENA_RADIUS * 2,
    height: ARENA_RADIUS * 2,
  },
  track: {
    position: "absolute",
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  ghostDot: {
    position: "absolute",
  },
  dot: {
    position: "absolute",
  },
  countdown: {
    position: "absolute",
    fontFamily: "SpaceMono_700Bold",
    fontSize: 72,
    textAlign: "center",
    width: "100%",
    top: "45%",
    zIndex: 20,
  },
  nearMissContainer: {
    position: "absolute",
    top: "35%",
    width: "100%",
    alignItems: "center",
    zIndex: 20,
  },
  nearMissText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 24,
    color: C.neonGold,
    letterSpacing: 4,
    textShadowColor: C.neonGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  nearMissDetail: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
    marginTop: 4,
  },
  almostBestBanner: {
    position: "absolute",
    top: 90,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  almostBestText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: C.neon,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "rgba(166,77,255,0.1)",
    borderRadius: 20,
    letterSpacing: 1,
    overflow: "hidden",
  },
  tapHint: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#1e2533",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
