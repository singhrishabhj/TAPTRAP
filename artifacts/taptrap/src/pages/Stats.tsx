import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Zap, Target, Calendar, TrendingUp, Star } from "lucide-react";
import { type GameStats, computeFocusLevel } from "@/lib/storage";

interface Props {
  stats: GameStats;
  onClose: () => void;
}

const FOCUS_LABELS = [
  '', 'Beginner', 'Aware', 'Steady', 'Focused', 'Sharp',
  'Precise', 'Elite', 'Master', 'Apex', 'Transcendent'
];

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono uppercase tracking-widest truncate" style={{ color: 'hsl(220 15% 35%)' }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs font-mono" style={{ color: 'hsl(220 15% 40%)' }}>{sub}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-mono font-bold text-lg" style={{ color: 'hsl(210 40% 88%)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function StatsScreen({ stats, onClose }: Props) {
  const focusLevel = computeFocusLevel(stats);
  const focusLabel = FOCUS_LABELS[Math.min(focusLevel, 10)];
  const avgReaction = stats.reactionCount > 0
    ? Math.round(stats.totalReactionTime / stats.reactionCount)
    : 0;

  const unlockedBadges = [
    stats.unlockedEffects.includes('glow_trail') && { label: 'Glow Trail', color: 'hsl(270 100% 65%)' },
    stats.unlockedEffects.includes('pulse') && { label: 'Pulse', color: 'hsl(320 100% 65%)' },
    stats.unlockedThemes.includes('retro') && { label: 'Retro Theme', color: 'hsl(140 100% 55%)' },
    stats.unlockedThemes.includes('gold') && { label: 'Gold Theme', color: 'hsl(45 100% 60%)' },
  ].filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        data-testid="screen-stats"
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
              STATS
            </h2>
            <button
              data-testid="button-close-stats"
              onClick={onClose}
              className="p-2 rounded-lg transition-all active:scale-95"
              style={{ color: 'hsl(220 15% 40%)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {/* Focus Level Badge */}
            <div
              className="mb-5 p-4 rounded-2xl text-center"
              style={{
                background: 'linear-gradient(135deg, hsl(270 100% 10%), hsl(270 100% 15%))',
                border: '1px solid hsl(270 100% 65% / 0.2)',
              }}
            >
              <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'hsl(220 15% 40%)' }}>
                Focus Level
              </p>
              <p
                className="font-mono font-bold text-3xl"
                style={{
                  color: 'hsl(270 100% 75%)',
                  textShadow: '0 0 20px hsl(270 100% 70% / 0.5)',
                }}
                data-testid="text-focus-level"
              >
                {focusLevel}
              </p>
              <p className="font-mono text-sm mt-1" style={{ color: 'hsl(270 100% 60%)' }}>
                {focusLabel}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-col gap-1.5 mb-5">
              <StatCard
                icon={<Trophy size={16} />}
                label="Best Score"
                value={stats.bestScore}
                color="hsl(45 100% 60%)"
              />
              <StatCard
                icon={<Target size={16} />}
                label="Total Plays"
                value={stats.totalPlays}
                color="hsl(270 100% 65%)"
              />
              <StatCard
                icon={<Zap size={16} />}
                label="Avg Reaction"
                value={avgReaction > 0 ? `${avgReaction}ms` : '—'}
                color="hsl(320 100% 65%)"
              />
              <StatCard
                icon={<Calendar size={16} />}
                label="Day Streak"
                value={`${stats.currentStreak}d`}
                color="hsl(140 100% 55%)"
              />
              <StatCard
                icon={<TrendingUp size={16} />}
                label="Reaction Score"
                value={stats.reactionCount}
                sub="taps measured"
                color="hsl(200 100% 60%)"
              />
            </div>

            {/* Unlocked Badges */}
            {unlockedBadges.length > 0 && (
              <>
                <p className="text-xs font-mono uppercase tracking-widest mb-2 px-1" style={{ color: 'hsl(220 15% 30%)' }}>
                  Unlocked
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {unlockedBadges.map((badge, i) => badge && (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono"
                      style={{
                        background: `${badge.color}22`,
                        border: `1px solid ${badge.color}44`,
                        color: badge.color,
                      }}
                    >
                      <Star size={10} />
                      {badge.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Progression hints */}
            <p className="text-xs font-mono uppercase tracking-widest mb-2 px-1" style={{ color: 'hsl(220 15% 30%)' }}>
              Next Unlocks
            </p>
            <div className="flex flex-col gap-1.5">
              {!stats.unlockedEffects.includes('glow_trail') && (
                <div className="flex items-center justify-between px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed hsl(220 15% 12%)' }}>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 35%)' }}>Glow Trail</span>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 25%)' }}>Score 20</span>
                </div>
              )}
              {!stats.unlockedEffects.includes('pulse') && (
                <div className="flex items-center justify-between px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed hsl(220 15% 12%)' }}>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 35%)' }}>Pulse + Zen Mode</span>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 25%)' }}>Score 50</span>
                </div>
              )}
              {!stats.unlockedThemes.includes('gold') && (
                <div className="flex items-center justify-between px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed hsl(220 15% 12%)' }}>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 35%)' }}>Gold Theme</span>
                  <span className="font-mono text-xs" style={{ color: 'hsl(220 15% 25%)' }}>Score 100</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
