import React from 'react';
import { Upload } from 'lucide-react';
import { AppSettings } from '../types';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { LogoIcon } from './Logo';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  onLogin: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateSetting?: (key: keyof AppSettings, value: any) => void;
}

const WelcomeScreen: React.FC<Props> = ({
  settings,
  activeTheme: initialTheme,
  onLogin,
  handleImport
}) => {
  const haptic = useHaptics();

  const rawName = settings.userName.split(' ')[0] || 'User';
  const displayName = rawName.replace(/'s$/i, '');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#000', paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}
    >
      {/* Subtle ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '60vh',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${initialTheme.hex}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[320px] px-6 relative z-10 flex flex-col items-center"
      >
        {/* App Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <LogoIcon activeTheme={initialTheme} size="100%" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <h1
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: '-0.03em',
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: 10,
            }}
          >
            Welcome back,{'\n'}
            <span style={{ color: initialTheme.hex }}>{displayName}</span>
          </h1>
          <p
            style={{
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 400,
              color: 'rgba(235,235,245,0.5)',
              letterSpacing: '-0.01em',
            }}
          >
            Your personal ledger awaits.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full space-y-3"
        >
          {/* Primary CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic('medium'); onLogin(); }}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 14,
              background: '#fff',
              color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '-0.01em',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Open Dashboard
          </motion.button>

          {/* Secondary CTA */}
          <motion.label
            whileTap={{ scale: 0.97 }}
            onClick={() => haptic('light')}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(235,235,245,0.7)',
              fontFamily: 'inherit',
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: '-0.01em',
              border: '0.5px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Upload size={16} style={{ opacity: 0.6 }} />
            Restore from Backup
            <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
          </motion.label>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 40,
            fontSize: 12,
            color: 'rgba(235,235,245,0.25)',
            fontWeight: 400,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          Secure · Private · Offline First
        </motion.p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
