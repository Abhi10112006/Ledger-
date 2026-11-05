import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, PlusCircle, UserCheck, Settings, Eye, Search, Type, Keyboard, QrCode, ArrowRight, Download } from 'lucide-react';

interface Props {
  tourStep: number;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  activeTheme: any;
}

const TourOverlay: React.FC<Props> = ({ tourStep, setTourStep, completeTour }) => {
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  });

  const [hasTarget, setHasTarget] = useState(false);

  const steps = [
    {
      id: 'tour-intro',
      title: 'Welcome to Ledger',
      desc: 'Ledger makes it effortless to record, track, and settle money lent to friends and family.',
      icon: <Sparkles size={24} color="#0A84FF" />,
      targetId: null,
    },
    {
      id: 'tour-stats',
      title: 'Balance & Exposure',
      desc: 'View total money to collect, recovery progress, and active overdue amounts at a glance.',
      icon: <TrendingUp size={24} color="#30D158" />,
      targetId: 'tour-stats',
    },
    {
      id: 'tour-search',
      title: 'Quick Search',
      desc: 'Quickly find any contact by typing their name or phone number.',
      icon: <Search size={24} color="#BF5AF2" />,
      targetId: 'tour-search',
    },
    {
      id: 'tour-add-profile',
      title: 'New Loan',
      desc: 'Tap the Plus button to add a new contact or record an active loan deal.',
      icon: <PlusCircle size={24} color="#0A84FF" />,
      targetId: 'tour-add-profile',
    },
    {
      id: 'tour-settings',
      title: 'Settings & Security',
      desc: 'Configure biometric security, currency format, backup, and appearance preferences.',
      icon: <Settings size={24} color="#8E8E93" />,
      targetId: 'tour-settings',
    },
    {
      id: 'tour-typography',
      title: 'Typography',
      desc: 'Choose your preferred font style for the application interface.',
      icon: <Type size={24} color="#5E5CE6" />,
      targetId: 'tour-typography',
    },
    {
      id: 'tour-visual-tab',
      title: 'Appearance',
      desc: 'Customize accent themes and display options in Settings.',
      icon: <Eye size={24} color="#64D2FF" />,
      targetId: 'tour-visual-tab',
    },
    {
      id: 'tour-visual-base',
      title: 'OLED Black',
      desc: 'Toggle true OLED pitch-black mode for battery savings and high contrast.',
      icon: <Sparkles size={24} color="#FF9F0A" />,
      targetId: 'tour-visual-base',
    },
    {
      id: 'tour-visual-glass',
      title: 'Glass & Motion',
      desc: 'Tune subtle frosted glass blurring and spring animation effects.',
      icon: <Settings size={24} color="#FF375F" />,
      targetId: 'tour-visual-glass',
    },
    {
      id: 'tour-keyboard-toggle',
      title: 'Keyboards',
      desc: 'Toggle between the native Android virtual keyboard and custom numeric pad.',
      icon: <Keyboard size={24} color="#30D158" />,
      targetId: 'tour-keyboard-toggle',
    },
    {
      id: 'tour-account-row',
      title: 'Contact Profiles',
      desc: 'Tap on any contact to view their ledger statement, payment timeline, and trust score.',
      icon: <UserCheck size={24} color="#0A84FF" />,
      targetId: 'tour-account-row',
    },
    {
      id: 'tour-upi-button',
      title: 'Instant UPI QR',
      desc: 'Generate customized UPI QR codes on the fly to receive repayments quickly.',
      icon: <QrCode size={24} color="#FF453A" />,
      targetId: 'tour-upi-button',
    },
    {
      id: 'tour-backup',
      title: 'Private & Secure',
      desc: 'Your data lives on your device. Export encrypted JSON backups anytime.',
      icon: <Download size={24} color="#FFD60A" />,
      targetId: 'tour-backup',
    },
  ];

  const currentStep = tourStep >= 0 && tourStep < steps.length ? steps[tourStep] : null;

  useEffect(() => {
    if (!currentStep) return;

    if (currentStep.targetId) {
      let attempts = 0;

      const findTarget = () => {
        const targetEl = document.getElementById(currentStep.targetId!);

        if (targetEl) {
          const computedStyle = window.getComputedStyle(targetEl);
          if (computedStyle.position !== 'fixed' && computedStyle.position !== 'absolute') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }

          const rect = targetEl.getBoundingClientRect();
          const padding = 8;
          setSpotlightStyle({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            opacity: 1,
            borderRadius: window.getComputedStyle(targetEl).borderRadius || '18px',
          });
          setHasTarget(true);
        } else {
          if (attempts < 20) {
            attempts++;
            setTimeout(findTarget, 50);
          } else {
            setSpotlightStyle((prev) => ({ ...prev, opacity: 0 }));
            setHasTarget(false);
          }
        }
      };

      findTarget();
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
  }, [tourStep, currentStep]);

  if (!currentStep) return null;

  const isTopHalf = typeof spotlightStyle.top === 'number' && spotlightStyle.top < window.innerHeight / 2;

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
      {/* SPOTLIGHT HOLE */}
      <div
        style={{
          ...spotlightStyle,
          position: 'absolute',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
          border: '1.5px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          display: hasTarget ? 'block' : 'none',
        }}
      />

      {/* INTRO MODAL */}
      {!hasTarget && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            pointerEvents: 'auto',
          }}
          onClick={completeTour}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#1C1C1E',
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 28,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentStep.icon}
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tour
                </span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'rgba(235, 235, 245, 0.65)', lineHeight: 1.45 }}>
              {currentStep.desc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={completeTour}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(235, 235, 245, 0.5)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 8,
                }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => setTourStep(tourStep + 1)}
                style={{
                  height: 44,
                  padding: '0 20px',
                  borderRadius: 14,
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                }}
              >
                Start Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLTIP POPUP */}
      {hasTarget && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 20px',
            pointerEvents: 'none',
            top: isTopHalf
              ? typeof spotlightStyle.top === 'number'
                ? spotlightStyle.top + (typeof spotlightStyle.height === 'number' ? spotlightStyle.height : 0) + 16
                : 0
              : typeof spotlightStyle.top === 'number'
              ? spotlightStyle.top - 180
              : 0,
            transition: 'top 0.4s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: 'rgba(28, 28, 30, 0.96)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 24,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
              padding: 20,
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>{currentStep.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {currentStep.title}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'rgba(235, 235, 245, 0.65)', lineHeight: 1.4 }}>
                  {currentStep.desc}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Step indicator dots */}
              <div style={{ display: 'flex', gap: 4 }}>
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      background: idx === tourStep ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)',
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={completeTour}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(235, 235, 245, 0.45)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  End
                </button>
                <button
                  type="button"
                  onClick={() => (tourStep < steps.length - 1 ? setTourStep(tourStep + 1) : completeTour())}
                  style={{
                    height: 34,
                    padding: '0 14px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span>{tourStep < steps.length - 1 ? 'Next' : 'Done'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourOverlay;
