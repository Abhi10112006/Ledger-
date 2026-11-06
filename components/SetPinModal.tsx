import React, { useState } from 'react';
import { X, KeyRound, Delete, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { hashSecurityPin, verifySecurityPin, saveSecurityPinHardware } from '../utils/securityPin';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: any;
  currentPinHash?: string;
  onPinSaved: (newPinHash: string) => void;
}

const PIN_LENGTH = 6;

const KEYPAD_BUTTONS = [
  { num: '1', sub: '' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
];

export const SetPinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTheme,
  currentPinHash,
  onPinSaved,
}) => {
  const haptic = useHaptics();

  // If there's already a PIN, verify current PIN first; otherwise jump directly to 'new'
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(
    currentPinHash ? 'current' : 'new'
  );

  const [enteredDigits, setEnteredDigits] = useState<string>('');
  const [newPinCandidate, setNewPinCandidate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const triggerErrorShake = (msg: string) => {
    haptic('error');
    setIsShaking(true);
    setErrorMsg(msg);
    setTimeout(() => {
      setEnteredDigits('');
      setIsShaking(false);
    }, 550);
  };

  const handleKeyPress = async (digit: string) => {
    if (enteredDigits.length >= PIN_LENGTH) return;
    haptic('selection');
    const newDigits = enteredDigits + digit;
    setEnteredDigits(newDigits);
    setErrorMsg(null);

    if (newDigits.length === PIN_LENGTH) {
      // 1. VERIFY CURRENT PIN
      if (step === 'current') {
        const matches = await verifySecurityPin(newDigits, currentPinHash);
        if (matches) {
          haptic('medium');
          setStep('new');
          setEnteredDigits('');
        } else {
          triggerErrorShake('Current PIN is incorrect.');
        }
        return;
      }

      // 2. ENTER NEW PIN
      if (step === 'new') {
        haptic('medium');
        setNewPinCandidate(newDigits);
        setStep('confirm');
        setEnteredDigits('');
        return;
      }

      // 3. CONFIRM NEW PIN
      if (step === 'confirm') {
        if (newDigits === newPinCandidate) {
          haptic('success');
          const hashed = await saveSecurityPinHardware(newDigits);
          onPinSaved(hashed);
          window.dispatchEvent(
            new CustomEvent('abhi-ledger-toast', {
              detail: { message: '6-Digit Security PIN saved successfully!', type: 'success' },
            })
          );
          onClose();
        } else {
          triggerErrorShake('PINs did not match. Please re-enter.');
          setStep('new');
          setNewPinCandidate('');
        }
      }
    }
  };

  const handleBackspace = () => {
    if (enteredDigits.length === 0) return;
    haptic('light');
    setEnteredDigits((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'current':
        return 'Enter Current PIN';
      case 'new':
        return 'Create New 6-Digit PIN';
      case 'confirm':
        return 'Confirm New 6-Digit PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'current':
        return 'Verify your identity before changing passcode';
      case 'new':
        return 'Choose a secure 6-digit passcode';
      case 'confirm':
        return 'Type the same 6 digits to verify';
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
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
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            background: '#121214',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -16px 48px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 20px calc(env(safe-area-inset-bottom, 16px) + 20px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
        >
          {/* Top handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', marginBottom: 12 }} />

          {/* Top Bar with close button */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(235, 235, 245, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Icon Badge */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${activeTheme.hex}25, rgba(255,255,255,0.06))`,
              border: `1px solid ${activeTheme.hex}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTheme.hex,
              marginBottom: 12,
            }}
          >
            <KeyRound size={26} />
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            {getStepTitle()}
          </h3>
          <p
            style={{
              margin: '4px 0 16px',
              fontSize: 13,
              color: 'rgba(235, 235, 245, 0.55)',
            }}
          >
            {getStepSubtitle()}
          </p>

          {/* 6 Digit Indicators */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -7, 7, -3, 3, 0] } : {}}
            transition={{ duration: 0.38 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              height: 24,
            }}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
              const isFilled = i < enteredDigits.length;
              return (
                <div
                  key={i}
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 6.5,
                    background: isFilled
                      ? isShaking
                        ? '#FF453A'
                        : activeTheme.hex
                      : 'rgba(255, 255, 255, 0.12)',
                    border: isFilled
                      ? `1px solid ${isShaking ? '#FF453A' : activeTheme.hex}`
                      : '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: isFilled
                      ? `0 0 10px ${isShaking ? '#FF453A' : activeTheme.hex}70`
                      : 'none',
                    transition: 'all 0.12s ease',
                  }}
                />
              );
            })}
          </motion.div>

          {/* Error Message */}
          <div style={{ height: 20, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            {errorMsg && (
              <span style={{ fontSize: 12, color: '#FF453A', fontWeight: 500 }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px 16px',
              width: '100%',
              maxWidth: 280,
            }}
          >
            {KEYPAD_BUTTONS.map((btn) => (
              <motion.button
                key={btn.num}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKeyPress(btn.num)}
                style={{
                  height: 52,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '0.5px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{btn.num}</span>
                {btn.sub && (
                  <span style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(235, 235, 245, 0.4)' }}>
                    {btn.sub}
                  </span>
                )}
              </motion.button>
            ))}

            <div />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleKeyPress('0')}
              style={{
                height: 52,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '0.5px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBackspace}
              style={{
                height: 52,
                borderRadius: 16,
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(235, 235, 245, 0.7)',
              }}
            >
              <Delete size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
