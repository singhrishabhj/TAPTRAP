import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Music, BellOff, Smartphone, Eye, MessageSquare, Trash2, User } from "lucide-react";
import { type GameSettings, type GameStats } from "@/lib/storage";

interface Props {
  settings: GameSettings;
  stats: GameStats;
  onUpdate: (settings: GameSettings) => void;
  onClose: () => void;
  onResetData: () => void;
  onChangeName: () => void;
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}

function ToggleRow({ icon, label, value, onChange, testId }: ToggleRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: 'hsl(220 15% 40%)' }}>{icon}</span>
        <span className="font-mono text-sm" style={{ color: 'hsl(210 40% 80%)' }}>{label}</span>
      </div>
      <button
        data-testid={testId}
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all duration-300"
        style={{
          background: value ? 'linear-gradient(135deg, hsl(270 100% 40%), hsl(270 100% 55%))' : 'hsl(220 15% 12%)',
          boxShadow: value ? '0 0 10px hsl(270 100% 65% / 0.3)' : 'none',
        }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
          style={{
            background: value ? 'hsl(270 100% 90%)' : 'hsl(220 15% 30%)',
            left: value ? 'calc(100% - 22px)' : '2px',
          }}
        />
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest mb-2 px-1"
      style={{ color: 'hsl(220 15% 30%)' }}>
      {children}
    </p>
  );
}

export default function Settings({ settings, stats, onUpdate, onClose, onResetData, onChangeName }: Props) {
  function update(partial: Partial<GameSettings>) {
    onUpdate({ ...settings, ...partial });
  }

  const themeOptions: Array<{ key: GameSettings['theme']; label: string; color: string; locked: boolean }> = [
    { key: 'neon', label: 'Neon', color: 'hsl(270 100% 65%)', locked: false },
    { key: 'retro', label: 'Retro', color: 'hsl(140 100% 55%)', locked: !stats.unlockedThemes.includes('retro') },
    { key: 'gold', label: 'Gold', color: 'hsl(45 100% 60%)', locked: !stats.unlockedThemes.includes('gold') },
  ];

  return (
    <AnimatePresence>
      <motion.div
        data-testid="screen-settings"
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        />

        <motion.div
          className="relative z-10 w-full max-w-sm rounded-t-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(220 20% 7%) 0%, hsl(220 20% 5%) 100%)',
            border: '1px solid hsl(220 15% 12%)',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
            maxHeight: '90vh',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(220 15% 20%)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="font-mono font-bold text-lg tracking-widest" style={{ color: 'hsl(210 40% 90%)' }}>
              SETTINGS
            </h2>
            <button
              data-testid="button-close-settings"
              onClick={onClose}
              className="p-2 rounded-lg transition-all active:scale-95"
              style={{ color: 'hsl(220 15% 40%)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {/* Audio */}
            <SectionTitle>Audio</SectionTitle>
            <div className="flex flex-col gap-1 mb-5">
              <ToggleRow
                icon={settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                label="Sound Effects"
                value={settings.sound}
                onChange={v => update({ sound: v })}
                testId="toggle-sound"
              />
              <ToggleRow
                icon={settings.music ? <Music size={16} /> : <BellOff size={16} />}
                label="Music"
                value={settings.music}
                onChange={v => update({ music: v })}
                testId="toggle-music"
              />
            </div>

            {/* Feedback */}
            <SectionTitle>Feedback</SectionTitle>
            <div className="flex flex-col gap-1 mb-5">
              <ToggleRow
                icon={<Smartphone size={16} />}
                label="Haptic Feedback"
                value={settings.haptic}
                onChange={v => update({ haptic: v })}
                testId="toggle-haptic"
              />
              <ToggleRow
                icon={<Eye size={16} />}
                label="Ghost Trail"
                value={settings.ghostTrail}
                onChange={v => update({ ghostTrail: v })}
                testId="toggle-ghost"
              />
              <ToggleRow
                icon={<MessageSquare size={16} />}
                label="Motivational Text"
                value={settings.motivationalText}
                onChange={v => update({ motivationalText: v })}
                testId="toggle-motivation"
              />
            </div>

            {/* Performance */}
            <SectionTitle>Performance</SectionTitle>
            <div className="flex gap-2 mb-5">
              {(['high', 'low'] as const).map(mode => (
                <button
                  key={mode}
                  data-testid={`button-graphics-${mode}`}
                  onClick={() => update({ graphicsMode: mode })}
                  className="flex-1 py-3 rounded-xl font-mono text-sm transition-all active:scale-95"
                  style={{
                    background: settings.graphicsMode === mode
                      ? 'linear-gradient(135deg, hsl(270 100% 20%), hsl(270 100% 28%))'
                      : 'rgba(255,255,255,0.03)',
                    border: settings.graphicsMode === mode
                      ? '1px solid hsl(270 100% 65% / 0.3)'
                      : '1px solid transparent',
                    color: settings.graphicsMode === mode ? 'hsl(270 100% 80%)' : 'hsl(220 15% 40%)',
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Theme */}
            <SectionTitle>Theme</SectionTitle>
            <div className="flex gap-2 mb-5">
              {themeOptions.map(theme => (
                <button
                  key={theme.key}
                  data-testid={`button-theme-${theme.key}`}
                  onClick={() => !theme.locked && update({ theme: theme.key })}
                  disabled={theme.locked}
                  className="flex-1 py-3 rounded-xl font-mono text-xs transition-all active:scale-95 relative overflow-hidden"
                  style={{
                    background: settings.theme === theme.key
                      ? `linear-gradient(135deg, ${theme.color}22, ${theme.color}44)`
                      : 'rgba(255,255,255,0.03)',
                    border: settings.theme === theme.key
                      ? `1px solid ${theme.color}66`
                      : '1px solid transparent',
                    color: theme.locked ? 'hsl(220 15% 25%)' : settings.theme === theme.key ? theme.color : 'hsl(220 15% 45%)',
                    boxShadow: settings.theme === theme.key ? `0 0 15px ${theme.color}22` : 'none',
                  }}
                >
                  {theme.locked ? (
                    <span className="text-xs">
                      {theme.key === 'retro' ? '50+' : '100+'}<br />
                      <span style={{ fontSize: '9px' }}>locked</span>
                    </span>
                  ) : theme.label}
                </button>
              ))}
            </div>

            {/* Player */}
            <SectionTitle>Player</SectionTitle>
            <div className="flex flex-col gap-2 mb-5">
              <button
                data-testid="button-change-name"
                onClick={onChangeName}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'hsl(210 40% 80%)' }}
              >
                <User size={16} style={{ color: 'hsl(220 15% 40%)' }} />
                <span className="font-mono text-sm">Change Name</span>
                <span className="ml-auto font-mono text-xs" style={{ color: 'hsl(220 15% 40%)' }}>
                  {stats.playerName}
                </span>
              </button>
              <button
                data-testid="button-reset-data"
                onClick={onResetData}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(220, 50, 50, 0.05)',
                  border: '1px solid rgba(220, 50, 50, 0.1)',
                  color: 'hsl(0 70% 60%)',
                }}
              >
                <Trash2 size={16} />
                <span className="font-mono text-sm">Reset All Data</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
