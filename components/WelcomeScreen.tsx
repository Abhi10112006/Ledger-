import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, User, ShieldCheck, RefreshCw, X, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Transaction } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { LogoIcon } from './Logo';
import Mascot3D, { MascotMood } from './Mascot3D';
import { importBackupFile } from '../utils/cryptoBackup';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  onLogin: () => void;
  handleImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  restoreBackupData?: (transactions: Transaction[], settings?: AppSettings) => Promise<void>;
  updateSetting?: (key: keyof AppSettings, value: any) => void;
  hasTransactions?: boolean;
}

const WelcomeScreen: React.FC<Props> = ({
  settings,
  activeTheme,
  onLogin,
  handleImport,
  restoreBackupData,
  updateSetting,
  hasTransactions = false,
}) => {
  const haptic = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if returning user
  const isActuallyReturning = Boolean(
    settings.hasOnboarded ||
    (settings.userName && settings.userName.trim() !== 'Ledger' && settings.userName.trim() !== 'User') ||
    hasTransactions
  );

  const [isEditingName, setIsEditingName] = useState(!isActuallyReturning);
  const [inputName, setInputName] = useState(
    settings.userName && settings.userName !== 'Ledger' ? settings.userName : ''
  );
  const [isFocused, setIsFocused] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isNameError, setIsNameError] = useState(false);

  const rawName = settings.userName ? settings.userName.split(' ')[0] : 'User';
  const displayName = rawName.replace(/'s$/i, '');
  const accentColor = activeTheme?.hex || '#10b981';

  // Determine Mascot Mood
  const mascotMood: MascotMood = isActuallyReturning && !isEditingName
    ? 'welcome'
    : inputName.trim().length > 0
    ? 'typing'
    : isFocused
    ? 'asking'
    : 'idle';

  // Submit name for first-time user
  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = inputName.trim();
    if (!cleanName) {
      haptic('warning');
      setIsNameError(true);
      setTimeout(() => setIsNameError(false), 2400);
      return;
    }

    haptic('success');
    if (updateSetting) {
      updateSetting('userName', cleanName);
      updateSetting('hasOnboarded', true);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('abhi_ledger_is_logged_out');
    }
    onLogin();
  };

  // Restore backup file for old users
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic('medium');
    setIsRestoring(true);
    setRestoreError(null);

    try {
      const { transactions: restoredTx, settings: restoredSettings } = await importBackupFile(file);

      if (restoreBackupData) {
        await restoreBackupData(restoredTx, {
          ...(restoredSettings || {}),
          hasOnboarded: true,
        } as AppSettings);
      } else if (handleImport) {
        handleImport(e);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('abhi_ledger_is_logged_out');
      }

      const restoredUserName = restoredSettings?.userName || settings.userName;
      window.dispatchEvent(
        new CustomEvent('abhi-ledger-toast', {
          detail: {
            message: `Restored ${restoredTx.length} records! Welcome back${
              restoredUserName && restoredUserName !== 'Ledger' ? `, ${restoredUserName}` : ''
            }!`,
            type: 'success',
          },
        })
      );

      haptic('success');
      onLogin();
    } catch (err: any) {
      const msg = err?.message || 'Failed to parse backup file. Please check the file.';
      setRestoreError(msg);
      window.dispatchEvent(
        new CustomEvent('abhi-ledger-toast', {
          detail: { message: msg, type: 'error' },
        })
      );
      haptic('warning');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{
        background: '#040507',
        paddingTop: 'calc(var(--sat, 0px) + 24px)',
        paddingBottom: 'calc(var(--sab, 0px) + 24px)',
      }}
    >
      {/* --- AMBIENT GRADIENT AURAS --- */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 600,
          height: '55vh',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accentColor}22 0%, ${accentColor}06 45%, transparent 75%)`,
          pointerEvents: 'none',
          filter: 'blur(35px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '10%',
          width: '50vw',
          height: '40vh',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accentColor}12 0%, transparent 70%)`,
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      {/* Floating subtle star/particle motes */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 6px #fff, 0 0 12px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '35%',
            right: '20%',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 8px #fff, 0 0 16px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '25%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 6px #fff`,
          }}
        />
      </div>

      {/* Hidden File Input for Backup Restore */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="*/*,.ledgerbak,.json,.bak,.abhibak,application/json,application/octet-stream"
        onChange={handleRestoreFile}
      />

      {/* --- MAIN GLASS CONTAINER --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px] px-6 relative z-10 flex flex-col items-center"
      >
        {/* Brand Bar / Logo Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, overflow: 'hidden' }}>
            <LogoIcon activeTheme={activeTheme} size="100%" />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Ledger
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 6,
              background: `${accentColor}25`,
              color: accentColor,
              fontWeight: 700,
            }}
          >
            v3.0
          </span>
        </motion.div>

        {/* --- 3D INTERACTIVE MASCOT --- */}
        <div className="w-full my-2 flex justify-center">
          <Mascot3D
            mood={mascotMood}
            userName={inputName || displayName}
            accentColor={accentColor}
            isFocused={isFocused}
            onTap={() => haptic('selection')}
          />
        </div>

        {/* --- DYNAMIC CONTENT: RETURNING vs FIRST-TIME --- */}
        <AnimatePresence mode="wait">
          {isActuallyReturning && !isEditingName ? (
            /* =========================================================================
               MODE 1: WELCOME BACK (LOGGED OUT / RETURNING USER)
               ========================================================================= */
            <motion.div
              key="returning-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center mt-2"
            >
              <h1
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  marginBottom: 6,
                }}
              >
                Welcome Back,{' '}
                <span style={{ color: accentColor }}>{displayName}</span>
              </h1>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'rgba(235, 235, 245, 0.55)',
                  letterSpacing: '-0.01em',
                  marginBottom: 24,
                }}
              >
                Your private ledger is locked and ready.
              </p>

              {/* Primary Action: Open Dashboard */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  haptic('medium');
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('abhi_ledger_is_logged_out');
                  }
                  onLogin();
                }}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 14,
                  background: '#ffffff',
                  color: '#000000',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: '-0.01em',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 24px rgba(255,255,255,0.15)',
                  marginBottom: 12,
                }}
              >
                <span>Open Dashboard</span>
                <ChevronRight size={18} />
              </motion.button>

              {/* Secondary Action: Restore from Backup */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
                disabled={isRestoring}
                onClick={() => {
                  haptic('light');
                  fileInputRef.current?.click();
                }}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(235, 235, 245, 0.85)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: '-0.01em',
                  border: '0.5px solid rgba(255, 255, 255, 0.12)',
                  cursor: isRestoring ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {isRestoring ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" style={{ color: accentColor }} />
                    <span>Restoring Vault...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} style={{ opacity: 0.7 }} />
                    <span>Restore from Backup</span>
                  </>
                )}
              </motion.button>

              {/* Switch User / Edit Name Option */}
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setIsEditingName(true);
                }}
                className="text-xs transition-colors py-1 px-2 rounded hover:bg-white/5"
                style={{
                  color: 'rgba(235, 235, 245, 0.4)',
                  letterSpacing: '-0.01em',
                  textDecoration: 'none',
                }}
              >
                Not <span className="underline">{displayName}</span>? Switch user / Change name
              </button>
            </motion.div>
          ) : (
            /* =========================================================================
               MODE 2: FIRST-TIME USER / NAME SETUP
               ========================================================================= */
            <motion.div
              key="first-time-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center mt-2"
            >
              <div className="text-center mb-4">
                <h1
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: '-0.03em',
                    color: '#ffffff',
                    lineHeight: 1.15,
                    marginBottom: 6,
                  }}
                >
                  {isActuallyReturning ? 'Update Your Name' : 'Create Your Profile'}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'rgba(235, 235, 245, 0.55)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Enter your name to personalize your private ledger.
                </p>
              </div>

              {/* Name Input Form */}
              <form onSubmit={handleNameSubmit} className="w-full space-y-3">
                <div className="relative w-full">
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: isFocused ? accentColor : 'rgba(255, 255, 255, 0.35)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <User size={18} />
                  </div>

                  <input
                    type="text"
                    value={inputName}
                    maxLength={30}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      haptic('key');
                    }}
                    onFocus={() => {
                      setIsFocused(true);
                      haptic('light');
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Enter your name..."
                    autoFocus={!isActuallyReturning}
                    style={{
                      width: '100%',
                      height: 50,
                      paddingLeft: 42,
                      paddingRight: inputName ? 38 : 14,
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: isNameError
                        ? '1px solid #ef4444'
                        : isFocused
                        ? `1.5px solid ${accentColor}`
                        : '0.5px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isFocused ? `0 0 16px ${accentColor}25` : 'none',
                      color: '#ffffff',
                      fontSize: 15,
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />

                  {/* Clear text button */}
                  {inputName && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputName('');
                        haptic('light');
                      }}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        padding: 4,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Validation error message */}
                {isNameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: 12,
                      color: '#ef4444',
                      margin: '2px 0 0 6px',
                      fontWeight: 500,
                    }}
                  >
                    Please enter your name to continue.
                  </motion.p>
                )}

                {/* Primary Button: Get Started */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 14,
                    background: inputName.trim()
                      ? `linear-gradient(135deg, #ffffff 0%, #f0f0f5 100%)`
                      : 'rgba(255, 255, 255, 0.15)',
                    color: inputName.trim() ? '#000000' : 'rgba(255, 255, 255, 0.45)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 16,
                    letterSpacing: '-0.01em',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: inputName.trim() ? '0 8px 24px rgba(255,255,255,0.18)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>{isActuallyReturning ? 'Save & Continue' : 'Get Started'}</span>
                  <ArrowRight size={18} />
                </motion.button>
              </form>

              {/* --- RESTORE BACKUP OPTION FOR OLD USERS --- */}
              <div className="w-full mt-5">
                <div className="relative flex items-center justify-center my-3">
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 0.5,
                      background: 'rgba(255, 255, 255, 0.08)',
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      background: '#040507',
                      padding: '0 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.35)',
                    }}
                  >
                    Already have data?
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={isRestoring}
                  onClick={() => {
                    haptic('medium');
                    fileInputRef.current?.click();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '0.5px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    cursor: isRestoring ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `${accentColor}18`,
                        border: `0.5px solid ${accentColor}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor,
                        flexShrink: 0,
                      }}
                    >
                      {isRestoring ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {isRestoring ? 'Restoring Ledger...' : 'Restore from Backup'}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontWeight: 400,
                          color: 'rgba(235, 235, 245, 0.45)',
                          marginTop: 1,
                        }}
                      >
                        Import .ledgerbak, .json or old files
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </motion.button>

                {/* Cancel editing if returning user */}
                {isActuallyReturning && (
                  <div className="flex justify-center mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setIsEditingName(false);
                      }}
                      className="text-xs text-white/40 hover:text-white/70 py-1"
                    >
                      Cancel and return to login
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- RESTORE ERROR BANNER (if any) --- */}
        {restoreError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2.5 rounded-xl text-center w-full"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '0.5px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#f87171' }}>{restoreError}</p>
          </motion.div>
        )}

        {/* --- SECURITY / PRIVACY FOOTER --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-8 flex items-center justify-center gap-2"
          style={{
            fontSize: 11,
            color: 'rgba(235, 235, 245, 0.3)',
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}
        >
          <ShieldCheck size={13} style={{ opacity: 0.6, color: accentColor }} />
          <span>Zero Cloud · 100% Offline · AES-256 Encrypted</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
