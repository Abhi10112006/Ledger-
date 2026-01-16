
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  activeTheme: any; // User's current theme
}

const DEMO_THEMES = [
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30' },
  { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' }
];

const SystemBoot: React.FC<Props> = ({ onComplete, activeTheme }) => {
  const [terminalText, setTerminalText] = useState('');
  const [themeIndex, setThemeIndex] = useState(0);
  const [phase, setPhase] = useState<'text' | 'logo'>('text');

  // Theme Cycle - Only runs during the 'text' phase
  useEffect(() => {
    if (phase === 'logo') return;

    const interval = setInterval(() => {
        setThemeIndex(prev => (prev + 1) % DEMO_THEMES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  // Determine Display Theme: 
  // - Processing Phase: Cycle through demo themes
  // - Logo Phase: Lock to user's actual theme
  const currentTheme = phase === 'logo' ? activeTheme : DEMO_THEMES[themeIndex];

  // Boot Sequence
  useEffect(() => {
    const sequence = [
      "INITIALIZING CORE...",
      "LOADING NEURAL TRUST ENGINE...",
      "SYNCING INDEXED_DB...",
      "SYSTEM ONLINE."
    ];
    
    let step = 0;
    const textInterval = setInterval(() => {
      if (step < sequence.length) {
        setTerminalText(sequence[step]);
        step++;
      } else {
        clearInterval(textInterval);
        setPhase('logo');
        
        // Hold logo for a moment then finish
        setTimeout(() => {
            onComplete();
        }, 1200);
      }
    }, 400);

    return () => clearInterval(textInterval);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 overflow-hidden"
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <motion.div 
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] ${currentTheme.bg} blur-[120px] opacity-20 pointer-events-none rounded-full transition-colors duration-500`}
      />

      <AnimatePresence mode="wait">
        {phase === 'text' && (
          <motion.div 
            key="boot-text"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center space-y-8 z-10"
          >
             <div className="relative">
                <div className={`w-20 h-20 rounded-2xl border-2 ${currentTheme.border} flex items-center justify-center animate-pulse transition-colors duration-500 bg-slate-900/50 backdrop-blur-md`}>
                   <Terminal className={`w-10 h-10 ${currentTheme.text} transition-colors duration-500`} />
                </div>
                {/* Scanning line effect */}
                <motion.div 
                  initial={{ top: 0 }} 
                  animate={{ top: "100%" }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className={`absolute left-0 right-0 h-0.5 ${currentTheme.bg} shadow-[0_0_15px_currentColor] opacity-70 transition-colors duration-500`}
                />
             </div>
             <p className="font-mono text-xs text-slate-400 tracking-[0.2em] uppercase animate-pulse">{terminalText}</p>
          </motion.div>
        )}

        {phase === 'logo' && (
          <motion.div 
            key="boot-logo"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center z-10"
          >
            <div className="w-32 h-32 bg-slate-900/80 backdrop-blur-xl rounded-[3rem] flex items-center justify-center border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 ring-1 ring-white/5">
                <ShieldCheck className={`w-16 h-16 ${currentTheme.text} drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-colors duration-500`} />
            </div>
            <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-3xl font-black tracking-tighter text-white"
            >
                ABHI'S LEDGER
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-0 right-0 text-center">
         <p className="text-[10px] text-slate-600 font-mono">v1.0 // SECURE CONNECTION</p>
      </div>
    </motion.div>
  );
};

export default SystemBoot;
