import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart2 } from "lucide-react";
import {
  getDotPosition,
  getSpeedForScore,
  getPatternForScore,
  generateTapZones,
  generateFakeZones,
  checkTapZone,
  type Pattern,
  type ZoneArea,
  type DotPosition,
} from "@/lib/gameEngine";
import { playTap, playFail, playNearMiss, playSuccess, triggerHaptic, triggerHapticStrong } from "@/lib/audio";
import { type GameSettings } from "@/lib/storage";

interface Props {
  playerName: string;
  bestScore: number;
  settings: GameSettings;
  onGameOver: (score: number, timingError: number, reactionTime: number) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  gameMode: 'endless' | 'zen';
}

const ARENA_RADIUS = 130;
const DOT_SIZE = 18;
const GHOST_MAX = 25;

const motivationalTexts = [
  "Again.", "You had it.", "Don't stop.", "So close.", "One more.",
  "Focus.", "Almost.", "Reset.", "Breathe.", "Try again.",
  "You felt that.", "Next time.", "Lock in.", "Stay sharp."
];

export default function MainGame({
  playerName, bestScore, settings, onGameOver, onOpenSettings, onOpenStats, gameMode
}: Props) {
  const [score, setScore] = useState(0);
  const [angle, setAngle] = useState(0);
  const [pattern, setPattern] = useState<Pattern>('circular');
  const [tapZones, setTapZones] = useState<ZoneArea[]>([]);
  const [fakeZones, setFakeZones] = useState<ZoneArea[]>([]);
  const [ghostTrail, setGhostTrail] = useState<DotPosition[]>([]);
  const [isAlive, setIsAlive] = useState(true);
  const [nearMissText, setNearMissText] = useState('');
  const [showNearMiss, setShowNearMiss] = useState(false);
  const [showAlmostBest, setShowAlmostBest] = useState(false);
  const [motText] = useState(() => motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)]);
  const [tapFlash, setTapFlash] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [slowMo, setSlowMo] = useState(false);

  const angleRef = useRef(0);
  const scoreRef = useRef(0);
  const isAliveRef = useRef(true);
  const tapZonesRef = useRef<ZoneArea[]>([]);
  const tapTime = useRef<number>(0);
  const roundStartTime = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);
  const phase = useRef(0);
  const lastAngle = useRef(0);

  // Setup tap zones whenever score changes
  useEffect(() => {
    const s = scoreRef.current;
    const p = getPatternForScore(s);
    setPattern(p);
    const zones = generateTapZones(s, p, angleRef.current, gameMode === 'zen');
    const fakes = generateFakeZones(s, zones);
    tapZonesRef.current = zones;
    setTapZones(zones);
    setFakeZones(fakes);
  }, [score, gameMode]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) {
      setIsStarted(true);
      roundStartTime.current = Date.now();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 600);
    return () => clearTimeout(t);
  }, [countdown]);

  // Game loop
  useEffect(() => {
    if (!isStarted) return;

    let lastTime = performance.now();

    function tick(now: number) {
      if (!isAliveRef.current) return;

      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const speed = getSpeedForScore(scoreRef.current, gameMode === 'zen');
      const slowFactor = slowMo ? 0.3 : 1;
      angleRef.current += speed * slowFactor * (dt / 16);
      phase.current += 0.02 * slowFactor;

      const dotPos = getDotPosition(angleRef.current, pattern, phase.current);

      setAngle(angleRef.current);

      if (settings.ghostTrail) {
        setGhostTrail(prev => {
          const next = [...prev, dotPos];
          return next.slice(-GHOST_MAX);
        });
      }

      lastAngle.current = angleRef.current;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isStarted, pattern, settings.ghostTrail, gameMode, slowMo]);

  const handleTap = useCallback(() => {
    if (!isAliveRef.current || !isStarted) return;

    const now = Date.now();
    const reactionTime = now - tapTime.current;
    tapTime.current = now;

    if (settings.haptic) triggerHaptic();

    const currentAngle = angleRef.current;
    const zones = tapZonesRef.current;
    const fakeHit = checkTapZone(currentAngle, fakeZones, 0.05);
    const hit = checkTapZone(currentAngle, zones, 0);
    const nearHit = !hit && checkTapZone(currentAngle, zones, 0.18);

    if (hit && !fakeHit) {
      // Correct tap
      if (settings.sound) playSuccess(0.4);
      if (settings.haptic) triggerHaptic();
      setTapFlash(true);
      setTimeout(() => setTapFlash(false), 200);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 300);

      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);

      if (bestScore > 0 && newScore === bestScore - 1) {
        setShowAlmostBest(true);
        setTimeout(() => setShowAlmostBest(false), 2500);
      }

      tapTime.current = now;
    } else if (nearHit && !fakeHit) {
      // Near miss
      if (settings.sound) playNearMiss(0.4);
      setSlowMo(true);
      setTimeout(() => setSlowMo(false), 800);

      const errorMs = Math.abs(reactionTime - 300);
      setNearMissText(`${(errorMs / 1000).toFixed(2)}s too ${reactionTime < 300 ? 'early' : 'late'}`);
      setShowNearMiss(true);
      setTimeout(() => setShowNearMiss(false), 1800);

      isAliveRef.current = false;
      setIsAlive(false);
      if (settings.sound) playFail(0.5);
      if (settings.haptic) triggerHapticStrong();
      setTimeout(() => {
        onGameOver(scoreRef.current, errorMs, reactionTime);
      }, 600);
    } else {
      // Wrong tap
      if (settings.sound) playFail(0.5);
      if (settings.haptic) triggerHapticStrong();

      const errorMs = 500;
      isAliveRef.current = false;
      setIsAlive(false);
      setTimeout(() => {
        onGameOver(scoreRef.current, errorMs, reactionTime);
      }, 400);
    }
  }, [isStarted, fakeZones, settings, bestScore, onGameOver]);

  const dotPos = getDotPosition(angle, pattern, phase.current);
  const themePrimary = settings.theme === 'gold' ? 'hsl(45 100% 60%)' :
    settings.theme === 'retro' ? 'hsl(140 100% 55%)' : 'hsl(270 100% 70%)';
  const themeGlow = settings.theme === 'gold' ? 'hsl(45 100% 60% / 0.5)' :
    settings.theme === 'retro' ? 'hsl(140 100% 55% / 0.5)' : 'hsl(270 100% 70% / 0.5)';

  return (
    <div
      data-testid="game-main"
      className="crt-grain scanline fixed inset-0 flex flex-col bg-background overflow-hidden"
      onClick={handleTap}
      style={{ cursor: 'none' }}
    >
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${themeGlow.replace('0.5', '0.06')} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            transform: `translate(-50%, -50%) scale(${1 + score * 0.02})`,
          }}
        />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-2 relative z-10">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'hsl(220 15% 35%)' }}>
            {playerName}
          </p>
          {gameMode === 'zen' && (
            <span className="text-xs font-mono" style={{ color: 'hsl(140 100% 55%)' }}>zen mode</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'hsl(220 15% 35%)' }}>best</p>
            <p className="text-sm font-mono font-bold" style={{ color: 'hsl(220 15% 45%)' }}>
              {Math.max(bestScore, score)}
            </p>
          </div>
          <button
            data-testid="button-open-stats"
            onClick={e => { e.stopPropagation(); onOpenStats(); }}
            className="p-2 rounded-lg glass transition-all active:scale-95"
          >
            <BarChart2 size={16} style={{ color: 'hsl(220 15% 40%)' }} />
          </button>
          <button
            data-testid="button-open-settings"
            onClick={e => { e.stopPropagation(); onOpenSettings(); }}
            className="p-2 rounded-lg glass transition-all active:scale-95"
          >
            <Settings size={16} style={{ color: 'hsl(220 15% 40%)' }} />
          </button>
        </div>
      </div>

      {/* Score display */}
      <div className="text-center py-2 relative z-10">
        <motion.div
          className="font-mono font-bold"
          style={{
            fontSize: 'clamp(3rem, 18vw, 6rem)',
            color: tapFlash ? themePrimary : 'hsl(210 40% 90%)',
            textShadow: tapFlash ? `0 0 30px ${themeGlow}` : 'none',
            lineHeight: 1,
          }}
          animate={scoreAnim ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          data-testid="text-score"
        >
          {score}
        </motion.div>
      </div>

      {/* Game Arena */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div
          className="relative"
          style={{ width: ARENA_RADIUS * 2 + 60, height: ARENA_RADIUS * 2 + 60 }}
        >
          <svg
            width={ARENA_RADIUS * 2 + 60}
            height={ARENA_RADIUS * 2 + 60}
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            {/* Arena track circle */}
            <circle
              cx={ARENA_RADIUS + 30}
              cy={ARENA_RADIUS + 30}
              r={ARENA_RADIUS}
              fill="none"
              stroke="hsl(220 15% 10%)"
              strokeWidth="2"
            />

            {/* Zen mode: show tap zones visually */}
            {gameMode === 'zen' && tapZones.map((zone, i) => (
              <path
                key={i}
                d={describeArc(ARENA_RADIUS + 30, ARENA_RADIUS + 30, ARENA_RADIUS, zone.startAngle, zone.endAngle)}
                fill="none"
                stroke={`hsl(140 100% 55% / 0.3)`}
                strokeWidth="8"
                strokeLinecap="round"
              />
            ))}

            {/* Ghost trail */}
            {settings.ghostTrail && ghostTrail.map((pos, i) => (
              <circle
                key={i}
                cx={ARENA_RADIUS + 30 + pos.x}
                cy={ARENA_RADIUS + 30 + pos.y}
                r={3 * (i / ghostTrail.length)}
                fill={themePrimary}
                opacity={(i / ghostTrail.length) * 0.3}
              />
            ))}

            {/* Main dot */}
            {isAlive && (
              <>
                {/* Glow ring */}
                {settings.unlockedEffects?.includes?.('glow_trail') && (
                  <circle
                    cx={ARENA_RADIUS + 30 + dotPos.x}
                    cy={ARENA_RADIUS + 30 + dotPos.y}
                    r={DOT_SIZE * 1.5}
                    fill={`${themePrimary.replace(')', ' / 0.1)')}`}
                  />
                )}
                <circle
                  cx={ARENA_RADIUS + 30 + dotPos.x}
                  cy={ARENA_RADIUS + 30 + dotPos.y}
                  r={DOT_SIZE / 2}
                  fill={themePrimary}
                  filter={`drop-shadow(0 0 6px ${themeGlow})`}
                />
              </>
            )}
          </svg>

          {/* Tap Flash ring */}
          {tapFlash && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: themePrimary }}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {!isStarted && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              key={countdown}
              className="font-mono font-bold"
              style={{
                fontSize: 'clamp(5rem, 25vw, 10rem)',
                color: themePrimary,
                textShadow: `0 0 40px ${themeGlow}`,
              }}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {countdown === 0 ? 'GO' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Near miss feedback */}
      <AnimatePresence>
        {showNearMiss && (
          <motion.div
            className="absolute inset-x-0 top-1/3 flex flex-col items-center pointer-events-none z-30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p
              className="font-mono font-bold text-2xl tracking-widest"
              style={{
                color: 'hsl(45 100% 60%)',
                textShadow: '0 0 20px hsl(45 100% 60% / 0.8)',
              }}
            >
              SO CLOSE
            </p>
            <p
              className="font-mono text-sm mt-1"
              style={{ color: 'hsl(220 15% 50%)' }}
            >
              {nearMissText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Almost beat best */}
      <AnimatePresence>
        {showAlmostBest && (
          <motion.div
            className="absolute inset-x-0 top-20 flex items-center justify-center pointer-events-none z-30"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p
              className="font-mono text-sm px-4 py-2 rounded-full glass"
              style={{ color: 'hsl(270 100% 75%)' }}
            >
              almost beat your best ({bestScore})
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom hint */}
      {isStarted && score === 0 && (
        <motion.div
          className="absolute bottom-8 inset-x-0 text-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'hsl(220 15% 25%)' }}>
            tap when the dot is in position
          </p>
        </motion.div>
      )}
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}
