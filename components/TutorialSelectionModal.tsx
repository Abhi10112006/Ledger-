import React from 'react';
import {
  X, Compass, CheckCircle2, Sparkles, Shield,
  TrendingUp, Search, Users, PlusCircle, QrCode, RefreshCw, Palette, Type, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectInteractive: () => void;
  activeTheme: any;
  settings?: any;
}

const TOUR_FEATURES = [
  { icon: TrendingUp, label: 'Money at a Glance', desc: 'Real-time pending exposure & recovery stats', color: '#30D158' },
  { icon: Search, label: 'Instant Search', desc: 'Find any contact or note as you type', color: '#0A84FF' },
  { icon: Users, label: 'Smart Profiles', desc: 'Individual client statements & trust score', color: '#BF5AF2' },
  { icon: PlusCircle, label: 'Record New Loans', desc: 'Add loans with custom interest & due dates', color: '#10B981' },
  { icon: QrCode, label: 'Instant UPI QR', desc: 'Fast dynamic payment requests for GPay & PhonePe', color: '#FF453A' },
  { icon: RefreshCw, label: 'Record Repayments', desc: 'Log partial/full returns with digital receipts', color: '#30D158' },
  { icon: Palette, label: 'Themes & OLED Mode', desc: 'Vibrant accent colors & pure battery-saving black', color: '#64D2FF' },
  { icon: Type, label: 'Custom Fonts', desc: 'Inter, JetBrains Mono, Comic Neue, Special Elite', color: '#A78BFA' },
  { icon: Shield, label: 'Offline Backup & Vault', desc: 'Encrypted JSON & Excel dossier export to phone', color: '#10B981' },
  { icon: Lock, label: 'Biometrics & App Lock', desc: 'Protect financial privacy with Fingerprint/Face ID', color: '#FF9F0A' },
];

const TutorialSelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectInteractive,
  activeTheme,
  settings,
}) => {
  const haptic = useHaptics();

  if (!isOpen) return null;

  const isOled = settings?.baseColor === 'oled';
  const sheetBg = isOled ? '#000000' : '#1C1C1E';
  const cardBg = isOled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.06)';
  const cardBorder = isOled ? '0.5px solid rgba(255, 255, 255, 0.1)' : '0.5px solid rgba(255, 255, 255, 0.08)';

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3500,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic('light');
            onClose();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            maxHeight: '92vh',
            background: sheetBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTop: '0.5px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 -16px 50px rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
          className="scrollbar-hide"
        >
          {/* Top ambient color glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: 180,
              background: `radial-gradient(ellipse at top center, ${activeTheme?.hex || '#10B981'}25 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Grabber */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 6, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.25)' }} />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 22px 14px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                }}
              >
                Help & Tutorial
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.55)',
                  letterSpacing: '-0.01em',
                }}
              >
                Interactive feature walkthrough & screen guide
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic('light');
                onClose();
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(235, 235, 245, 0.7)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Main Content */}
          <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
            {/* Hero Card */}
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 22,
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${activeTheme?.hex || '#10B981'}30 0%, ${activeTheme?.hex || '#10B981'}10 100%)`,
                    border: `1px solid ${activeTheme?.hex || '#10B981'}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeTheme?.hex || '#10B981',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: activeTheme?.hex || '#10B981',
                        background: `${activeTheme?.hex || '#10B981'}18`,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      14 Interactive Steps
                    </span>
                  </div>
                  <h3 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Interactive Screen Walkthrough
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(235, 235, 245, 0.6)', lineHeight: 1.4 }}>
                    Take a visual hands-on tour that spotlights every function on your screen with actionable tips.
                  </p>
                </div>
              </div>

              {/* Start Interactive Tour CTA Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic('medium');
                  onClose();
                  setTimeout(() => {
                    onSelectInteractive();
                  }, 250);
                }}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  background: activeTheme?.hex || '#10B981',
                  color: '#000000',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: `0 6px 20px -3px ${activeTheme?.hex || '#10B981'}60`,
                  marginTop: 6,
                }}
              >
                <Compass size={18} />
                <span>Start Interactive Tour</span>
              </motion.button>
            </div>

            {/* Feature Tour Grid / Roadmap */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(235, 235, 245, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 8px 10px',
                }}
              >
                What You'll Explore In The Tour
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {TOUR_FEATURES.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.color,
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                          {item.label}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(235, 235, 245, 0.5)', lineHeight: 1.35 }}>
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy & Safe Guarantee Card */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '0.5px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.75)', lineHeight: 1.4 }}>
                <strong style={{ color: '#FFFFFF' }}>100% Offline & Non-Destructive:</strong> All guided steps use safe simulation and never alter or overwrite your existing accounts.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TutorialSelectionModal;
