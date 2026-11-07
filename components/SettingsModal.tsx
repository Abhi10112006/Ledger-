import React, { useState, useEffect } from 'react';
import {
  X, Check, Lock, Film, Sliders, CheckCircle2, ChevronRight,
  ShieldCheck, KeyRound, Fingerprint, ScanFace, RefreshCw, Bell
} from 'lucide-react';
import { AppSettings, ThemeColor, CornerRadius, BaseColor, BackgroundType, Density } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { APP_VERSION, checkForUpdate, VersionInfo } from '../utils/version';
import { SetPinModal } from './SetPinModal';
import { useBackHandler } from '../utils/backHandler';
import { getBiometricCapabilities } from '../hooks/useBiometrics';
import { requestNotificationPermissions } from '../utils/notifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  activeTheme: any;
  themes: Record<string, any>;
  currencies: string[];
  tourStep?: number;
  onUpdateAvailable?: (info: VersionInfo) => void;
}

// ────────────────────────────────────────────────
// iOS Toggle Component
// ────────────────────────────────────────────────
const Toggle: React.FC<{ on: boolean; onToggle: () => void; color: string }> = ({ on, onToggle, color }) => (
  <div
    onClick={onToggle}
    style={{
      width: 51,
      height: 31,
      borderRadius: 100,
      cursor: 'pointer',
      background: on ? color : 'rgba(120, 120, 128, 0.32)',
      position: 'relative',
      transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 2,
        left: on ? 22 : 2,
        width: 27,
        height: 27,
        borderRadius: 100,
        background: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        transition: 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    />
  </div>
);

// ────────────────────────────────────────────────
// Radio Check Circle (Matches Image 3)
// ────────────────────────────────────────────────
const RadioCheck: React.FC<{ checked: boolean; color: string }> = ({ checked, color }) => (
  <div
    style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      background: checked ? color : 'transparent',
      border: checked ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.18s ease',
    }}
  >
    {checked && <Check size={14} color="#000000" strokeWidth={3} />}
  </div>
);

// ────────────────────────────────────────────────
// Section Label
// ────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(235, 235, 245, 0.4)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '16px 16px 8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
    }}
  >
    {children}
  </div>
);

// ────────────────────────────────────────────────
// Live Preview Card (for desktop)
// ────────────────────────────────────────────────
const PreviewCard: React.FC<{ settings: AppSettings; activeTheme: any }> = ({ settings, activeTheme }) => {
  const getRadius = () => (settings.cornerRadius === 'sharp' ? '4px' : settings.cornerRadius === 'round' ? '12px' : '24px');
  const getFontClass = () =>
    ({
      mono: 'font-mono-app',
      sans: 'font-sans-app',
      system: 'font-system-app',
      outfit: 'font-outfit-app',
      jakarta: 'font-jakarta-app',
      playfair: 'font-playfair-app',
      serif: 'font-serif-app',
      comic: 'font-comic-app',
    }[settings.fontStyle] || 'font-sans-app');

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235,235,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 12 }}>
        Live Preview
      </div>
      <div
        style={{
          background: settings.baseColor === 'oled' ? '#000000' : '#1C1C1E',
          borderRadius: 22,
          padding: 16,
          border: '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(235,235,245,0.4)', marginBottom: 4 }}>Total Outstanding</div>
          <div className={getFontClass()} style={{ fontSize: 26, fontWeight: 700, color: activeTheme.hex, letterSpacing: '-0.02em' }}>
            {settings.currency}2,194
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: getRadius(),
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            C
          </div>
          <div style={{ flex: 1 }}>
            <div className={getFontClass()} style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Capital</div>
            <div style={{ fontSize: 10, color: 'rgba(235,235,245,0.4)' }}>2 transactions</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{settings.currency}1,550</div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Main Settings Modal
// ────────────────────────────────────────────────
const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  updateSetting,
  activeTheme,
  themes,
  tourStep,
  onUpdateAvailable,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'visual' | 'layout'>('general');
  const [customCurrency, setCustomCurrency] = useState('');
  const [isEditingCustomCurrency, setIsEditingCustomCurrency] = useState(false);
  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [hasFaceLock, setHasFaceLock] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getBiometricCapabilities().then((caps) => {
      if (isMounted) {
        setHasFaceLock(caps.hasFaceLock);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useBackHandler(isSetPinModalOpen, () => {
    setIsSetPinModalOpen(false);
  });
  const haptic = useHaptics();

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    haptic('selection');
    try {
      const update = await checkForUpdate();
      if (update) {
        haptic('success');
        window.dispatchEvent(
          new CustomEvent('abhi-ledger-toast', {
            detail: { message: `Update available: v${update.version} (${update.versionName})`, type: 'info' },
          })
        );
        onUpdateAvailable?.(update);
      } else {
        haptic('light');
        window.dispatchEvent(
          new CustomEvent('abhi-ledger-toast', {
            detail: { message: `You are on the latest version (v${APP_VERSION})`, type: 'success' },
          })
        );
      }
    } catch {
      window.dispatchEvent(
        new CustomEvent('abhi-ledger-toast', {
          detail: { message: 'Unable to check for updates. Check internet connection.', type: 'error' },
        })
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    if (tourStep === 12) {
      setActiveTab('general');
    }
  }, [tourStep]);

  const isOled = settings.baseColor === 'oled';
  const sheetBg = isOled ? '#000000' : '#141416';
  const cardBg = isOled ? 'rgba(255, 255, 255, 0.05)' : '#1C1C1E';
  const cardBorder = isOled ? '0.5px solid rgba(255, 255, 255, 0.08)' : '0.5px solid rgba(255, 255, 255, 0.06)';

  // Currencies list matching Image 2 without duplicate
  const standardCurrencies = ['₹', '$', '€', '₩', '£', '¥'];
  const isCustomActive = !standardCurrencies.includes(settings.currency);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'visual', label: 'Look & Feel' },
    { id: 'layout', label: 'Layout' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 540,
              maxHeight: '94vh',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              background: sheetBg,
              border: '0.5px solid rgba(255,255,255,0.12)',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 12px)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
              overflow: 'hidden',
            }}
            className="md:max-h-[88vh] md:rounded-[28px]"
          >
            {/* Ambient top radial accent glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                height: 180,
                background: `radial-gradient(ellipse at top center, ${activeTheme.hex}30 0%, transparent 68%)`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Grab handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header: "Settings" on left, (X) on right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px', position: 'relative', zIndex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                }}
              >
                Settings
              </h2>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(235, 235, 245, 0.7)',
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Segmented Capsule Tab Bar (Matches Image 2 & 3) */}
            <div style={{ padding: '0 16px 14px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 100,
                  padding: 4,
                  display: 'flex',
                  gap: 4,
                }}
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      whileTap={{ scale: 0.97 }}
                      id={tab.id === 'visual' ? 'tour-visual-tab' : tab.id === 'layout' ? 'tour-interface-tab' : undefined}
                      onClick={() => {
                        haptic('selection');
                        setActiveTab(tab.id as any);
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 100,
                        background: isActive ? activeTheme.hex : 'transparent',
                        color: isActive ? '#000000' : 'rgba(235, 235, 245, 0.65)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        transition: 'background 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
              {/* Form Scroll Container */}
              <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    style={{ paddingBottom: 24 }}
                  >
                    {/* ══════════════════════════════════════════════════ */}
                    {/* TAB 1: GENERAL (Matches Image 2)                  */}
                    {/* ══════════════════════════════════════════════════ */}
                    {activeTab === 'general' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* 1. CURRENCY */}
                        <div>
                          <SectionLabel>Currency</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              padding: 12,
                            }}
                          >
                            {/* Row 1: 5 Currencies */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
                              {standardCurrencies.slice(0, 5).map((c) => {
                                const isSelected = settings.currency === c;
                                return (
                                  <motion.button
                                    key={c}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      haptic('selection');
                                      updateSetting('currency', c);
                                      setIsEditingCustomCurrency(false);
                                    }}
                                    style={{
                                      height: 48,
                                      borderRadius: 14,
                                      background: isSelected ? activeTheme.hex : 'rgba(255, 255, 255, 0.05)',
                                      color: isSelected ? '#000000' : 'rgba(235, 235, 245, 0.85)',
                                      border: isSelected ? 'none' : '0.5px solid rgba(255, 255, 255, 0.06)',
                                      fontSize: 16,
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {c}
                                  </motion.button>
                                );
                              })}
                            </div>

                            {/* Row 2: 6th Currency (¥) + Custom Button */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 4fr', gap: 8 }}>
                              {/* ¥ button */}
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  haptic('selection');
                                  updateSetting('currency', '¥');
                                  setIsEditingCustomCurrency(false);
                                }}
                                style={{
                                  height: 48,
                                  borderRadius: 14,
                                  background: settings.currency === '¥' ? activeTheme.hex : 'rgba(255, 255, 255, 0.05)',
                                  color: settings.currency === '¥' ? '#000000' : 'rgba(235, 235, 245, 0.85)',
                                  border: settings.currency === '¥' ? 'none' : '0.5px solid rgba(255, 255, 255, 0.06)',
                                  fontSize: 16,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                ¥
                              </motion.button>

                              {/* Custom Currency Slot */}
                              {isEditingCustomCurrency ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <input
                                    type="text"
                                    maxLength={5}
                                    placeholder="e.g. AUD"
                                    value={customCurrency}
                                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                                    autoFocus
                                    style={{
                                      flex: 1,
                                      height: 48,
                                      borderRadius: 14,
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      border: `1.5px solid ${activeTheme.hex}`,
                                      color: '#FFFFFF',
                                      fontSize: 15,
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      outline: 'none',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      if (customCurrency.trim()) {
                                        updateSetting('currency', customCurrency.trim());
                                        haptic('success');
                                      }
                                      setIsEditingCustomCurrency(false);
                                    }}
                                    style={{
                                      padding: '0 16px',
                                      height: 48,
                                      borderRadius: 14,
                                      background: activeTheme.hex,
                                      color: '#000000',
                                      border: 'none',
                                      fontWeight: 700,
                                      fontSize: 14,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Set
                                  </motion.button>
                                </div>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setIsEditingCustomCurrency(true);
                                    setCustomCurrency(isCustomActive ? settings.currency : '');
                                  }}
                                  style={{
                                    height: 48,
                                    borderRadius: 14,
                                    background: isCustomActive ? activeTheme.hex : 'rgba(255, 255, 255, 0.05)',
                                    color: isCustomActive ? '#000000' : 'rgba(235, 235, 245, 0.85)',
                                    border: isCustomActive ? 'none' : '0.5px solid rgba(255, 255, 255, 0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span>{isCustomActive ? settings.currency : 'Custom'}</span>
                                  <span style={{ fontSize: 16 }}>+</span>
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. SECURITY GATE & BIOMETRICS */}
                        <div>
                          <SectionLabel>Security & Biometrics</SectionLabel>
                          <div
                            id="tour-security-section"
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 14,
                            }}
                          >
                            {/* Main Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 12,
                                    background: `${activeTheme.hex}22`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: activeTheme.hex,
                                    flexShrink: 0,
                                  }}
                                >
                                  <ShieldCheck size={20} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                    App Launch Gate
                                  </div>
                                  <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                    {hasFaceLock ? 'Fingerprint, Face Lock & 6-Digit PIN' : 'Fingerprint & 6-Digit PIN'}
                                  </div>
                                </div>
                              </div>

                              <Toggle
                                on={!!settings.useBiometricLock}
                                onToggle={() => {
                                  haptic('selection');
                                  const nextVal = !settings.useBiometricLock;
                                  updateSetting('useBiometricLock', nextVal);
                                  if (nextVal && !settings.securityPinHash) {
                                    setIsSetPinModalOpen(true);
                                  }
                                }}
                                color={activeTheme.hex}
                              />
                            </div>

                            {/* Sub-settings when Security Gate is enabled */}
                            {settings.useBiometricLock && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 12,
                                  paddingTop: 12,
                                  borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
                                }}
                              >
                                {/* 6-Digit PIN Row */}
                                <div
                                  onClick={() => {
                                    haptic('light');
                                    setIsSetPinModalOpen(true);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    borderRadius: 14,
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    border: '0.5px solid rgba(255, 255, 255, 0.06)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <KeyRound size={16} style={{ color: activeTheme.hex }} />
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
                                        6-Digit Security PIN
                                      </div>
                                      <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.45)' }}>
                                        {settings.securityPinHash ? 'Configured (●●●●●●)' : 'Not set (Tap to configure)'}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: activeTheme.hex, fontWeight: 600 }}>
                                      {settings.securityPinHash ? 'Change' : 'Set PIN'}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                                  </div>
                                </div>

                                {/* Preferred Launch Method */}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                                    Preferred Launch Method
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {[
                                      { id: 'any', label: 'All 3 (Any)' },
                                      { id: 'biometric', label: 'Biometrics' },
                                      { id: 'pin', label: '6-Digit PIN' },
                                    ].map((opt) => {
                                      const isSel = (settings.preferredUnlockMode || 'any') === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => {
                                            haptic('selection');
                                            updateSetting('preferredUnlockMode', opt.id);
                                          }}
                                          style={{
                                            flex: 1,
                                            height: 32,
                                            borderRadius: 10,
                                            border: isSel ? `1px solid ${activeTheme.hex}70` : '0.5px solid rgba(255, 255, 255, 0.08)',
                                            background: isSel ? `${activeTheme.hex}25` : 'rgba(255, 255, 255, 0.04)',
                                            color: isSel ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                                            fontSize: 11.5,
                                            fontWeight: isSel ? 600 : 500,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Auto-lock timeout */}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                                    Auto-Lock When Leaving App
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {[
                                      { val: 0, label: 'Immediately' },
                                      { val: 60, label: 'After 1 Min' },
                                      { val: 300, label: 'After 5 Min' },
                                    ].map((opt) => {
                                      const isSel = (settings.securityLockTimeout ?? 0) === opt.val;
                                      return (
                                        <button
                                          key={opt.val}
                                          type="button"
                                          onClick={() => {
                                            haptic('selection');
                                            updateSetting('securityLockTimeout', opt.val);
                                          }}
                                          style={{
                                            flex: 1,
                                            height: 32,
                                            borderRadius: 10,
                                            border: isSel ? `1px solid ${activeTheme.hex}70` : '0.5px solid rgba(255, 255, 255, 0.08)',
                                            background: isSel ? `${activeTheme.hex}25` : 'rgba(255, 255, 255, 0.04)',
                                            color: isSel ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                                            fontSize: 11.5,
                                            fontWeight: isSel ? 600 : 500,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. DUE REMINDERS & NOTIFICATIONS */}
                        <div>
                          <SectionLabel>Reminders & Alerts</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              padding: '14px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 12,
                                  background: `${activeTheme.hex}22`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: activeTheme.hex,
                                  flexShrink: 0,
                                }}
                              >
                                <Bell size={20} />
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                  Payment Reminders
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                  Notify when payments are due or overdue
                                </div>
                              </div>
                            </div>

                            <Toggle
                              on={settings.enableReminders !== false}
                              onToggle={async () => {
                                haptic('selection');
                                const nextVal = settings.enableReminders === false ? true : false;
                                if (nextVal) {
                                  await requestNotificationPermissions();
                                }
                                updateSetting('enableReminders', nextVal);
                              }}
                              color={activeTheme.hex}
                            />
                          </div>
                        </div>

                        {/* 4. THEME (Color Swatches - Matches Image 2) */}
                        <div>
                          <SectionLabel>Theme</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              padding: 16,
                            }}
                          >
                            {/* Card Header: THEME COLOR on left, Name on right */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Theme Color
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(235, 235, 245, 0.55)', textTransform: 'capitalize' }}>
                                {themes[settings.themeColor]?.name?.replace(/Cyber |Neon |Tron |Laser |Solar |Minimalist |Tokyo |Crimson |Aurora |Carbon /g, '') || settings.themeColor}
                              </span>
                            </div>

                            {/* 10 Color Swatches Grid (2 rows of 5) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                              {(Object.keys(themes) as ThemeColor[]).map((t) => {
                                const isSelected = settings.themeColor === t;
                                const themeHex = themes[t].hex;

                                return (
                                  <div key={t} style={{ display: 'flex', justifyContent: 'center' }}>
                                    <motion.button
                                      whileTap={{ scale: 0.88 }}
                                      onClick={() => {
                                        haptic('selection');
                                        updateSetting('themeColor', t);
                                      }}
                                      title={themes[t].name}
                                      style={{
                                        position: 'relative',
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        background: themeHex,
                                        border: isSelected ? '2.5px solid #FFFFFF' : 'none',
                                        boxShadow: isSelected ? `0 0 0 3px ${themeHex}60` : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                      }}
                                    >
                                      {isSelected && <Check size={18} color="#000000" strokeWidth={3} />}
                                    </motion.button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ══════════════════════════════════════════════════ */}
                    {/* TAB 2: LOOK & FEEL (Matches Image 3 Left)         */}
                    {/* ══════════════════════════════════════════════════ */}
                    {activeTab === 'visual' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* 1. BACKGROUND (Pitch Black vs Dark Grey) */}
                        <div>
                          <SectionLabel>Background</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              overflow: 'hidden',
                            }}
                          >
                            {[
                              { key: 'oled' as BaseColor, label: 'Pitch Black', sub: 'Pure OLED black' },
                              { key: 'slate' as BaseColor, label: 'Dark Grey', sub: 'Soft dark grey' },
                            ].map(({ key, label, sub }, i) => {
                              const isChecked = settings.baseColor === key;
                              return (
                                <div
                                  key={key}
                                  onClick={() => {
                                    haptic('selection');
                                    updateSetting('baseColor', key);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px',
                                    borderBottom: i === 0 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                      {label}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                      {sub}
                                    </div>
                                  </div>
                                  <RadioCheck checked={isChecked} color={activeTheme.hex} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. TEXTURE (Solid / Nebula / Grid) */}
                        <div>
                          <SectionLabel>Texture</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              overflow: 'hidden',
                            }}
                          >
                            {[
                              { key: 'solid' as BackgroundType, label: 'Solid' },
                              { key: 'nebula' as BackgroundType, label: 'Nebula' },
                              { key: 'grid' as BackgroundType, label: 'Grid' },
                            ].map(({ key, label }, i) => {
                              const isChecked = settings.background === key;
                              return (
                                <div
                                  key={key}
                                  onClick={() => {
                                    haptic('selection');
                                    updateSetting('background', key);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px',
                                    borderBottom: i < 2 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span style={{ fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{label}</span>
                                  <RadioCheck checked={isChecked} color={activeTheme.hex} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. EFFECTS (Film Grain + Sliders) */}
                        <div>
                          <SectionLabel>Effects</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Film Grain Toggle Row */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 16px',
                                borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: `${activeTheme.hex}22`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: activeTheme.hex,
                                  }}
                                >
                                  <Film size={18} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Film Grain</div>
                                  <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                    Adds analog film texture
                                  </div>
                                </div>
                              </div>
                              <Toggle
                                on={!!settings.enableGrain}
                                onToggle={() => {
                                  haptic('double');
                                  updateSetting('enableGrain', !settings.enableGrain);
                                }}
                                color={activeTheme.hex}
                              />
                            </div>

                            {/* Sliders Rows */}
                            {[
                              { key: 'glassBlur', label: 'Blur Strength', min: 0, max: 40, step: 2, display: `${settings.glassBlur}px`, isInt: true },
                              { key: 'glassOpacity', label: 'Card Opacity', min: 0.2, max: 0.95, step: 0.05, display: `${Math.round(settings.glassOpacity * 100)}%`, isInt: false },
                              { key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.1, display: `${Math.round(settings.glowIntensity * 100)}%`, isInt: false },
                            ].map(({ key, label, min, max, step, display, isInt }, i) => (
                              <div
                                key={key}
                                style={{
                                  padding: '12px 16px',
                                  borderBottom: i < 2 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(235, 235, 245, 0.8)' }}>
                                    {label}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(235, 235, 245, 0.5)' }}>
                                    {display}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={min}
                                  max={max}
                                  step={step}
                                  value={(settings as any)[key]}
                                  onChange={(e) => updateSetting(key as any, isInt ? parseInt(e.target.value) : parseFloat(e.target.value))}
                                  style={{
                                    width: '100%',
                                    accentColor: activeTheme.hex,
                                    height: 5,
                                    cursor: 'pointer',
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ══════════════════════════════════════════════════ */}
                    {/* TAB 3: LAYOUT (Matches Image 3 Right)             */}
                    {/* ══════════════════════════════════════════════════ */}
                    {activeTab === 'layout' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* 1. INPUT METHOD */}
                        <div>
                          <SectionLabel>Input Method</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 16px',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                  Virtual Keyboard
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                  Custom keyboard design
                                </div>
                              </div>
                              <Toggle
                                on={!!settings.useVirtualKeyboard}
                                onToggle={() => {
                                  haptic('double');
                                  updateSetting('useVirtualKeyboard', !settings.useVirtualKeyboard);
                                }}
                                color={activeTheme.hex}
                              />
                            </div>

                            {/* Keyboard Sub-Settings if enabled */}
                            <AnimatePresence>
                              {settings.useVirtualKeyboard && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  {/* Scale slider */}
                                  <div style={{ padding: '10px 16px', borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                      <span style={{ fontSize: 14, color: 'rgba(235,235,245,0.7)' }}>Keyboard Scale</span>
                                      <span style={{ fontSize: 12, color: 'rgba(235,235,245,0.45)' }}>{Math.round((settings.keyboardScale || 1) * 100)}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={0.8}
                                      max={1.2}
                                      step={0.05}
                                      value={settings.keyboardScale || 1}
                                      onChange={(e) => updateSetting('keyboardScale', parseFloat(e.target.value))}
                                      style={{ width: '100%', accentColor: activeTheme.hex }}
                                    />
                                  </div>

                                  {/* Skin buttons */}
                                  <div style={{ padding: '10px 16px 14px', borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 12, color: 'rgba(235,235,245,0.4)', marginBottom: 8 }}>Keyboard Skin</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      {(['dark', 'grey', 'light'] as const).map((t) => (
                                        <button
                                          key={t}
                                          onClick={() => {
                                            haptic('selection');
                                            updateSetting('keyboardTheme', t);
                                          }}
                                          style={{
                                            flex: 1,
                                            height: 38,
                                            borderRadius: 12,
                                            background: settings.keyboardTheme === t ? activeTheme.hex : 'rgba(255,255,255,0.06)',
                                            color: settings.keyboardTheme === t ? '#000' : 'rgba(235,235,245,0.7)',
                                            fontFamily: 'inherit',
                                            fontWeight: 600,
                                            fontSize: 13,
                                            border: 'none',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize',
                                          }}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* 2. DENSITY (Comfortable vs Compact) */}
                        <div>
                          <SectionLabel>Density</SectionLabel>
                          <div
                            style={{
                              background: cardBg,
                              border: cardBorder,
                              borderRadius: 20,
                              margin: '0 16px',
                              overflow: 'hidden',
                            }}
                          >
                            {[
                              { key: 'comfortable' as Density, label: 'Comfortable', sub: 'More spacing' },
                              { key: 'compact' as Density, label: 'Compact', sub: 'Denser layout' },
                            ].map(({ key, label, sub }, i) => {
                              const isChecked = settings.density === key;
                              return (
                                <div
                                  key={key}
                                  onClick={() => {
                                    haptic('selection');
                                    updateSetting('density', key);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px',
                                    borderBottom: i === 0 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                      {label}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                                      {sub}
                                    </div>
                                  </div>
                                  <RadioCheck checked={isChecked} color={activeTheme.hex} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. CORNER STYLE (Sharp / Round / Pill - Matches Image 3) */}
                        <div>
                          <SectionLabel>Corner Style</SectionLabel>
                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              margin: '0 16px',
                            }}
                          >
                            {(['sharp', 'round', 'pill'] as CornerRadius[]).map((r) => {
                              const isSelected = settings.cornerRadius === r;
                              return (
                                <motion.button
                                  key={r}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => {
                                    haptic('selection');
                                    updateSetting('cornerRadius', r);
                                  }}
                                  style={{
                                    flex: 1,
                                    height: 52,
                                    borderRadius: 16,
                                    background: isSelected ? activeTheme.hex : cardBg,
                                    color: isSelected ? '#000000' : 'rgba(235, 235, 245, 0.8)',
                                    border: isSelected ? 'none' : cardBorder,
                                    fontFamily: 'inherit',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {r}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Footer: Version & Check Update */}
                <div style={{ textAlign: 'center', padding: '16px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.4)', fontWeight: 500 }}>
                    App version v{APP_VERSION}
                  </span>
                  <button
                    type="button"
                    disabled={isCheckingUpdate}
                    onClick={handleCheckUpdate}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      color: activeTheme.hex,
                      fontSize: 11.5,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: isCheckingUpdate ? 'wait' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <RefreshCw size={12} className={isCheckingUpdate ? 'animate-spin' : ''} />
                    <span>{isCheckingUpdate ? 'Checking for updates...' : 'Check for Updates'}</span>
                  </button>
                </div>
              </div>

              {/* Desktop Live Preview Panel */}
              <div
                className="hidden md:flex"
                style={{
                  width: 240,
                  flexShrink: 0,
                  borderLeft: '0.5px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '20px 0',
                  overflowY: 'auto',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
              >
                <PreviewCard settings={settings} activeTheme={activeTheme} />
              </div>
            </div>
          </motion.div>

          <SetPinModal
            isOpen={isSetPinModalOpen}
            onClose={() => setIsSetPinModalOpen(false)}
            activeTheme={activeTheme}
            currentPinHash={settings.securityPinHash}
            onPinSaved={(newHash) => updateSetting('securityPinHash', newHash)}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
