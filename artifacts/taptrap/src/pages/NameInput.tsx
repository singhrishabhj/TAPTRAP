import { useState } from "react";
import { motion } from "framer-motion";
import { playTap, playSuccess } from "@/lib/audio";

interface Props {
  onSubmit: (name: string) => void;
  soundEnabled: boolean;
}

export default function NameInput({ onSubmit, soundEnabled }: Props) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (soundEnabled) playSuccess(0.4);
    setSubmitted(true);
    setTimeout(() => onSubmit(trimmed), 600);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="crt-grain fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(270 100% 65% / 0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: submitted ? 0 : 1, y: submitted ? -20 : 0 }}
        transition={{ duration: submitted ? 0.4 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="mb-2 font-mono font-bold tracking-widest text-3xl"
          style={{
            color: 'hsl(270 100% 75%)',
            textShadow: '0 0 20px hsl(270 100% 70% / 0.6)',
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          TAPTRAP
        </motion.div>

        <p
          className="text-xs font-mono tracking-widest uppercase mb-12"
          style={{ color: 'hsl(220 15% 40%)' }}
        >
          what do they call you?
        </p>

        {/* Input Box */}
        <div className="relative mb-6">
          <input
            data-testid="input-player-name"
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value.slice(0, 16));
              if (soundEnabled && e.target.value.length > name.length) playTap(0.2);
            }}
            onKeyDown={handleKey}
            placeholder="your name"
            maxLength={16}
            autoFocus
            autoComplete="off"
            className="w-full bg-transparent text-center font-mono text-xl tracking-widest outline-none transition-all duration-300"
            style={{
              color: 'hsl(270 100% 80%)',
              borderBottom: `2px solid ${name.length > 0 ? 'hsl(270 100% 65%)' : 'hsl(220 15% 20%)'}`,
              paddingBottom: '12px',
              caretColor: 'hsl(270 100% 65%)',
              boxShadow: name.length > 0 ? '0 2px 0 0 hsl(270 100% 65% / 0.3)' : 'none',
            }}
          />
          {name.length > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-full"
              style={{ background: 'hsl(270 100% 65%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(name.length / 16) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          data-testid="button-submit-name"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="relative w-full py-4 font-mono text-sm tracking-widest uppercase transition-all duration-300 rounded-xl overflow-hidden"
          style={{
            background: name.trim()
              ? 'linear-gradient(135deg, hsl(270 100% 25%), hsl(270 100% 35%))'
              : 'transparent',
            border: `1px solid ${name.trim() ? 'hsl(270 100% 65% / 0.5)' : 'hsl(220 15% 15%)'}`,
            color: name.trim() ? 'hsl(270 100% 85%)' : 'hsl(220 15% 30%)',
            boxShadow: name.trim() ? '0 0 20px hsl(270 100% 65% / 0.2)' : 'none',
          }}
          whileTap={name.trim() ? { scale: 0.97 } : {}}
          animate={name.trim() ? {
            boxShadow: [
              '0 0 20px hsl(270 100% 65% / 0.2)',
              '0 0 30px hsl(270 100% 65% / 0.4)',
              '0 0 20px hsl(270 100% 65% / 0.2)',
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          let's go →
        </motion.button>

        <p
          className="mt-6 text-xs"
          style={{ color: 'hsl(220 15% 25%)' }}
        >
          stored locally · no account needed
        </p>
      </motion.div>
    </div>
  );
}
