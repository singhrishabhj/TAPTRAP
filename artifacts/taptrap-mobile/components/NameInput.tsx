import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const C = colors.dark;

interface Props {
  onSubmit: (name: string) => void;
}

export default function NameInput({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const insets = useSafeAreaInsets();
  const buttonScale = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  React.useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onSubmit(trimmed));
    });
  }

  const canSubmit = name.trim().length > 0;
  const webTopInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
    >
      {/* Ambient glow */}
      <View style={styles.glow} />

      <View style={[styles.content, { paddingTop: webTopInset + 40 }]}>
        <Text style={styles.logo}>
          <Text style={styles.logoTap}>TAP</Text>
          <Text style={styles.logoTrap}>TRAP</Text>
        </Text>

        <Text style={styles.prompt}>what do they call you?</Text>

        <View style={styles.inputContainer}>
          <TextInput
            testID="input-player-name"
            style={styles.input}
            value={name}
            onChangeText={(t) => setName(t.slice(0, 16))}
            placeholder="your name"
            placeholderTextColor="#2a3040"
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={16}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          <View
            style={[
              styles.inputUnderline,
              { backgroundColor: canSubmit ? C.neon : "#1a1f2e" },
            ]}
          />
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
          <TouchableOpacity
            testID="button-submit-name"
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
            style={[
              styles.button,
              {
                backgroundColor: canSubmit ? "#1a0a35" : "transparent",
                borderColor: canSubmit ? `${C.neon}55` : "#1a1f2e",
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                { color: canSubmit ? C.neon : "#2a3040" },
              ]}
            >
              let&apos;s go →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>stored locally · no account needed</Text>
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
    backgroundColor: C.neon,
    opacity: 0.05,
    top: "45%",
    alignSelf: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  logo: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 12,
  },
  logoTap: {
    color: C.neon,
  },
  logoTrap: {
    color: C.neonPink,
  },
  prompt: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  input: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 22,
    color: C.neon,
    textAlign: "center",
    paddingBottom: 12,
    letterSpacing: 4,
    backgroundColor: "transparent",
  },
  inputUnderline: {
    height: 1.5,
    width: "100%",
    borderRadius: 1,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 12,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  hint: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#1e2533",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
