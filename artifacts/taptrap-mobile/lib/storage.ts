import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GameStats {
  playerName: string;
  bestScore: number;
  totalPlays: number;
  totalReactionTime: number;
  reactionCount: number;
  currentStreak: number;
  lastPlayedDate: string;
  focusLevel: number;
  unlockedThemes: string[];
  unlockedEffects: string[];
}

export interface GameSettings {
  sound: boolean;
  haptic: boolean;
  graphicsMode: "high" | "low";
  theme: "neon" | "retro" | "gold";
  ghostTrail: boolean;
  motivationalText: boolean;
}

const STATS_KEY = "taptrap_stats";
const SETTINGS_KEY = "taptrap_settings";

export const defaultStats: GameStats = {
  playerName: "",
  bestScore: 0,
  totalPlays: 0,
  totalReactionTime: 0,
  reactionCount: 0,
  currentStreak: 0,
  lastPlayedDate: "",
  focusLevel: 1,
  unlockedThemes: ["neon"],
  unlockedEffects: [],
};

export const defaultSettings: GameSettings = {
  sound: true,
  haptic: true,
  graphicsMode: "high",
  theme: "neon",
  ghostTrail: true,
  motivationalText: true,
};

export async function loadStats(): Promise<GameStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { ...defaultStats };
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStats };
  }
}

export async function saveStats(stats: GameStats): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([STATS_KEY, SETTINGS_KEY]);
}

export function updateStreak(stats: GameStats): GameStats {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (stats.lastPlayedDate === today) {
    return stats;
  } else if (stats.lastPlayedDate === yesterday) {
    return {
      ...stats,
      currentStreak: stats.currentStreak + 1,
      lastPlayedDate: today,
    };
  } else {
    return { ...stats, currentStreak: 1, lastPlayedDate: today };
  }
}

export function checkUnlocks(stats: GameStats): GameStats {
  const unlocked = [...stats.unlockedThemes];
  const effects = [...stats.unlockedEffects];

  if (stats.bestScore >= 20 && !effects.includes("glow_trail")) {
    effects.push("glow_trail");
  }
  if (stats.bestScore >= 50 && !effects.includes("pulse")) {
    effects.push("pulse");
  }
  if (stats.bestScore >= 100 && !unlocked.includes("gold")) {
    unlocked.push("gold");
  }
  if (stats.bestScore >= 50 && !unlocked.includes("retro")) {
    unlocked.push("retro");
  }

  return { ...stats, unlockedThemes: unlocked, unlockedEffects: effects };
}

export function computeFocusLevel(stats: GameStats): number {
  const avgReaction =
    stats.reactionCount > 0
      ? stats.totalReactionTime / stats.reactionCount
      : 999;
  if (avgReaction < 80) return 10;
  if (avgReaction < 100) return 9;
  if (avgReaction < 120) return 8;
  if (avgReaction < 150) return 7;
  if (avgReaction < 180) return 6;
  if (avgReaction < 220) return 5;
  if (avgReaction < 270) return 4;
  if (avgReaction < 330) return 3;
  if (avgReaction < 400) return 2;
  return 1;
}
