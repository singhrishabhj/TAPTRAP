import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playBass } from "@/lib/audio";

interface Props {
  onComplete: () => void;
  soundEnabled: boolean;
}

export default function SplashScreen({ onComplete, soundEnabled }: Props) {
  const [phase, setPhase] = useState<'intro' | 'tagline' | 'fade'>('intro');

  useEffect(() => {
    if (soundEnabled) {
      setTimeout(() => playBass(0.3), 300);
    }

    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => setPhase('fade'), 2200);
    const t3 = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, soundEnabled]);

  return (
    <div
      className="crt-grain scanline fixed inset-0 flex flex-col items-center justify-center bg-background cursor-pointer z-50"
      onClick={onComplete}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(270 100% 65%) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, hsl(320 100% 65%) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="particle absolute w-1 h-1 rounded-full"
          style={{
            background: `hsl(${270 + i * 15} 100% 70%)`,
            left: `${10 + i * 11}%`,
            top: `${20 + (i % 3) * 20}%`,
            '--duration': `${4 + i * 0.7}s`,
            '--delay': `${i * 0.3}s`,
            opacity: 0.4,
          } as React.CSSProperties}
        />
      ))}

      <AnimatePresence>
        {phase !== 'fade' && (
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Main Title */}
            <motion.div
              className="relative mb-2"
              animate={{
                textShadow: [
                  '0 0 20px hsl(270 100% 70% / 0.8), 0 0 40px hsl(270 100% 70% / 0.4)',
                  '0 0 30px hsl(270 100% 70% / 1), 0 0 60px hsl(270 100% 70% / 0.6)',
                  '0 0 20px hsl(270 100% 70% / 0.8), 0 0 40px hsl(270 100% 70% / 0.4)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <h1
                className="font-mono font-bold tracking-widest"
                style={{
                  fontSize: 'clamp(3rem, 15vw, 6rem)',
                  color: 'hsl(270 100% 75%)',
                  letterSpacing: '0.15em',
                }}
              >
                TAP<span style={{ color: 'hsl(320 100% 70%)' }}>TRAP</span>
              </h1>
            </motion.div>

            {/* Tagline */}
            <AnimatePresence>
              {(phase === 'tagline' || phase === 'fade') && (
                <motion.p
                  className="font-mono text-sm tracking-[0.3em] uppercase"
                  style={{ color: 'hsl(220 15% 50%)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  you were so close.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Subtitle */}
            <motion.p
              className="mt-8 text-xs tracking-widest uppercase"
              style={{ color: 'hsl(220 15% 30%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'tagline' ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Made for focus &amp; reflex
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to skip */}
      <motion.p
        className="absolute bottom-8 text-xs tracking-widest uppercase"
        style={{ color: 'hsl(220 15% 25%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        tap to skip
      </motion.p>
    </div>
  );
}
