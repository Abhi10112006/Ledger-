import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Sparkles, TrendingUp, PlusCircle, Settings, Search, Users,
  ArrowRight, ArrowLeft, X, CheckCircle2, ShieldCheck,
  Lightbulb, QrCode, FileText, Eye, Type, Download, ArrowDownLeft
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
      desc: 'Ledger is your simple, private app to track loans given and borrowed, record repayments, calculate interest, and stay on top of personal finances.',
      tip: '100% offline & private — your financial records remain strictly on your device with zero cloud tracking.',
      icon: <Sparkles size={24} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: null,
    },
    {
      id: 'tour-stats',
      title: 'Your Money at a Glance',
      desc: 'View your total balance pending to collect, total recovered funds, and active loan counts updated in real time.',
      tip: 'Tap the Active card anytime to see upcoming and overdue loans.',
      icon: <TrendingUp size={24} style={{ color: '#30D158' }} />,
      targetId: 'tour-stats',
    },
    {
      id: 'tour-search',
      title: 'Instant Search',
      desc: 'Instantly find any contact or transaction entry by typing their name or phone number.',
      tip: 'Filters your entire ledger dynamically as you type with zero lag.',
      icon: <Search size={24} style={{ color: '#0A84FF' }} />,
      targetId: 'tour-search',
    },
    {
      id: 'tour-contacts',
      title: 'Smart Contact Cards',
      desc: 'Each contact has a dedicated card displaying their total outstanding balance, repayment status, and trust score.',
      tip: 'Tap any contact card to view their complete transaction history, timeline, and payment tools.',
      icon: <Users size={24} style={{ color: '#BF5AF2' }} />,
      targetId: 'tour-account-row',
      fallbackTargetId: 'tour-contacts-list',
    },
    {
      id: 'tour-add-profile',
      title: 'Record a New Loan',
      desc: 'Whenever you lend money, tap this floating Plus (+) button. Pick a friend from contacts or enter a name, set the amount, date, return deadline, and optional interest.',
      tip: 'Supports daily, monthly, and yearly interest calculations with automatic timeline tracking.',
      icon: <PlusCircle size={24} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: 'tour-add-profile',
    },
    {
      id: 'tour-profile-stats',
      title: 'Contact Profile & Timeline',
      desc: 'Inside a friend’s profile, explore their complete financial statement, loan records, overdue alerts, and repayment progress.',
      tip: 'Tap any loan card to view details, update the return date, or share a formal receipt.',
      icon: <FileText size={24} style={{ color: '#0A84FF' }} />,
      targetId: 'tour-profile-stats',
      fallbackTargetId: 'tour-history-item',
    },
    {
      id: 'tour-upi-button',
      title: 'Instant UPI QR Request',
      desc: 'Request repayments in seconds! Tap this QR button to generate an instant UPI QR code with the exact pending amount pre-filled.',
      tip: 'Friends can scan it using GPay, PhonePe, Paytm, or any UPI app to transfer funds directly.',
      icon: <QrCode size={24} style={{ color: '#FF453A' }} />,
      targetId: 'tour-upi-button',
    },
    {
      id: 'tour-repayment-button',
      title: 'Record Repayments',
      desc: 'When someone repays you (partially or in full), tap "Receive" to log the payment. Outstanding balance and progress update automatically.',
      tip: 'You can instantly generate and share an itemized payment receipt over WhatsApp or SMS.',
      icon: <ArrowDownLeft size={24} style={{ color: '#30D158' }} />,
      targetId: 'tour-repayment-button',
    },
    {
      id: 'tour-menu-button',
      title: 'App Navigation Menu',
      desc: 'Tap this top menu button to open app preferences, security controls, backup vault, and personalization options.',
      tip: 'On larger screens or tablets, these options are always accessible in the left navigation sidebar.',
      icon: <Settings size={24} style={{ color: '#FF9F0A' }} />,
      targetId: 'tour-menu-button',
    },
    {
      id: 'tour-settings',
      title: 'Settings & OLED Appearance',
      desc: 'Customize your currency symbol, default interest rates, accent color themes, and true pitch-black OLED mode for maximum battery savings.',
      tip: 'Fine-tune interface blurs, smooth animations, and layout spacing.',
      icon: <Eye size={24} style={{ color: '#64D2FF' }} />,
      targetId: 'tour-settings',
      fallbackTargetId: 'tour-settings-desktop',
    },
    {
      id: 'tour-typography',
      title: 'Typography & Styles',
      desc: 'Switch between stylish font faces including SF Pro / Inter, JetBrains Mono, Comic Neue, and Special Elite.',
      tip: 'Instantly transforms the entire look and feel of the app.',
      icon: <Type size={24} style={{ color: '#A78BFA' }} />,
      targetId: 'tour-typography',
      fallbackTargetId: 'tour-typography-desktop',
    },
    {
      id: 'tour-backup',
      title: 'Encrypted Backup & Vault',
      desc: 'Export offline encrypted JSON backups to your phone storage, or generate clean Excel dossier sheets for your records.',
      tip: 'Since Ledger is 100% offline, keeping occasional backups ensures your data is always safe.',
      icon: <Download size={24} style={{ color: '#10B981' }} />,
      targetId: 'tour-backup',
      fallbackTargetId: 'tour-backup-desktop',
    },
    {
      id: 'tour-security',
      title: 'Biometric Security & Privacy',
      desc: 'Keep your personal financial records completely confidential. You can enable App Lock in Settings to require Fingerprint, Face ID, or PIN authentication.',
      tip: 'Configure your auto-lock timeout and preferred unlock method right here in Settings.',
      icon: <ShieldCheck size={26} style={{ color: '#30D158' }} />,
      targetId: 'tour-security-section',
    },
    {
      id: 'tour-done',
      title: "You're All Set!",
      desc: 'You now know all the key features of Ledger. Start recording loans and tracking repayments with complete peace of mind.',
      tip: 'You can restart this walkthrough anytime from Menu > Help & Tutorial.',
      icon: <CheckCircle2 size={26} style={{ color: activeTheme?.hex || '#10B981' }} />,
      targetId: null,
    },
  ];

  const currentStep = tourStep >= 0 && tourStep < steps.length ? steps[tourStep] : null;

  // Locate target and calculate spotlight position with retry mechanism for animating elements
  const updateSpotlight = useCallback(() => {
    if (!currentStep) return;

    if (!currentStep.targetId) {
      setHasTarget(false);
      setSpotlightStyle({
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        opacity: 0,
      });
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;

    const tryLocate = () => {
      let targetEl = document.getElementById(currentStep.targetId!);
      if (!targetEl && currentStep.fallbackTargetId) {
        targetEl = document.getElementById(currentStep.fallbackTargetId);
      }

      if (targetEl) {
        try {
          const computedStyle = window.getComputedStyle(targetEl);
          if (computedStyle.position !== 'fixed' && computedStyle.position !== 'absolute') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        } catch {}

        const rect = targetEl.getBoundingClientRect();

        // If element is still zero-sized or offscreen due to opening bottom sheet animation, retry
        if ((rect.width === 0 || rect.height === 0 || rect.top >= window.innerHeight - 40) && attempts < maxAttempts) {
          attempts++;
          setTimeout(tryLocate, 60);
          return;
        }

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
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryLocate, 60);
      } else {
        // Target element not found after retries - fallback to centered card
        setHasTarget(false);
        setSpotlightStyle({
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          opacity: 0,
        });
      }
    };

    tryLocate();
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
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

      {/* FULLSCREEN / CENTERED CARDS (Intro, Security, Celebration step, or target fallback) */}
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
              maxWidth: 400,
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

              {/* Progress Dots */}
              <div style={{ display: 'flex', gap: 4 }}>
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: idx === tourStep ? 12 : 4,
                      height: 4,
                      borderRadius: 2,
                      background: idx === tourStep ? (activeTheme?.hex || '#FFFFFF') : 'rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
              </div>

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
              maxWidth: 380,
              background: 'rgba(28, 28, 30, 0.97)',
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
              <div style={{ display: 'flex', gap: 4 }}>
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: idx === tourStep ? 12 : 4,
                      height: 4,
                      borderRadius: 2,
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
      </motion.div>
    </AnimatePresence>
  );
};

export default TourOverlay;
