import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/pages/SplashScreen";
import NameInput from "@/pages/NameInput";
import MainGame from "@/pages/MainGame";
import GameOver from "@/pages/GameOver";
import SettingsPanel from "@/pages/Settings";
import StatsScreen from "@/pages/Stats";
import {
  loadStats, saveStats, loadSettings, saveSettings,
  clearAllData, updateStreak, checkUnlocks, computeFocusLevel,
  type GameStats, type GameSettings,
} from "@/lib/storage";

type Screen = 'splash' | 'name' | 'game' | 'gameover' | 'settings' | 'stats';
type GameMode = 'endless' | 'zen';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [lastScore, setLastScore] = useState(0);
  const [lastTimingError, setLastTimingError] = useState(0);
  const [lastReactionTime, setLastReactionTime] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('endless');
  const [gameKey, setGameKey] = useState(0);
  const [settingsReturnTo, setSettingsReturnTo] = useState<Screen>('game');
  const [statsReturnTo, setStatsReturnTo] = useState<Screen>('game');

  useEffect(() => {
    if (stats.bestScore >= 50 && gameMode === 'endless') {
      // zen mode available but stays endless by default
    }
  }, [stats.bestScore, gameMode]);

  const handleSplashComplete = useCallback(() => {
    if (!stats.playerName) {
      setScreen('name');
    } else {
      setScreen('game');
    }
  }, [stats.playerName]);

  const handleNameSubmit = useCallback((name: string) => {
    const updated = { ...stats, playerName: name };
    setStats(updated);
    saveStats(updated);
    setScreen('game');
  }, [stats]);

  const handleGameOver = useCallback((score: number, timingError: number, reactionTime: number) => {
    setLastScore(score);
    setLastTimingError(timingError);
    setLastReactionTime(reactionTime);

    let updated = { ...stats };
    updated.totalPlays = (updated.totalPlays || 0) + 1;

    if (score > updated.bestScore) {
      updated.bestScore = score;
    }

    if (reactionTime > 0 && reactionTime < 2000) {
      updated.totalReactionTime = (updated.totalReactionTime || 0) + reactionTime;
      updated.reactionCount = (updated.reactionCount || 0) + 1;
    }

    updated.focusLevel = computeFocusLevel(updated);
    updated = updateStreak(updated);
    updated = checkUnlocks(updated);

    setStats(updated);
    saveStats(updated);
    setScreen('gameover');
  }, [stats]);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const handleOpenSettings = useCallback((from: Screen = 'game') => {
    setSettingsReturnTo(from);
    setScreen('settings');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setScreen(settingsReturnTo);
  }, [settingsReturnTo]);

  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleOpenStats = useCallback((from: Screen = 'game') => {
    setStatsReturnTo(from);
    setScreen('stats');
  }, []);

  const handleCloseStats = useCallback(() => {
    setScreen(statsReturnTo);
  }, [statsReturnTo]);

  const handleResetData = useCallback(() => {
    clearAllData();
    setStats({
      playerName: '',
      bestScore: 0,
      totalPlays: 0,
      totalReactionTime: 0,
      reactionCount: 0,
      currentStreak: 0,
      lastPlayedDate: '',
      focusLevel: 1,
      unlockedThemes: ['neon'],
      unlockedEffects: [],
    });
    setSettings({
      sound: true,
      music: true,
      haptic: true,
      graphicsMode: 'high',
      theme: 'neon',
      ghostTrail: true,
      motivationalText: true,
    });
    setScreen('splash');
  }, []);

  const handleChangeName = useCallback(() => {
    setScreen('name');
  }, []);

  // Pass unlocked effects to settings for use in game
  const enrichedSettings: GameSettings = {
    ...settings,
    unlockedEffects: stats.unlockedEffects,
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashScreen
            key="splash"
            onComplete={handleSplashComplete}
            soundEnabled={settings.sound}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screen === 'name' && (
          <NameInput
            key="name"
            onSubmit={handleNameSubmit}
            soundEnabled={settings.sound}
          />
        )}
      </AnimatePresence>

      {screen === 'game' && (
        <MainGame
          key={`game-${gameKey}`}
          playerName={stats.playerName}
          bestScore={stats.bestScore}
          settings={enrichedSettings}
          onGameOver={handleGameOver}
          onOpenSettings={() => handleOpenSettings('game')}
          onOpenStats={() => handleOpenStats('game')}
          gameMode={gameMode}
        />
      )}

      <AnimatePresence>
        {screen === 'gameover' && (
          <GameOver
            key="gameover"
            score={lastScore}
            bestScore={stats.bestScore}
            timingError={lastTimingError}
            playerName={stats.playerName}
            settings={settings}
            onRestart={handleRestart}
            onOpenSettings={() => handleOpenSettings('gameover')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'settings' && (
          <SettingsPanel
            key="settings"
            settings={settings}
            stats={stats}
            onUpdate={handleUpdateSettings}
            onClose={handleCloseSettings}
            onResetData={handleResetData}
            onChangeName={handleChangeName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'stats' && (
          <StatsScreen
            key="stats"
            stats={stats}
            onClose={handleCloseStats}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
