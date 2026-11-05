import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../hooks/useHaptics';
import { LogoIcon } from './Logo';

interface Props {
  onComplete: () => void;
  activeTheme: any;
}

const SystemBoot: React.FC<Props> = ({ onComplete, activeTheme }) => {
  const [phase, setPhase] = useState<'logo' | 'exit'>('logo');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => {
        triggerHaptic('boot');
        onComplete();
      }, 450);
    }, 1600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#000' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait">
        {phase === 'logo' && (
          <motion.div
            key="boot-logo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            {/* App icon */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: 22,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <LogoIcon activeTheme={activeTheme} size="100%" />
            </div>

            {/* App name */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                fontWeight: 600,
                fontSize: 17,
                color: 'rgba(235,235,245,0.6)',
                letterSpacing: '-0.01em',
              }}
            >
              Ledger
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SystemBoot;
