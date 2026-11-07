import React, { useState } from 'react';
import {
  Settings, HelpCircle, Download, LogOut, AlertTriangle, X, Type, Pencil,
  ChevronRight, Code2, FolderUp, ShieldAlert, Mail, ExternalLink, Sparkles, User,
  ShieldCheck, Copy, Check, Trophy
} from 'lucide-react';
import { AppSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoIcon } from './Logo';
import { resetDB } from '../utils/db';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { useHaptics } from '../hooks/useHaptics';
import { useBackHandler } from '../utils/backHandler';
import { APP_VERSION } from '../utils/version';
import Mascot3D from './Mascot3D';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
  setTourStep: (step: number) => void;
  onOpenTutorialSelection: (fromMenu?: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  handleExport: (fromMenu?: boolean) => void;
  onLogout: () => void;
  onOpenTypographyModal: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  updateSetting: (key: keyof AppSettings, value: any) => void;
}

const Navbar: React.FC<Props> = ({
  settings,
  activeTheme,
  tourStep,
  setTourStep,
  onOpenTutorialSelection,
  setIsSettingsModalOpen,
  handleExport,
  onLogout,
  onOpenTypographyModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  updateSetting,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [devCreditCelebrate, setDevCreditCelebrate] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.userName);
  const haptic = useHaptics();

  // Android hardware/gesture back button handler for Developer Credit Modal
  useBackHandler(showCreditsModal, () => {
    setShowCreditsModal(false);
    return true;
  });

  const kbName = useVirtualKeyboard('text', setTempName);

  const handleFactoryReset = async () => {
    haptic('heavy');
    await resetDB();
    localStorage.clear();
    window.location.reload();
  };

  const saveName = () => {
    if (tempName.trim()) {
      haptic('success');
      updateSetting('userName', tempName);
    }
    setIsEditingName(false);
  };

  const isOled = settings.baseColor === 'oled';
  const sheetBg = isOled ? '#000000' : '#141416';
  const cardBg = isOled ? 'rgba(255, 255, 255, 0.05)' : '#1C1C1E';
  const cardBorder = isOled ? '0.5px solid rgba(255, 255, 255, 0.08)' : '0.5px solid rgba(255, 255, 255, 0.06)';

  return (
    <>
      {/* ─── MOBILE TOP NAV BAR ─── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-end justify-between px-5 pb-3"
        style={{
          paddingTop: 'calc(var(--sat) + 12px)',
          background: isOled ? 'rgba(0,0,0,0.85)' : 'rgba(20,20,22,0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-3">
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden' }}>
            <LogoIcon activeTheme={activeTheme} size="100%" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: 0,
              }}
            >
              {settings.userName}
            </h1>
            <button
              onClick={() => {
                haptic('light');
                setTempName(settings.userName);
                setIsEditingName(true);
              }}
              style={{
                padding: '4px 6px',
                borderRadius: 7,
                background: 'rgba(120,120,128,0.16)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Pencil size={11} style={{ color: 'rgba(235,235,245,0.5)' }} />
            </button>
          </div>
        </div>

        {/* Right: Menu button */}
        <motion.button
          id="tour-menu-button"
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            haptic('light');
            setIsMobileMenuOpen(true);
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'rgba(120,120,128,0.18)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ width: 16, height: 1.5, borderRadius: 1, background: 'rgba(235,235,245,0.85)', display: 'block' }} />
            <span style={{ width: 12, height: 1.5, borderRadius: 1, background: 'rgba(235,235,245,0.85)', display: 'block' }} />
            <span style={{ width: 16, height: 1.5, borderRadius: 1, background: 'rgba(235,235,245,0.85)', display: 'block' }} />
          </div>
        </motion.button>
      </header>

      {/* ─── MOBILE BOTTOM SHEET MENU (IMAGE 1 TEMPLATE) ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
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
                maxWidth: 480,
                maxHeight: '92vh',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                background: sheetBg,
                border: '0.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 -16px 48px rgba(0,0,0,0.8)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
              }}
              className="scrollbar-hide"
            >
              {/* Ambient radial accent glow behind the top header */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '90%',
                  height: 180,
                  background: `radial-gradient(ellipse at top center, ${activeTheme.hex}28 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />

              {/* Grab handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              </div>

              {/* Top Bar: "Menu" + Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', position: 'relative', zIndex: 1 }}>
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
                  Menu
                </h2>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
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

              {/* Profile Card Header */}
              <div style={{ textAlign: 'center', padding: '6px 20px 20px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    position: 'relative',
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    margin: '0 auto 10px',
                    background: `linear-gradient(135deg, ${activeTheme.hex}30, rgba(255,255,255,0.08))`,
                    border: `1.5px solid ${activeTheme.hex}70`,
                    boxShadow: `0 8px 24px ${activeTheme.hex}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                      textTransform: 'uppercase',
                    }}
                  >
                    {settings.userName ? settings.userName.charAt(0) : 'L'}
                  </span>
                  {/* Subtle verified dot */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: activeTheme.hex,
                      border: `2px solid ${sheetBg}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: '#000' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    haptic('light');
                    setTempName(settings.userName);
                    setIsEditingName(true);
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 19,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#FFFFFF',
                    }}
                  >
                    {settings.userName || 'User'}
                  </h3>
                  <Pencil size={13} style={{ color: 'rgba(235, 235, 245, 0.4)' }} />
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(235, 235, 245, 0.45)',
                    marginTop: 3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Offline Personal Ledger
                </div>
              </div>

              {/* Sections Container */}
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>
                {/* 1. PREFERENCES */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 8px' }}>
                    Preferences
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Settings Row */}
                    <motion.button
                      id="tour-settings"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(245, 158, 11, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F59E0B',
                          flexShrink: 0,
                        }}
                      >
                        <Settings size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                          Settings
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                          Theme, currency, security
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>

                    {/* Typography Row */}
                    <motion.button
                      id="tour-typography"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        onOpenTypographyModal();
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(139, 92, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A78BFA',
                          flexShrink: 0,
                        }}
                      >
                        <Type size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                          Typography
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                          Font style
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>

                    {/* Developer Credit Row */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        setShowCreditsModal(true);
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(100, 210, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64D2FF',
                          flexShrink: 0,
                        }}
                      >
                        <Code2 size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                            Developer Credit
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 6,
                              background: `${activeTheme.hex}25`,
                              color: activeTheme.hex,
                              letterSpacing: '0.02em',
                            }}
                          >
                            3D EVE ✨
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                          Architect: Abhinav Yaduwanshi
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>
                  </div>
                </div>

                {/* 2. DATA & SUPPORT */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 8px' }}>
                    Data & Support
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Backup Data */}
                    <motion.button
                      id="tour-backup"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        handleExport(true);
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10B981',
                          flexShrink: 0,
                        }}
                      >
                        <ShieldCheck size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                          Backup & Vault
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                          Encrypted backup & Excel dossier
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>

                    {/* Help & Tutorial */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        onOpenTutorialSelection(true);
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(10, 132, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0A84FF',
                          flexShrink: 0,
                        }}
                      >
                        <HelpCircle size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                          Help & Tutorial
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                          Learn how to use Ledger
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>
                  </div>
                </div>

                {/* 3. ACCOUNT */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 8px' }}>
                    Account
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Reset App */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('heavy');
                        setIsMobileMenuOpen(false);
                        setShowResetConfirm(true);
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(255, 69, 58, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FF453A',
                          flexShrink: 0,
                        }}
                      >
                        <ShieldAlert size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#FF453A', letterSpacing: '-0.01em' }}>
                          Reset App
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(255, 69, 58, 0.4)' }} />
                    </motion.button>

                    {/* Log Out */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        haptic('light');
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: 16,
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(235, 235, 245, 0.6)',
                          flexShrink: 0,
                        }}
                      >
                        <LogOut size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(235, 235, 245, 0.85)', letterSpacing: '-0.01em' }}>
                          Log Out
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgba(235, 235, 245, 0.3)' }} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Version Footer */}
              <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.35)', fontWeight: 500 }}>
                  App version v{APP_VERSION}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CINEMATIC DEVELOPER CREDIT MODAL WITH 3D MASCOT ─── */}
      <AnimatePresence>
        {showCreditsModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreditsModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 4, 8, 0.84)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 390,
                background: 'linear-gradient(180deg, rgba(16, 20, 30, 0.96) 0%, rgba(8, 10, 16, 0.98) 100%)',
                border: `1px solid ${activeTheme.hex}35`,
                borderRadius: 28,
                boxShadow: `0 24px 70px rgba(0,0,0,0.85), 0 0 50px ${activeTheme.hex}20`,
                padding: '20px 18px 22px',
                textAlign: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                zIndex: 10,
                maxHeight: '92vh',
                overflowY: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {/* Ambient radial glow in background */}
              <div
                style={{
                  position: 'absolute',
                  top: '-15%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '85%',
                  height: '45%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${activeTheme.hex}32 0%, transparent 70%)`,
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                }}
              />

              {/* Close Button at top-right */}
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setShowCreditsModal(false);
                }}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 25,
                }}
              >
                <X size={16} />
              </button>

              {/* Holographic Header Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: `${activeTheme.hex}18`,
                  border: `0.5px solid ${activeTheme.hex}44`,
                  marginBottom: 4,
                }}
              >
                <Sparkles size={12} color={activeTheme.hex} />
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: activeTheme.hex,
                  }}
                >
                  SYSTEM ARCHITECT CREDITS
                </span>
              </div>

              {/* Interactive 3D Mascot hovering in calm idle mode with live physics */}
              <div style={{ width: '100%', margin: '-14px 0 -12px', display: 'flex', justifyContent: 'center' }}>
                <Mascot3D
                  mood="idle"
                  accentColor={activeTheme.hex}
                  celebrateTrigger={devCreditCelebrate}
                  isDeveloperCredit={true}
                  onTap={() => {
                    haptic('selection');
                    setDevCreditCelebrate((c) => c + 1);
                  }}
                />
              </div>

              {/* Developer Identity Card */}
              <div style={{ marginTop: 2, marginBottom: 14 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 21,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    lineHeight: 1.2,
                  }}
                >
                  Abhinav Yaduwanshi
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(235, 235, 245, 0.65)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Architect & Lead Developer
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '0.5px solid rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      fontWeight: 700,
                    }}
                  >
                    ID: ABHI_1289
                  </span>
                </div>
              </div>

              {/* Feature telemetry chips */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    color: 'rgba(235, 235, 245, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  🛡️ 100% Offline Vault
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    color: 'rgba(235, 235, 245, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  🔒 AES-256 Encrypted
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    color: 'rgba(235, 235, 245, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  ✨ Pixar 3D Engine
                </span>
              </div>

              {/* Links & Interactive Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
                {/* Email with 1-tap Copy */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: 14,
                    background: cardBg,
                    border: cardBorder,
                  }}
                >
                  <a
                    href="mailto:abhiyaduvanshi@zohomail.in"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: 12.5,
                      fontWeight: 500,
                      minWidth: 0,
                    }}
                  >
                    <Mail size={16} color={activeTheme.hex} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      abhiyaduvanshi@zohomail.in
                    </span>
                  </a>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => {
                      haptic('success');
                      navigator.clipboard.writeText('abhiyaduvanshi@zohomail.in');
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2200);
                      window.dispatchEvent(
                        new CustomEvent('abhi-ledger-toast', {
                          detail: { message: 'Email copied to clipboard! 📋', type: 'success' },
                        })
                      );
                    }}
                    style={{
                      background: copiedEmail ? `${activeTheme.hex}25` : 'rgba(255, 255, 255, 0.06)',
                      border: copiedEmail
                        ? `1px solid ${activeTheme.hex}`
                        : '0.5px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      padding: '5px 8px',
                      color: copiedEmail ? activeTheme.hex : 'rgba(255, 255, 255, 0.7)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {copiedEmail ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </motion.button>
                </div>

                {/* Visit Web App Link */}
                <a
                  href="https://abhis-ledger.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: `${activeTheme.hex}14`,
                    border: `1px solid ${activeTheme.hex}38`,
                    color: activeTheme.hex,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: `0 2px 12px ${activeTheme.hex}15`,
                  }}
                >
                  <Sparkles size={15} />
                  <span>Visit Web Application</span>
                  <ExternalLink size={13} style={{ opacity: 0.6 }} />
                </a>

                {/* Interactive Cheer/Applaud Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => {
                    haptic('success');
                    setDevCreditCelebrate((c) => c + 1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '11px 14px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Trophy size={14} color="#fbbf24" />
                  <span>Send EVE Cheer to Abhi 👏</span>
                </motion.button>
              </div>

              {/* Close Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  haptic('light');
                  setShowCreditsModal(false);
                }}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 14,
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.15)',
                }}
              >
                Done
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP LEFT NAVIGATION RAIL ─── */}
      <nav
        className="hidden md:flex fixed z-50 top-0 left-0 h-screen w-24 flex-col justify-between py-6"
        style={{
          background: isOled ? 'rgba(12,12,14,0.92)' : 'rgba(20,20,22,0.92)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderRight: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-2 px-2">
          <div style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden' }}>
            <LogoIcon activeTheme={activeTheme} size="100%" />
          </div>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '-0.01em',
            color: 'rgba(235,235,245,0.5)', textAlign: 'center',
            maxWidth: 72, wordBreak: 'break-word', lineHeight: 1.3,
            margin: 0,
          }}>
            {settings.userName}
          </p>
          <button
            onClick={() => { haptic('light'); setTempName(settings.userName); setIsEditingName(true); }}
            style={{
              padding: '3px 7px', borderRadius: 6,
              background: 'rgba(120,120,128,0.16)', border: 'none', cursor: 'pointer',
            }}
          >
            <Pencil size={10} style={{ color: 'rgba(235,235,245,0.4)' }} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col items-center gap-2 w-full">
          {[
            { icon: Settings, label: 'Settings', id: 'tour-settings-desktop', onClick: () => setIsSettingsModalOpen(true), color: '#F59E0B' },
            { icon: Type, label: 'Fonts', id: 'tour-typography-desktop', onClick: onOpenTypographyModal, color: '#A78BFA' },
            { icon: HelpCircle, label: 'Help', onClick: () => onOpenTutorialSelection(false), color: '#0A84FF' },
            { icon: Download, label: 'Backup', id: 'tour-backup-desktop', onClick: () => handleExport(false), color: '#10B981' },
          ].map((item) => (
            <motion.button
              key={item.label}
              id={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptic('light'); item.onClick(); }}
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(120,120,128,0.12)', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}
              title={item.label}
            >
              <item.icon size={20} style={{ color: item.color }} />
              <span style={{ fontSize: 9, color: 'rgba(235,235,245,0.5)', fontWeight: 500 }}>{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Danger zone bottom */}
        <div className="flex flex-col items-center gap-2 w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreditsModal(true)}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(100, 210, 255, 0.1)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Developer Credits"
          >
            <Code2 size={18} style={{ color: '#64D2FF' }} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,59,48,0.12)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Reset App"
          >
            <AlertTriangle size={18} style={{ color: '#FF453A' }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(120,120,128,0.12)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Log Out"
          >
            <LogOut size={18} style={{ color: 'rgba(235,235,245,0.6)' }} />
          </motion.button>
        </div>
      </nav>

      {/* ─── RENAME NAME MODAL ─── */}
      <AnimatePresence>
        {isEditingName && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingName(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: 360, background: sheetBg, border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 24, padding: 22, zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Edit Your Name</span>
                <button onClick={() => setIsEditingName(false)} style={{ background: 'none', border: 'none', color: 'rgba(235,235,245,0.5)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input {...kbName} value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus style={{ width: '100%', height: 48, background: cardBg, border: cardBorder, borderRadius: 14, padding: '0 16px', fontSize: 16, color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setIsEditingName(false)} style={{ flex: 1, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(235,235,245,0.7)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveName} style={{ flex: 1, height: 46, borderRadius: 14, background: activeTheme.hex, border: 'none', color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FACTORY RESET CONFIRMATION ─── */}
      <AnimatePresence>
        {showResetConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: 360, background: sheetBg, border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 24, padding: 24, textAlign: 'center', zIndex: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(255,59,48,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#FF453A' }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Reset Ledger?</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, color: 'rgba(235,235,245,0.6)', lineHeight: 1.45 }}>This will permanently erase all contacts, loans, payments, and settings from this device.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={handleFactoryReset} style={{ width: '100%', height: 46, borderRadius: 14, background: '#FF3B30', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Erase Everything</button>
                <button onClick={() => setShowResetConfirm(false)} style={{ width: '100%', height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(235,235,245,0.8)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
