import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Sparkles, TrendingUp, PlusCircle, Settings, Search, Users,
  ArrowRight, ArrowLeft, X, CheckCircle2, ShieldCheck, HelpCircle,
  Lightbulb, QrCode, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  tourStep: number;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  activeTheme: any;
}

interface StepDefinition {
  id: string;
  title: string;
  desc: string;
  tip?: string;
  targetId: string | null;
  fallbackTargetId?: string;
  icon: React.ReactNode;
}

export const TourOverlay: React.FC<Props> = ({ tourStep, setTourStep, completeTour, activeTheme }) => {
  const haptic = useHaptics();
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  });

  const [tooltipPos, setTooltipPos] = useState<{ top: number; isTopHalf: boolean }>({
    top: 100,
    isTopHalf: false,
  });

  const [hasTarget, setHasTarget] = useState(false);

  const steps: StepDefinition[] = [
    {
      id: 'tour-intro',
      title: 'Welcome to Ledger',
      desc: 'Ledger is your simple, private app to track money lent to or borrowed from friends, family, and colleagues.',
      tip: '100% offline — your data stays strictly on your phone, completely private.',
      icon: <Sparkles size={24} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: null,
    },
    {
      id: 'tour-stats',
      title: 'Your Money at a Glance',
      desc: 'See total money pending to collect, how much you have already recovered, and active loans in real-time.',
      tip: 'Tap the Active card to see which loans are due soon.',
      icon: <TrendingUp size={24} style={{ color: '#30D158' }} />,
      targetId: 'tour-stats',
    },
    {
      id: 'tour-search',
      title: 'Instant Search',
      desc: 'Quickly find any contact or loan record by typing their name or phone number.',
      tip: 'Search filters all names, phone numbers, and notes instantly as you type.',
      icon: <Search size={24} style={{ color: '#0A84FF' }} />,
      targetId: 'tour-search',
    },
    {
      id: 'tour-contacts',
      title: 'Contacts & Histories',
      desc: 'Every friend has a dedicated page showing their complete loan timeline, partial repayments, and trust score.',
      tip: 'Tap any friend to view their ledger, record repayments, or generate UPI requests.',
      icon: <Users size={24} style={{ color: '#BF5AF2' }} />,
      targetId: 'tour-account-row',
      fallbackTargetId: 'tour-contacts-list',
    },
    {
      id: 'tour-add-profile',
      title: 'Record a New Loan',
      desc: 'Whenever you lend money, tap this green Plus (+) button. Enter the friend’s name, amount, date, and optional return date.',
      tip: 'You can pick friends directly from your phone contacts or type a new name.',
      icon: <PlusCircle size={24} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: 'tour-add-profile',
    },
    {
      id: 'tour-menu',
      title: 'Menu, Settings & Backups',
      desc: 'Open the menu anytime to change theme colors, enable Biometric Lock (Fingerprint/Face ID), or save encrypted backups.',
      tip: 'Back up your ledger regularly to phone storage with the Backup & Vault option.',
      icon: <Settings size={24} style={{ color: '#FF9F0A' }} />,
      targetId: 'tour-menu-button',
      fallbackTargetId: 'tour-settings',
    },
    {
      id: 'tour-done',
      title: "You're All Set!",
      desc: 'You now know all the key parts of Ledger. Start recording loans and tracking repayments with complete peace of mind.',
      tip: 'You can restart this tour anytime from Menu > Help & Tutorial.',
      icon: <CheckCircle2 size={26} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: null,
    },
  ];

  const currentStep = tourStep >= 0 && tourStep < steps.length ? steps[tourStep] : null;

  // Locate target and calculate spotlight position
  const updateSpotlight = useCallback(() => {
    if (!currentStep) return;

    if (currentStep.targetId) {
      let targetEl = document.getElementById(currentStep.targetId);
      if (!targetEl && currentStep.fallbackTargetId) {
        targetEl = document.getElementById(currentStep.fallbackTargetId);
      }

      if (targetEl) {
        try {
          const computedStyle = window.getComputedStyle(targetEl);
          if (computedStyle.position !== 'fixed' && computedStyle.position !== 'absolute') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
        } catch {}

        const rect = targetEl.getBoundingClientRect();
        const padding = 8;
        const spotlightTop = Math.max(0, rect.top - padding);
        const spotlightLeft = Math.max(6, rect.left - padding);
        const spotlightWidth = Math.min(window.innerWidth - 12, rect.width + padding * 2);
        const spotlightHeight = rect.height + padding * 2;

        let radius = 18;
        try {
          const rawRadius = parseInt(window.getComputedStyle(targetEl).borderRadius || '18', 10);
          if (!isNaN(rawRadius) && rawRadius > 0) radius = Math.min(32, rawRadius + 4);
        } catch {}

        setSpotlightStyle({
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightWidth,
          height: spotlightHeight,
          opacity: 1,
          borderRadius: radius,
        });

        // Determine tooltip placement: top vs bottom
        const isTopHalf = rect.top < window.innerHeight * 0.48;
        const approxTooltipHeight = 220;
        let calculatedTop: number;

        if (isTopHalf) {
          calculatedTop = rect.bottom + 16;
          // Clamp so it doesn't overflow bottom of screen
          if (calculatedTop + approxTooltipHeight > window.innerHeight - 20) {
            calculatedTop = window.innerHeight - approxTooltipHeight - 20;
          }
        } else {
          calculatedTop = rect.top - approxTooltipHeight - 16;
          // Clamp so it doesn't overflow top of screen
          if (calculatedTop < 20) {
            calculatedTop = rect.bottom + 16;
          }
        }

        setTooltipPos({
          top: Math.max(16, calculatedTop),
          isTopHalf,
        });
        setHasTarget(true);
      } else {
        // Target element not found - fallback to centered card without failing
        setHasTarget(false);
        setSpotlightStyle({
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          opacity: 0,
        });
      }
    } else {
      setHasTarget(false);
      setSpotlightStyle({
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        opacity: 0,
      });
    }
  }, [currentStep]);

  useEffect(() => {
    updateSpotlight();
    const handleResize = () => updateSpotlight();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateSpotlight]);

  if (!currentStep) return null;

  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === steps.length - 1;

  const handleNext = () => {
    haptic('selection');
    if (isLastStep) {
      haptic('success');
      completeTour();
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const handlePrev = () => {
    haptic('selection');
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleEnd = () => {
    haptic('light');
    completeTour();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
      }}
    >
      {/* SPOTLIGHT CUTOUT HOLE */}
      <div
        style={{
          ...spotlightStyle,
          position: 'absolute',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
          border: `2px solid ${activeTheme?.hex || '#10B981'}`,
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.78), 0 0 24px -4px ${activeTheme?.hex || '#10B981'}80`,
          display: hasTarget ? 'block' : 'none',
        }}
      />

      {/* FULLSCREEN / CENTERED CARDS (Intro or Celebration step, or target fallback) */}
      {!hasTarget && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            pointerEvents: 'auto',
          }}
          onClick={handleEnd}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#1C1C1E',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 28,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              padding: '24px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient top glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                height: 120,
                background: `radial-gradient(ellipse at top center, ${activeTheme?.hex || '#10B981'}30 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Header with Icon + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '0.5px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentStep.icon}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(235, 235, 245, 0.7)',
                  }}
                >
                  Step {tourStep + 1} of {steps.length}
                </span>

                <button
                  type="button"
                  onClick={handleEnd}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(235, 235, 245, 0.7)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                }}
              >
                {currentStep.title}
              </h3>

              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: 14,
                  color: 'rgba(235, 235, 245, 0.7)',
                  lineHeight: 1.45,
                }}
              >
                {currentStep.desc}
              </p>

              {/* Helpful Pro-Tip Box */}
              {currentStep.tip && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <Lightbulb size={16} style={{ color: '#FFD60A', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12.5, color: 'rgba(235, 235, 245, 0.65)', lineHeight: 1.35 }}>
                    {currentStep.tip}
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {tourStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(235, 235, 245, 0.65)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 10px',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnd}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(235, 235, 245, 0.45)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '8px 10px',
                  }}
                >
                  Skip
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  height: 42,
                  padding: '0 20px',
                  borderRadius: 14,
                  background: activeTheme?.hex || '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: `0 4px 14px -2px ${activeTheme?.hex || '#FFFFFF'}50`,
                }}
              >
                <span>{isFirstStep ? 'Start Tour' : isLastStep ? 'Get Started' : 'Next'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TARGET-ATTACHED TOOLTIP CARD */}
      {hasTarget && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'none',
            top: tooltipPos.top,
            transition: 'top 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: tooltipPos.isTopHalf ? 10 : -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              width: '100%',
              maxWidth: 360,
              background: 'rgba(28, 28, 30, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 22,
              boxShadow: '0 16px 50px rgba(0, 0, 0, 0.85)',
              padding: '18px 18px 14px',
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {currentStep.icon}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: activeTheme?.hex || '#10B981',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Step {tourStep + 1} of {steps.length}
                  </span>
                  <h4
                    style={{
                      margin: '1px 0 0',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {currentStep.title}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnd}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.6)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            <p
              style={{
                margin: '10px 0 10px 0',
                fontSize: 13,
                color: 'rgba(235, 235, 245, 0.7)',
                lineHeight: 1.4,
              }}
            >
              {currentStep.desc}
            </p>

            {/* Friendly Pro-Tip */}
            {currentStep.tip && (
              <div
                style={{
                  padding: '7px 11px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '0.5px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Lightbulb size={13} style={{ color: '#FFD60A', flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: 'rgba(235, 235, 245, 0.65)', lineHeight: 1.3 }}>
                  {currentStep.tip}
                </span>
              </div>
            )}

            {/* Navigation Controls */}
            <div
              style={{
                paddingTop: 10,
                borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Back / Skip */}
              {tourStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(235, 235, 245, 0.6)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 6px',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnd}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(235, 235, 245, 0.45)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                >
                  Skip
                </button>
              )}

              {/* Step indicator dots */}
              <div style={{ display: 'flex', gap: 5 }}>
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: idx === tourStep ? 14 : 5,
                      height: 5,
                      borderRadius: 3,
                      background: idx === tourStep ? (activeTheme?.hex || '#FFFFFF') : 'rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 10,
                  background: activeTheme?.hex || '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  boxShadow: `0 3px 10px -2px ${activeTheme?.hex || '#FFFFFF'}40`,
                }}
              >
                <span>{isLastStep ? 'Done' : 'Next'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TourOverlay;
