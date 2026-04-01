import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Share2, RotateCcw } from "lucide-react";
import { type GameSettings } from "@/lib/storage";

interface Props {
  score: number;
  bestScore: number;
  timingError: number;
  playerName: string;
  settings: GameSettings;
  onRestart: () => void;
  onOpenSettings: () => void;
}

const gameOverTexts = [
  { headline: "Again.", sub: "You know what to do." },
  { headline: "You had it.", sub: "Then you didn't." },
  { headline: "Don't stop.", sub: "Momentum is everything." },
  { headline: "So close.", sub: "It's right there." },
  { headline: "Lock in.", sub: "No distractions." },
  { headline: "Reset.", sub: "Clean slate. Better run." },
  { headline: "Breathe.", sub: "Then go again." },
  { headline: "One more.", sub: "Just one. Promise." },
];

export default function GameOver({
  score, bestScore, timingError, playerName, settings, onRestart, onOpenSettings
}: Props) {
  const isNewBest = score >= bestScore;
  const diff = bestScore - score;
  const errorSec = (timingError / 1000).toFixed(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);

  const textVariant = gameOverTexts[score % gameOverTexts.length];

  useEffect(() => {
    generateShareCanvas();
  }, [score, bestScore, playerName]);

  function generateShareCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 340;

    // Background
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, 600, 340);

    // Gradient overlay
    const grad = ctx.createRadialGradient(300, 170, 0, 300, 170, 280);
    grad.addColorStop(0, 'rgba(120, 60, 220, 0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 340);

    // Title
    ctx.fillStyle = '#b070f0';
    ctx.font = 'bold 28px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAPTRAP', 300, 60);

    // Player name
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText(playerName.toUpperCase(), 300, 90);

    // Score
    ctx.fillStyle = '#f0f0f5';
    ctx.font = 'bold 90px "Space Mono", monospace';
    ctx.fillText(String(score), 300, 200);

    // Best label
    ctx.fillStyle = '#4a5568';
    ctx.font = '13px "Space Mono", monospace';
    ctx.fillText(`BEST: ${Math.max(score, bestScore)}  ·  MISSED BY ${errorSec}s`, 300, 240);

    // CTA
    ctx.fillStyle = '#3d1f6b';
    ctx.font = '12px "Space Mono", monospace';
    ctx.fillText('Can you beat this? → play TapTrap', 300, 300);

    // Border
    ctx.strokeStyle = 'rgba(120, 60, 220, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, 598, 338);
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSharing(true);

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'taptrap-fail.png', { type: 'image/png' });
        const shareData = {
          title: 'My TapTrap score',
          text: `I scored ${score} on TapTrap. Can you beat it? (Best: ${Math.max(score, bestScore)})`,
          files: [file],
        };
        try {
          if (navigator.canShare?.(shareData)) {
            await navigator.share(shareData);
          } else {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'taptrap-fail.png';
            a.click();
          }
        } catch {}
        setSharing(false);
      });
    } catch {
      setSharing(false);
    }
  }

  return (
    <motion.div
      data-testid="screen-game-over"
      className="crt-grain fixed inset-0 flex flex-col items-center justify-center bg-background z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      onClick={onRestart}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(0 80% 55% / 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        {/* New best badge */}
        {isNewBest && (
          <motion.div
            className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(45 100% 25%), hsl(45 100% 35%))',
              border: '1px solid hsl(45 100% 60% / 0.4)',
              boxShadow: '0 0 20px hsl(45 100% 60% / 0.3)',
            }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'hsl(45 100% 70%)' }}>
              ★ new best
            </span>
          </motion.div>
        )}

        {/* Score */}
        <motion.div
          className="font-mono font-bold mb-1"
          style={{
            fontSize: 'clamp(4rem, 22vw, 8rem)',
            color: isNewBest ? 'hsl(45 100% 65%)' : 'hsl(210 40% 90%)',
            textShadow: isNewBest ? '0 0 30px hsl(45 100% 60% / 0.6)' : 'none',
            lineHeight: 1,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          data-testid="text-final-score"
        >
          {score}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="flex items-center justify-center gap-6 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'hsl(220 15% 35%)' }}>
              best
            </p>
            <p className="font-mono font-bold text-base" style={{ color: 'hsl(220 15% 55%)' }}>
              {Math.max(score, bestScore)}
            </p>
          </div>
          <div
            className="w-px h-8 rounded-full"
            style={{ background: 'hsl(220 15% 15%)' }}
          />
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'hsl(220 15% 35%)' }}>
              missed by
            </p>
            <p className="font-mono font-bold text-base" style={{ color: 'hsl(0 80% 65%)' }}>
              {errorSec}s
            </p>
          </div>
          {diff > 0 && diff < 5 && (
            <>
              <div
                className="w-px h-8 rounded-full"
                style={{ background: 'hsl(220 15% 15%)' }}
              />
              <div className="text-center">
                <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'hsl(220 15% 35%)' }}>
                  to best
                </p>
                <p className="font-mono font-bold text-base" style={{ color: 'hsl(45 100% 55%)' }}>
                  -{diff}
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Motivational text */}
        {settings.motivationalText && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p
              className="font-mono font-bold text-xl tracking-wide"
              style={{ color: 'hsl(210 40% 75%)' }}
            >
              {textVariant.headline}
            </p>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: 'hsl(220 15% 40%)' }}
            >
              {textVariant.sub}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            data-testid="button-share"
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass font-mono text-sm tracking-widest uppercase transition-all active:scale-95"
            style={{ color: 'hsl(220 15% 45%)' }}
          >
            <Share2 size={14} />
            {sharing ? 'sharing...' : 'share fail'}
          </button>
          <button
            data-testid="button-restart"
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm tracking-widest uppercase transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(270 100% 20%), hsl(270 100% 30%))',
              border: '1px solid hsl(270 100% 65% / 0.3)',
              color: 'hsl(270 100% 80%)',
              boxShadow: '0 0 20px hsl(270 100% 65% / 0.2)',
            }}
          >
            <RotateCcw size={14} />
            Again
          </button>
        </motion.div>

        {/* Tap anywhere hint */}
        <motion.p
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: 'hsl(220 15% 25%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          tap anywhere to restart
        </motion.p>
      </div>

      {/* Hidden canvas for share image */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
