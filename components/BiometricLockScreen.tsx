import React, { useEffect, useState, useRef } from 'react';
import {
  Fingerprint, ScanFace, KeyRound, Lock, Delete,
  ShieldCheck, AlertCircle, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';
import { LogoIcon } from './Logo';
import { formatAppTitle } from '../utils/branding';
import { verifyFingerprint, verifyFaceLock, getBiometricCapabilities } from '../hooks/useBiometrics';
import { verifySecurityPin, hashSecurityPin, saveSecurityPinHardware } from '../utils/securityPin';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  activeTheme: any;
  settings: AppSettings;
  onUnlock: () => void;
  onSaveNewPin?: (pinHash: string) => void;
}

type UnlockTab = 'fingerprint' | 'facelock' | 'pin';

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

export const BiometricLockScreen: React.FC<Props> = ({
  activeTheme,
  settings,
  onUnlock,
  onSaveNewPin,
}) => {
  const haptic = useHaptics();

  // Initial tab resolution based on preferences
  const getInitialTab = (): UnlockTab => {
    if (settings.preferredUnlockMode === 'pin') return 'pin';
    return 'fingerprint';
  };

  const [activeTab, setActiveTab] = useState<UnlockTab>(getInitialTab);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempFirstPin, setTempFirstPin] = useState<string>('');
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [hasEnrolledPin, setHasEnrolledPin] = useState<boolean>(!!settings.securityPinHash);

  const hasTriggeredInitialBio = useRef(false);

  // ─── BIOMETRIC CAPABILITIES CHECK ───
  useEffect(() => {
    setHasEnrolledPin(!!settings.securityPinHash);
  }, [settings.securityPinHash]);

  // Auto-prompt on initial app launch if biometric mode is selected
  useEffect(() => {
    if (hasTriggeredInitialBio.current) return;
    hasTriggeredInitialBio.current = true;

    if (settings.preferredUnlockMode !== 'pin') {
      const timer = setTimeout(() => {
        handleTriggerFingerprint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── 1. FINGERPRINT UNLOCK ACTION ───
  const handleTriggerFingerprint = async () => {
    if (isVerifyingBiometric) return;
    haptic('light');
    setIsVerifyingBiometric(true);
    setErrorMessage(null);

    const result = await verifyFingerprint('Scan your fingerprint to unlock Ledger.');
    setIsVerifyingBiometric(false);

    if (result.success) {
      haptic('success');
      onUnlock();
    } else if (result.usePin) {
      setActiveTab('pin');
    } else if (!result.cancelled) {
      haptic('error');
      setErrorMessage(result.error || 'Fingerprint verification failed.');
    }
  };

  // ─── 2. FACE LOCK UNLOCK ACTION ───
  const handleTriggerFaceLock = async () => {
    if (isVerifyingBiometric) return;
    haptic('light');
    setIsVerifyingBiometric(true);
    setErrorMessage(null);

    const result = await verifyFaceLock('Scan your face to unlock Ledger.');
    setIsVerifyingBiometric(false);

    if (result.success) {
      haptic('success');
      onUnlock();
    } else if (result.usePin) {
      setActiveTab('pin');
    } else if (!result.cancelled) {
      haptic('error');
      setErrorMessage(result.error || 'Face verification failed.');
    }
  };

  // ─── 3. 6-DIGIT PIN ACTIONS ───
  const handleKeyPress = async (digit: string) => {
    if (pinDigits.length >= PIN_LENGTH) return;
    haptic('selection');
    const newPin = pinDigits + digit;
    setPinDigits(newPin);
    setErrorMessage(null);

    // If reached 6 digits, evaluate immediately
    if (newPin.length === PIN_LENGTH) {
      await evaluateFullPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (pinDigits.length === 0) return;
    haptic('light');
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const triggerErrorShake = (msg: string) => {
    haptic('error');
    setIsShaking(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setPinDigits('');
      setIsShaking(false);
    }, 550);
  };

  const evaluateFullPin = async (fullPin: string) => {
    // SCENARIO A: PIN ALREADY ENROLLED → VERIFY
    if (hasEnrolledPin && settings.securityPinHash) {
      const isValid = await verifySecurityPin(fullPin, settings.securityPinHash);
      if (isValid) {
        haptic('success');
        onUnlock();
      } else {
        triggerErrorShake('Incorrect PIN. Please try again.');
      }
      return;
    }

    // SCENARIO B: NO PIN CONFIGURED YET → FIRST TIME SETUP
    if (setupStep === 'create') {
      haptic('medium');
      setTempFirstPin(fullPin);
      setPinDigits('');
      setSetupStep('confirm');
      return;
    }

    if (setupStep === 'confirm') {
      if (fullPin === tempFirstPin) {
        haptic('success');
        const hash = await saveSecurityPinHardware(fullPin);
        if (onSaveNewPin) {
          onSaveNewPin(hash);
        }
        setHasEnrolledPin(true);
        onUnlock();
      } else {
        triggerErrorShake('PINs did not match. Please enter again.');
        setSetupStep('create');
        setTempFirstPin('');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#070709',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 'calc(var(--sat, 16px) + 24px)',
        paddingBottom: 'calc(var(--sab, 16px) + 20px)',
        paddingLeft: 20,
        paddingRight: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          height: 280,
          background: `radial-gradient(ellipse at top center, ${activeTheme.hex}22 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── TOP SECTION: BRANDING & TITLE ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: 360,
        }}
      >
        {/* App Logo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: `0 10px 30px ${activeTheme.hex}30`,
            marginBottom: 12,
          }}
        >
          <LogoIcon activeTheme={activeTheme} size="100%" />
        </motion.div>

        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
          }}
        >
          {formatAppTitle(settings.userName)}
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 4,
            fontSize: 12,
            color: 'rgba(235, 235, 245, 0.55)',
            letterSpacing: '-0.01em',
          }}
        >
          <Lock size={12} style={{ color: activeTheme.hex }} />
          <span>Biometric Security Gate</span>
        </div>

        {/* ─── 3 UNLOCK TABS SELECTOR ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: 4,
            marginTop: 18,
            width: '100%',
            maxWidth: 340,
            gap: 4,
          }}
        >
          {[
            { id: 'fingerprint', label: 'Fingerprint', icon: Fingerprint },
            { id: 'facelock', label: 'Face Lock', icon: ScanFace },
            { id: 'pin', label: '6-Digit PIN', icon: KeyRound },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic('light');
                  setActiveTab(tab.id as UnlockTab);
                  setErrorMessage(null);
                  if (tab.id === 'fingerprint') {
                    handleTriggerFingerprint();
                  } else if (tab.id === 'facelock') {
                    handleTriggerFaceLock();
                  }
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  height: 36,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(235, 235, 245, 0.55)',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                <Icon size={14} style={{ color: isActive ? activeTheme.hex : 'currentColor' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CENTER INTERACTIVE BODY ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 340,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '16px 0',
        }}
      >
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════ */}
          {/* TAB 1: FINGERPRINT UNLOCK                   */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 'fingerprint' && (
            <motion.div
              key="fingerprint-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Concentric Pulse Scanner Visual */}
              <motion.div
                animate={isVerifyingBiometric ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                onClick={handleTriggerFingerprint}
                style={{
                  position: 'relative',
                  width: 108,
                  height: 108,
                  borderRadius: 54,
                  background: `linear-gradient(135deg, ${activeTheme.hex}25, rgba(255,255,255,0.06))`,
                  border: `1.5px solid ${activeTheme.hex}60`,
                  boxShadow: `0 12px 36px ${activeTheme.hex}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTheme.hex,
                  cursor: 'pointer',
                  marginBottom: 20,
                }}
              >
                <Fingerprint size={52} strokeWidth={1.8} />

                {/* Rotating scanner ring */}
                {isVerifyingBiometric && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: 60,
                      border: `2px dashed ${activeTheme.hex}`,
                      opacity: 0.6,
                    }}
                  />
                )}
              </motion.div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Touch Fingerprint Sensor
              </h3>

              <p
                style={{
                  margin: '6px 0 20px',
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.55)',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  maxWidth: 260,
                }}
              >
                Place your enrolled finger on the device sensor to unlock your ledger vault.
              </p>

              {/* Primary Action Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTriggerFingerprint}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  background: activeTheme.hex,
                  color: '#000000',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: `0 4px 18px ${activeTheme.hex}40`,
                }}
              >
                <Fingerprint size={18} />
                <span>Scan Fingerprint</span>
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 2: FACE LOCK UNLOCK                     */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 'facelock' && (
            <motion.div
              key="facelock-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Face Scanner Bracket Visual */}
              <motion.div
                animate={isVerifyingBiometric ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                onClick={handleTriggerFaceLock}
                style={{
                  position: 'relative',
                  width: 108,
                  height: 108,
                  borderRadius: 28,
                  background: `linear-gradient(135deg, ${activeTheme.hex}25, rgba(255,255,255,0.06))`,
                  border: `1.5px solid ${activeTheme.hex}60`,
                  boxShadow: `0 12px 36px ${activeTheme.hex}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTheme.hex,
                  cursor: 'pointer',
                  marginBottom: 20,
                  overflow: 'hidden',
                }}
              >
                <ScanFace size={50} strokeWidth={1.8} />

                {/* Laser scan beam */}
                <motion.div
                  animate={{ y: [-48, 48, -48] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${activeTheme.hex}, transparent)`,
                    boxShadow: `0 0 12px ${activeTheme.hex}`,
                  }}
                />
              </motion.div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Face Authentication
              </h3>

              <p
                style={{
                  margin: '6px 0 20px',
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.55)',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  maxWidth: 260,
                }}
              >
                Hold your device in front of your face to instantly verify your identity.
              </p>

              {/* Primary Action Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTriggerFaceLock}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  background: activeTheme.hex,
                  color: '#000000',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: `0 4px 18px ${activeTheme.hex}40`,
                }}
              >
                <ScanFace size={18} />
                <span>Verify Face Scan</span>
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 3: 6-DIGIT PIN KEYPAD                   */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 'pin' && (
            <motion.div
              key="pin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Header prompt for PIN */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {!hasEnrolledPin
                    ? setupStep === 'create'
                      ? 'Create a 6-Digit PIN'
                      : 'Re-enter to Confirm PIN'
                    : 'Enter 6-Digit PIN'}
                </span>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: 'rgba(235, 235, 245, 0.45)',
                  }}
                >
                  {!hasEnrolledPin
                    ? setupStep === 'create'
                      ? 'Set your master backup passcode'
                      : 'Confirm your 6-digit passcode'
                    : 'Enter your security PIN to unlock'}
                </p>
              </div>

              {/* 6 Circular Pin Indicator Dots */}
              <motion.div
                animate={isShaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  marginBottom: 16,
                  height: 28,
                }}
              >
                {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                  const isFilled = i < pinDigits.length;
                  return (
                    <motion.div
                      key={i}
                      animate={isFilled ? { scale: [0.8, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.16 }}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: isFilled
                          ? isShaking
                            ? '#FF453A'
                            : activeTheme.hex
                          : 'rgba(255, 255, 255, 0.12)',
                        border: isFilled
                          ? `1px solid ${isShaking ? '#FF453A' : activeTheme.hex}`
                          : '1px solid rgba(255, 255, 255, 0.22)',
                        boxShadow: isFilled
                          ? `0 0 10px ${isShaking ? '#FF453A' : activeTheme.hex}80`
                          : 'none',
                        transition: 'background 0.12s, border-color 0.12s',
                      }}
                    />
                  );
                })}
              </motion.div>

              {/* Numeric Keypad Grid (3x4) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px 18px',
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
                      height: 56,
                      borderRadius: 18,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '0.5px solid rgba(255, 255, 255, 0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 21,
                        fontWeight: 600,
                        lineHeight: 1.1,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                      }}
                    >
                      {btn.num}
                    </span>
                    {btn.sub && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: 'rgba(235, 235, 245, 0.4)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {btn.sub}
                      </span>
                    )}
                  </motion.button>
                ))}

                {/* Bottom Row: Quick Biometric Switch, '0', Backspace */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptic('light');
                    setActiveTab('fingerprint');
                    handleTriggerFingerprint();
                  }}
                  style={{
                    height: 56,
                    borderRadius: 18,
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: activeTheme.hex,
                  }}
                  title="Switch to Biometric Scan"
                >
                  <Fingerprint size={24} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyPress('0')}
                  style={{
                    height: 56,
                    borderRadius: 18,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '0.5px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 21,
                      fontWeight: 600,
                      lineHeight: 1.1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                    }}
                  >
                    0
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBackspace}
                  style={{
                    height: 56,
                    borderRadius: 18,
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(235, 235, 245, 0.7)',
                  }}
                  title="Delete digit"
                >
                  <Delete size={22} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error / Alert feedback line */}
        <div style={{ height: 26, marginTop: 12, display: 'flex', alignItems: 'center' }}>
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#FF453A',
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── BOTTOM FOOTER ACTION ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {activeTab !== 'pin' ? (
          <button
            onClick={() => {
              haptic('light');
              setActiveTab('pin');
              setErrorMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(235, 235, 245, 0.65)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Or unlock with 6-Digit PIN</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            onClick={() => {
              haptic('light');
              setActiveTab('fingerprint');
              handleTriggerFingerprint();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(235, 235, 245, 0.65)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Fingerprint size={14} style={{ color: activeTheme.hex }} />
            <span>Use Fingerprint / Face</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BiometricLockScreen;
