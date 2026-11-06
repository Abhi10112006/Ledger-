import React, { useState } from 'react';
import {
  X, Compass, BookOpen, ChevronRight, CheckCircle2,
  PlusCircle, RefreshCw, QrCode, ShieldCheck, Sparkles, ChevronDown
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

const FAQ_ITEMS = [
  {
    icon: <PlusCircle size={20} color="#10B981" />,
    title: 'How to Record a New Loan',
    summary: 'Tap the green Plus (+) button to start.',
    detail: 'Tap the green Plus (+) button at the bottom of the screen. Enter your friend’s name (or select them from your phone contacts), type the amount, pick the date, and optionally add a return date or interest rate. Tap "Save Deal" to record it.',
  },
  {
    icon: <RefreshCw size={20} color="#3B82F6" />,
    title: 'How to Record Repayments',
    summary: 'Partial or full payments are easy.',
    detail: 'When a friend pays you back, tap their name on the home screen to open their profile. Then tap "Record Repayment", enter the amount they paid, and save. The balance and progress bar update automatically.',
  },
  {
    icon: <QrCode size={20} color="#EC4899" />,
    title: 'How to Request Money with UPI QR',
    summary: 'Show an instant payment QR code.',
    detail: 'Open any friend’s profile and tap the "UPI QR" button. If you configured your UPI ID in Settings, you can enter the amount to collect. A dynamic QR code will appear that your friend can scan with any UPI app (GPay, PhonePe, Paytm) to pay you directly.',
  },
  {
    icon: <ShieldCheck size={20} color="#8B5CF6" />,
    title: 'How Backups & Privacy Work',
    summary: '100% offline and encrypted.',
    detail: 'Your data is stored strictly on your phone — not on any cloud server. To make a backup, open Menu > Backup & Vault, and tap "Back Up Now". This saves an encrypted file to your phone storage so you can safely restore your accounts anytime or move them to a new device.',
  },
];

const TutorialSelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectInteractive,
  activeTheme,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'guide'>('tour');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
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
            background: 'rgba(0, 0, 0, 0.72)',
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
            maxWidth: 500,
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
              height: 160,
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
                Learn how Ledger works and manage loans with ease
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

          {/* iOS Segmented Control */}
          <div style={{ padding: '0 22px 16px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(120, 120, 128, 0.16)',
                borderRadius: 12,
                padding: 3,
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  haptic('selection');
                  setActiveTab('tour');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: activeTab === 'tour' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  color: activeTab === 'tour' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'tour' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <Compass size={15} />
                <span>Interactive Tour</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic('selection');
                  setActiveTab('guide');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: activeTab === 'guide' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  color: activeTab === 'guide' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'guide' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <BookOpen size={15} />
                <span>Easy Guide</span>
              </button>
            </div>
          </div>

          {/* TAB 1: INTERACTIVE TOUR */}
          {activeTab === 'tour' && (
            <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
              {/* Hero Banner Card */}
              <div
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: 20,
                  padding: '20px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
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
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                      Guided Screen Walkthrough
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(235, 235, 245, 0.6)', lineHeight: 1.4 }}>
                      Take a quick 1-minute visual tour around your screen to see where every feature lives.
                    </p>
                  </div>
                </div>

                {/* Feature Bullet Points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0 18px' }}>
                  {[
                    'Live dashboard with total money to collect & recovery stats',
                    'Fast contact search by name or phone number',
                    'Adding new loans with return dates & optional interest',
                    'Viewing friend profiles & recording partial payments',
                    'Customizing themes, OLED black mode & biometric lock',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} style={{ color: activeTheme?.hex || '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: 'rgba(235, 235, 245, 0.75)' }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Primary Action Button */}
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
                    height: 46,
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
                  }}
                >
                  <Compass size={18} />
                  <span>Start Interactive Tour</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* TAB 2: EASY GUIDE & FAQ */}
          {activeTab === 'guide' && (
            <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
              {FAQ_ITEMS.map((item, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    initial={false}
                    style={{
                      background: cardBg,
                      border: cardBorder,
                      borderRadius: 18,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div
                      onClick={() => {
                        haptic('selection');
                        setExpandedFaq(isExpanded ? null : idx);
                      }}
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.5)', marginTop: 2 }}>
                            {item.summary}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: 'rgba(235, 235, 245, 0.5)',
                        }}
                      >
                        <ChevronDown size={17} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            padding: '0 16px 14px',
                            borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <p
                            style={{
                              margin: '10px 0 0',
                              fontSize: 13,
                              lineHeight: 1.5,
                              color: 'rgba(235, 235, 245, 0.75)',
                            }}
                          >
                            {item.detail}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TutorialSelectionModal;
