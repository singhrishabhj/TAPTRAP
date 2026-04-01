import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const C = colors.dark;
const { width, height } = Dimensions.get("window");
const DEMO_RADIUS = Math.min(width, height) * 0.26;
const DOT = 14;

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    id: 0,
    title: "The Track",
    body: "A dot travels along a circular track, gradually speeding up as your score climbs.",
    cta: "Got it →",
  },
  {
    id: 1,
    title: "The Zone",
    body: "A glowing marker shows you where to tap. Time it right and you score a point.",
    cta: "Makes sense →",
  },
  {
    id: 2,
    title: "Miss = Over",
    body: "Tap too early, too late, or on a fake zone and the game ends instantly. Stay focused.",
    cta: "I'm ready",
  },
];

export default function TutorialScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  // Animated dot angle
  const angle = useRef(new Animated.Value(0)).current;
  const zoneScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // Zone angle (static for tutorial — bottom of circle, ~90°)
  const ZONE_ANGLE = Math.PI / 2;
  const ZONE_WIDTH = 0.5; // wide for demo

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous dot rotation — native driver safe (uses transform, not left/top)
    const loop = Animated.loop(
      Animated.timing(angle, {
        toValue: 1,
        duration: 2800,
        useNativeDriver: true,
      })
    );
    loop.start();

    // Zone pulse
    const zonePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(zoneScale, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(zoneScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    zonePulse.start();

    // On step 2, flash the dot to simulate a miss
    if (step === 2) {
      dotOpacity.setValue(1);
      const flash = Animated.sequence([
        Animated.delay(900),
        Animated.timing(dotOpacity, {
          toValue: 0.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      flash.start();
    }

    return () => {
      loop.stop();
      zonePulse.stop();
    };
  }, [step]);

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < STEPS.length - 1) {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: -16,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        cardOpacity.setValue(0);
        cardTranslate.setValue(20);
        setStep((s) => s + 1);
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslate, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDone();
    }
  }

  // Zone dots — render arc dots along the zone
  const zoneDots = Array.from({ length: 7 }, (_, i) => {
    const a = ZONE_ANGLE - ZONE_WIDTH / 2 + (i / 6) * ZONE_WIDTH;
    const x = DEMO_RADIUS * Math.cos(a);
    const y = DEMO_RADIUS * Math.sin(a);
    const isCenter = i === 3;
    return { x, y, isCenter, a };
  });

  // Fake zone for step 2
  const FAKE_ANGLE = Math.PI * 1.5;
  const fakeDots = Array.from({ length: 5 }, (_, i) => {
    const a = FAKE_ANGLE - 0.3 + (i / 4) * 0.6;
    return {
      x: DEMO_RADIUS * Math.cos(a),
      y: DEMO_RADIUS * Math.sin(a),
    };
  });

  const cx = width / 2;
  const cy = height * 0.38;

  const s = STEPS[step];

  return (
    <Animated.View
      style={[styles.container, { opacity: cardOpacity }]}
      testID="tutorial-screen"
    >
      {/* Track */}
      <View
        style={[
          styles.track,
          {
            width: DEMO_RADIUS * 2,
            height: DEMO_RADIUS * 2,
            borderRadius: DEMO_RADIUS,
            left: cx - DEMO_RADIUS,
            top: cy - DEMO_RADIUS,
          },
        ]}
      />

      {/* Zone dots — visible from step 1 */}
      {step >= 1 &&
        zoneDots.map((d, i) => (
          <Animated.View
            key={i}
            style={[
              styles.zoneDot,
              {
                left: cx + d.x - (d.isCenter ? 6 : 3),
                top: cy + d.y - (d.isCenter ? 6 : 3),
                width: d.isCenter ? 12 : 6,
                height: d.isCenter ? 12 : 6,
                borderRadius: d.isCenter ? 6 : 3,
                backgroundColor: C.neon,
                opacity: d.isCenter ? 0.85 : 0.35,
                transform: d.isCenter ? [{ scale: zoneScale }] : [{ scale: 1 }],
              },
            ]}
          />
        ))}

      {/* Fake zone — step 2 only */}
      {step === 2 &&
        fakeDots.map((d, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: cx + d.x - 4,
              top: cy + d.y - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#8a2020",
              opacity: 0.5,
            }}
          />
        ))}

      {/* Zone label */}
      {step === 1 && (
        <View
          style={{
            position: "absolute",
            left: cx + DEMO_RADIUS * Math.cos(ZONE_ANGLE) - 30,
            top: cy + DEMO_RADIUS * Math.sin(ZONE_ANGLE) + 18,
            width: 60,
            alignItems: "center",
          }}
        >
          <Text style={styles.zoneLabel}>TAP HERE</Text>
        </View>
      )}

      {/* Fake zone label */}
      {step === 2 && (
        <View
          style={{
            position: "absolute",
            left: cx + DEMO_RADIUS * Math.cos(FAKE_ANGLE) - 30,
            top: cy + DEMO_RADIUS * Math.sin(FAKE_ANGLE) - 40,
            width: 60,
            alignItems: "center",
          }}
        >
          <Text style={styles.fakeLabel}>FAKE</Text>
        </View>
      )}

      {/* Animated dot */}
      <AnimatedDot
        angle={angle}
        cx={cx}
        cy={cy}
        radius={DEMO_RADIUS}
        dotSize={DOT}
        color={step === 2 ? C.neonPink : C.neon}
        opacity={dotOpacity}
      />

      {/* Step indicator */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              { backgroundColor: i === step ? C.neon : "#161b28" },
            ]}
          />
        ))}
      </View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            bottom: bottomInset + 24,
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslate }],
          },
        ]}
      >
        <Text style={styles.cardTitle}>{s.title}</Text>
        <Text style={styles.cardBody}>{s.body}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={[
            styles.ctaButton,
            step === STEPS.length - 1 && styles.ctaButtonFinal,
          ]}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.ctaText,
              step === STEPS.length - 1 && styles.ctaTextFinal,
            ]}
          >
            {s.cta}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Skip */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDone();
        }}
        style={[styles.skipBtn, { top: topInset + 16 }]}
        testID="button-skip-tutorial"
      >
        <Text style={styles.skipText}>skip</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Build a circular keyframe table so we can use useNativeDriver: true
// angle goes 0→1 (one full revolution), mapped to cos/sin offsets
const N_KEYS = 48;
function buildCircleInterpolation(
  radius: number,
  axis: "x" | "y"
): { inputRange: number[]; outputRange: number[] } {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= N_KEYS; i++) {
    const t = i / N_KEYS;
    const rad = t * Math.PI * 2;
    inputRange.push(t);
    outputRange.push(axis === "x" ? radius * Math.cos(rad) : radius * Math.sin(rad));
  }
  return { inputRange, outputRange };
}

function AnimatedDot({
  angle,
  cx,
  cy,
  radius,
  dotSize,
  color,
  opacity,
}: {
  angle: Animated.Value;
  cx: number;
  cy: number;
  radius: number;
  dotSize: number;
  color: string;
  opacity: Animated.Value;
}) {
  const xInterp = buildCircleInterpolation(radius, "x");
  const yInterp = buildCircleInterpolation(radius, "y");

  const translateX = angle.interpolate(xInterp);
  const translateY = angle.interpolate(yInterp);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: color,
        left: cx - dotSize / 2,
        top: cy - dotSize / 2,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  track: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#1a2030",
    backgroundColor: "transparent",
  },
  zoneDot: {
    position: "absolute",
  },
  zoneLabel: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: C.neon,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  fakeLabel: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: "#8a2020",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  dots: {
    position: "absolute",
    bottom: 260,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  card: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#0d0f1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#161b28",
    padding: 24,
    gap: 12,
  },
  cardTitle: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 18,
    color: C.neon,
    letterSpacing: 2,
  },
  cardBody: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
    lineHeight: 20,
  },
  ctaButton: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#1a1530",
    borderWidth: 1,
    borderColor: "#2a2050",
    marginTop: 4,
  },
  ctaButtonFinal: {
    backgroundColor: "#1f1040",
    borderColor: `${C.neon}55`,
  },
  ctaText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 11,
    color: "#4a3880",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  ctaTextFinal: {
    color: C.neon,
  },
  skipBtn: {
    position: "absolute",
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#2a3040",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
