import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { type GameSettings } from "@/lib/storage";

const C = colors.dark;

interface Props {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  onClose: () => void;
  unlockedThemes: string[];
  onClearData: () => void;
}

export default function SettingsScreen({
  settings,
  onUpdate,
  onClose,
  unlockedThemes,
  onClearData,
}: Props) {
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  function toggle(key: keyof GameSettings) {
    Haptics.selectionAsync();
    onUpdate({ ...settings, [key]: !settings[key as keyof typeof settings] });
  }

  function setTheme(theme: GameSettings["theme"]) {
    if (!unlockedThemes.includes(theme)) return;
    Haptics.selectionAsync();
    onUpdate({ ...settings, theme });
  }

  function confirmClear() {
    if (Platform.OS === "web") {
      if (confirm("Reset all stats and settings?")) onClearData();
      return;
    }
    Alert.alert(
      "Reset all data?",
      "This will erase your stats, best score, and streaks.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: onClearData,
        },
      ]
    );
  }

  const themes: Array<{ key: GameSettings["theme"]; label: string; color: string; score: number }> = [
    { key: "neon", label: "Neon", color: C.neon, score: 0 },
    { key: "retro", label: "Retro", color: C.neonGreen, score: 50 },
    { key: "gold", label: "Gold", color: C.neonGold, score: 100 },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
      testID="settings-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          testID="button-close-settings"
        >
          <Feather name="x" size={20} color={C.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Game */}
        <Text style={styles.sectionLabel}>Game</Text>
        <View style={styles.card}>
          <SettingRow
            label="Haptics"
            icon="zap"
            value={settings.haptic}
            onToggle={() => toggle("haptic")}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Ghost Trail"
            icon="wind"
            value={settings.ghostTrail}
            onToggle={() => toggle("ghostTrail")}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Motivational Text"
            icon="message-circle"
            value={settings.motivationalText}
            onToggle={() => toggle("motivationalText")}
          />
        </View>

        {/* Section: Graphics */}
        <Text style={styles.sectionLabel}>Performance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="cpu" size={16} color={C.mutedForeground} />
              <Text style={styles.rowLabel}>Graphics</Text>
            </View>
            <View style={styles.segmentedControl}>
              {(["high", "low"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onUpdate({ ...settings, graphicsMode: mode });
                  }}
                  style={[
                    styles.segmentOption,
                    settings.graphicsMode === mode && styles.segmentActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.graphicsMode === mode &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Section: Theme */}
        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.card}>
          {themes.map((t, i) => {
            const isUnlocked = unlockedThemes.includes(t.key);
            const isActive = settings.theme === t.key;
            return (
              <React.Fragment key={t.key}>
                {i > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  onPress={() => setTheme(t.key)}
                  style={styles.row}
                  activeOpacity={isUnlocked ? 0.7 : 1}
                >
                  <View style={styles.rowLeft}>
                    <View
                      style={[
                        styles.themeCircle,
                        {
                          backgroundColor: isUnlocked ? t.color : "#1a1f2e",
                          borderColor: isActive ? t.color : "transparent",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: isUnlocked ? C.foreground : "#2a3040" },
                      ]}
                    >
                      {t.label}
                    </Text>
                    {!isUnlocked && (
                      <Text style={styles.lockLabel}>
                        score {t.score}+
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <Feather name="check" size={16} color={t.color} />
                  )}
                  {!isUnlocked && (
                    <Feather name="lock" size={14} color="#2a3040" />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={confirmClear}
            testID="button-clear-data"
          >
            <View style={styles.rowLeft}>
              <Feather name="trash-2" size={16} color={C.destructive} />
              <Text style={[styles.rowLabel, { color: C.destructive }]}>
                Reset all data
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.destructive} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  label,
  icon,
  value,
  onToggle,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon as any} size={16} color={C.mutedForeground} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#1a1f2e", true: `${C.neon}66` }}
        thumbColor={value ? C.neon : "#2a3040"}
        ios_backgroundColor="#1a1f2e"
      />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
    color: C.foreground,
  },
  lockLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#2a3040",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#1a1f2e",
    marginHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#111620",
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  segmentActive: {
    backgroundColor: "#1a1f2e",
  },
  segmentText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#2a3040",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: C.neon,
  },
  themeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
});
