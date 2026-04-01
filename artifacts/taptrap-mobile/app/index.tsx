import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Modal } from "react-native";
import {
  loadStats,
  loadSettings,
  saveStats,
  saveSettings,
  updateStreak,
  checkUnlocks,
  computeFocusLevel,
  clearAllData,
  defaultStats,
  defaultSettings,
  type GameStats,
  type GameSettings,
} from "@/lib/storage";
import SplashScreen from "@/components/SplashScreen";
import NameInput from "@/components/NameInput";
import TutorialScreen from "@/components/TutorialScreen";
import MainMenu from "@/components/MainMenu";
import MainGame from "@/components/MainGame";
import GameOver from "@/components/GameOver";
import SettingsScreen from "@/components/SettingsScreen";
import StatsScreen from "@/components/StatsScreen";

type Screen =
  | "splash"
  | "name"
  | "tutorial"
  | "menu"
  | "game"
  | "gameover";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [gameMode, setGameMode] = useState<"endless" | "zen">("endless");
  const [lastScore, setLastScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted data
  useEffect(() => {
    async function init() {
      const [s, cfg] = await Promise.all([loadStats(), loadSettings()]);
      setStats(s);
      setSettings(cfg);
      setIsLoaded(true);
    }
    init();
  }, []);

  function handleSplashComplete() {
    if (!isLoaded) return;
    if (!stats.playerName) {
      setScreen("name");
    } else if (!stats.hasSeenTutorial) {
      setScreen("tutorial");
    } else {
      setScreen("menu");
    }
  }

  function handleNameSubmit(name: string) {
    const updated = { ...stats, playerName: name };
    setStats(updated);
    saveStats(updated);
    setScreen("tutorial");
  }

  function handleTutorialDone() {
    const updated = { ...stats, hasSeenTutorial: true };
    setStats(updated);
    saveStats(updated);
    setScreen("menu");
  }

  function handlePlay(mode: "endless" | "zen") {
    setGameMode(mode);
    setScreen("game");
  }

  const handleGameOver = useCallback(
    async (score: number, _timingError: number, reactionTime: number) => {
      const newBest = score > stats.bestScore;

      let updated: GameStats = {
        ...stats,
        bestScore: newBest ? score : stats.bestScore,
        totalPlays: stats.totalPlays + 1,
        totalReactionTime: stats.totalReactionTime + reactionTime,
        reactionCount: stats.reactionCount + 1,
      };

      updated = updateStreak(updated);
      updated = checkUnlocks(updated);
      updated.focusLevel = computeFocusLevel(updated);

      setStats(updated);
      setLastScore(score);
      setIsNewBest(newBest);
      await saveStats(updated);

      setScreen("gameover");
    },
    [stats]
  );

  const handleRetry = useCallback(() => {
    setScreen("game");
  }, []);

  const handleMainMenu = useCallback(() => {
    setScreen("menu");
  }, []);

  async function handleUpdateSettings(newSettings: GameSettings) {
    setSettings(newSettings);
    await saveSettings(newSettings);
  }

  async function handleClearData() {
    await clearAllData();
    setStats({ ...defaultStats });
    setSettings({ ...defaultSettings });
    setShowSettings(false);
    setScreen("name");
  }

  return (
    <View style={styles.root}>
      {screen === "splash" && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {screen === "name" && (
        <NameInput onSubmit={handleNameSubmit} />
      )}

      {screen === "tutorial" && (
        <TutorialScreen onDone={handleTutorialDone} />
      )}

      {screen === "menu" && (
        <MainMenu
          stats={stats}
          onPlay={handlePlay}
          onOpenSettings={() => setShowSettings(true)}
          onOpenStats={() => setShowStats(true)}
        />
      )}

      {screen === "game" && (
        <MainGame
          playerName={stats.playerName}
          bestScore={stats.bestScore}
          settings={settings}
          onGameOver={handleGameOver}
          onOpenSettings={() => setShowSettings(true)}
          onOpenStats={() => setShowStats(true)}
          gameMode={gameMode}
        />
      )}

      {screen === "gameover" && (
        <GameOver
          score={lastScore}
          bestScore={stats.bestScore}
          playerName={stats.playerName}
          focusLevel={stats.focusLevel}
          isNewBest={isNewBest}
          onRetry={handleRetry}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
          unlockedThemes={stats.unlockedThemes}
          onClearData={handleClearData}
        />
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStats}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStats(false)}
      >
        <StatsScreen
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080a10",
  },
});
