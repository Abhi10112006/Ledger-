import React, { useState, useRef, useEffect } from 'react';
import { Upload, User, ShieldCheck, RefreshCw, X, Check, ChevronRight, Sparkles, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Transaction } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { LogoIcon } from './Logo';
import Mascot3D, { MascotMood } from './Mascot3D';
import { importBackupFile } from '../utils/cryptoBackup';
import { APP_VERSION } from '../utils/version';

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

  // Capture at mount time whether user was ALREADY onboarded BEFORE this session
  // This ensures a first-time user who saves their name during this session still sees "Welcome," not "Welcome Back,"
  const wasAlreadyOnboardedRef = useRef(Boolean(settings.hasOnboarded || hasTransactions));

  // Check if user has a custom name (not default "Ledger" or "User")
  const hasCustomName = Boolean(
    settings.userName &&
    settings.userName.trim().length > 0 &&
    settings.userName.trim().toLowerCase() !== 'ledger' &&
    settings.userName.trim().toLowerCase() !== 'user'
  );

  const cleanDisplayName = hasCustomName
    ? settings.userName.trim().split(' ')[0].replace(/'s$/i, '')
    : '';

  // Has the user completed onboarding or performed previous sessions
  const isReturningSession = Boolean(settings.hasOnboarded || hasTransactions);

  const [inputName, setInputName] = useState(hasCustomName ? settings.userName : '');
  const [isEditingName, setIsEditingName] = useState(!hasCustomName);
  const [isFocused, setIsFocused] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [justSavedName, setJustSavedName] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [cardBounceY, setCardBounceY] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);

  const accentColor = activeTheme?.hex || '#10b981';

  // Synchronize inputName if settings.userName updates externally (e.g. from backup restore)
  useEffect(() => {
    if (hasCustomName && !inputName) {
      setInputName(settings.userName);
    }
  }, [settings.userName, hasCustomName]);

  // Determine Mascot Mood
  const mascotMood: MascotMood = justSavedName
    ? 'celebrate'
    : hasCustomName && !isEditingName
    ? 'welcome'
    : inputName.trim().length > 0
    ? 'typing'
    : isFocused
    ? 'asking'
    : 'idle';

  // Save name on Enter or button click — CRITICAL: ONLY SAVES NAME, DOES NOT EXIT LOGIN SCREEN!
  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputName.trim();
    if (!clean) {
      haptic('warning');
      return;
    }

    haptic('success');
    if (updateSetting) {
      updateSetting('userName', clean);
      updateSetting('hasOnboarded', true);
    }

    setJustSavedName(true);
    setCelebrateCount((c) => c + 1);
    setIsEditingName(false);

    window.dispatchEvent(
      new CustomEvent('abhi-ledger-toast', {
        detail: {
          message: `Saved! Nice to meet you, ${clean}! ✨`,
          type: 'success',
        },
      })
    );

    // Reset temporary saved badge after 4 seconds
    setTimeout(() => {
      setJustSavedName(false);
    }, 4000);
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
        paddingTop: 'calc(var(--sat, 0px) + 20px)',
        paddingBottom: 'calc(var(--sab, 0px) + 20px)',
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
          maxWidth: 620,
          height: '55vh',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accentColor}25 0%, ${accentColor}06 45%, transparent 75%)`,
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '5%',
          width: '50vw',
          height: '40vh',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accentColor}14 0%, transparent 70%)`,
          pointerEvents: 'none',
          filter: 'blur(55px)',
        }}
      />

      {/* Subtle cosmic particle sparks */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '12%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: `0 0 8px #ffffff, 0 0 16px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '32%',
            right: '18%',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: `0 0 10px #ffffff, 0 0 20px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            left: '20%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 8px #ffffff',
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
        initial={{ opacity: 0, y: 18 }}
        animate={{
          opacity: isLaunching ? 0 : 1,
          y: isLaunching ? -14 : 0,
          scale: isLaunching ? 0.96 : 1,
          filter: isLaunching ? 'blur(6px)' : 'blur(0px)',
        }}
        transition={{
          duration: isLaunching ? 0.65 : 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-[360px] px-6 relative z-10 flex flex-col items-center"
      >
        {/* Brand Bar / Logo Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2 mb-1 px-3 py-1.5 rounded-full"
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
              color: 'rgba(255, 255, 255, 0.75)',
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
            v{APP_VERSION}
          </span>
        </motion.div>

        {/* --- 3D INTERACTIVE MASCOT WITH ANIMATED TRICKS & RIGID BODY BOUNCE PHYSICS --- */}
        <div className="w-full my-1 flex justify-center overflow-visible">
          <Mascot3D
            mood={mascotMood}
            userName={inputName || cleanDisplayName}
            accentColor={accentColor}
            isFocused={isFocused}
            celebrateTrigger={celebrateCount}
            isRestoring={isRestoring}
            hasCustomName={hasCustomName}
            isLaunching={isLaunching}
            onLaunchComplete={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('abhi_ledger_is_logged_out');
              }
              onLogin();
            }}
            onTap={() => haptic('selection')}
            onPhysicsBounce={(intensity) => {
              setCardBounceY(Math.min(5, intensity * 0.75));
              setTimeout(() => setCardBounceY(0), 160);
            }}
          />
        </div>

        {/* --- DYNAMIC HEADER & FORM (REACTS PHYSICALLY TO MASCOT BOUNCE) --- */}
        <motion.div
          animate={{ y: cardBounceY }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="w-full flex flex-col items-center"
        >
          <div className="text-center mt-2 mb-4 w-full">
          <AnimatePresence mode="wait">
            {hasCustomName && !isEditingName ? (
              <motion.div
                key="name-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h1
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: '-0.03em',
                    color: '#ffffff',
                    lineHeight: 1.15,
                    marginBottom: 5,
                  }}
                >
                  {wasAlreadyOnboardedRef.current ? 'Welcome Back,' : 'Welcome,'}{' '}
                  <span style={{ color: accentColor }}>{cleanDisplayName}</span>
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'rgba(235, 235, 245, 0.55)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Your encrypted vault is ready.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="neutral-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h1
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: '-0.03em',
                    color: '#ffffff',
                    lineHeight: 1.15,
                    marginBottom: 5,
                  }}
                >
                  {wasAlreadyOnboardedRef.current ? 'Welcome Back' : 'Welcome to Your Vault'}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'rgba(235, 235, 245, 0.55)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Private · Encrypted · 100% Offline
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- NAME INPUT SECTION (Optional & Saves on Enter without exiting) --- */}
        <div className="w-full mb-3">
          <AnimatePresence mode="wait">
            {isEditingName ? (
              <motion.form
                key="name-edit-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveName}
                className="w-full"
              >
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
                    <User size={17} />
                  </div>

                  <input
                    type="text"
                    value={inputName}
                    maxLength={28}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      haptic('key');
                    }}
                    onFocus={() => {
                      setIsFocused(true);
                      haptic('light');
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Your name (optional)..."
                    style={{
                      width: '100%',
                      height: 48,
                      paddingLeft: 40,
                      paddingRight: inputName.trim() ? 84 : 14,
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: isFocused
                        ? `1.5px solid ${accentColor}`
                        : '0.5px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isFocused ? `0 0 16px ${accentColor}25` : 'none',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />

                  {/* Save button inside input field */}
                  {inputName.trim() && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        type="submit"
                        title="Save Name (Press Enter)"
                        style={{
                          height: 32,
                          padding: '0 10px',
                          borderRadius: 9,
                          background: accentColor,
                          color: '#000000',
                          fontSize: 12,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: `0 2px 8px ${accentColor}40`,
                        }}
                      >
                        <Check size={13} strokeWidth={3} />
                        <span>Save</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {hasCustomName && (
                  <div className="flex justify-end px-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="text-[11px] text-white/40 hover:text-white/80"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </motion.form>
            ) : (
              /* Already saved name state */
              <motion.div
                key="name-saved-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: `${accentColor}20`,
                      color: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {cleanDisplayName.charAt(0) || <User size={13} />}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                      {cleanDisplayName}
                    </span>
                    {justSavedName && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold animate-pulse"
                        style={{ background: `${accentColor}30`, color: accentColor }}
                      >
                        ✓ Saved!
                      </span>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setIsEditingName(true);
                  }}
                  className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white py-1 px-2 rounded-lg hover:bg-white/5"
                  title="Change your name"
                >
                  <Edit3 size={12} />
                  <span>Change</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- PRIMARY CTA: OPEN DASHBOARD --- */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          disabled={isLaunching}
          onClick={() => {
            if (isLaunching) return;
            haptic('medium');
            setIsLaunching(true);
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
            boxShadow: '0 8px 24px rgba(255,255,255,0.18)',
            marginBottom: 14,
          }}
        >
          <span>Open Dashboard</span>
          <ChevronRight size={18} />
        </motion.button>

        {/* --- RESTORE BACKUP CARD FOR OLD USERS --- */}
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
                width: 36,
                height: 36,
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
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Upload size={17} />
              )}
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
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
          className="mt-7 flex items-center justify-center gap-2"
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
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
