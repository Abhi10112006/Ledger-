
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, UserPlus, WifiOff, X } from 'lucide-react';
import { useLedger } from './hooks/useLedger';
import { useAdManager } from './hooks/useAdManager';
import { getMeta, saveMeta } from './utils/db';
import { checkForUpdate, scheduleBackgroundUpdateCheck, VersionInfo } from './utils/version';
import { notifyNewAppVersionAvailable } from './utils/notifications';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import SettingsModal from './components/SettingsModal';
import DealModal from './components/DealModal';
import PaymentModal from './components/PaymentModal';
import EditDateModal from './components/EditDateModal';
import DeleteModal from './components/DeleteModal';
import TourOverlay from './components/TourOverlay';
import TutorialSelectionModal from './components/TutorialSelectionModal';
import WelcomeScreen from './components/WelcomeScreen';
import SponsorModal from './components/SponsorModal';
import AccountRow from './components/AccountRow';
import ProfileView from './components/ProfileView';
import TypographyModal from './components/TypographyModal';
import ActiveDealsModal from './components/ActiveDealsModal';
import { BackupModal } from './components/BackupModal';
import ErrorBoundary from './components/ErrorBoundary';
import VirtualKeyboard from './components/VirtualKeyboard';
import SystemBoot from './components/SystemBoot';
import UpdateBanner from './components/UpdateBanner';
import BiometricLockScreen from './components/BiometricLockScreen';
import { KeyboardProvider, useKeyboard } from './contexts/KeyboardContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { useHaptics, triggerHaptic } from './hooks/useHaptics';
import { useDebounce } from './hooks/useDebounce';
import { useBackHandler, executeTopBackHandler } from './utils/backHandler';
import { Capacitor } from '@capacitor/core';
import { NativeSecurity } from './utils/securityPin';

const TOUR_KEY = 'abhi_ledger_tour_complete_v9';
const CURRENCIES = ['₹', '$', '€', '₩', '£', '¥'];

const THEMES: Record<string, any> = {
  emerald: { name: 'Cyber Emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/30', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-600 via-emerald-400 to-teal-400', hex: '#10b981', rgb: '16, 185, 129' },
  violet: { name: 'Neon Violet', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30', shadow: 'shadow-violet-500/20', gradient: 'from-violet-600 via-violet-400 to-fuchsia-400', hex: '#8b5cf6', rgb: '139, 92, 246' },
  blue: { name: 'Tron Blue', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/30', shadow: 'shadow-blue-500/20', gradient: 'from-blue-600 via-blue-400 to-cyan-400', hex: '#3b82f6', rgb: '59, 130, 246' },
  rose: { name: 'Laser Rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/30', shadow: 'shadow-rose-500/20', gradient: 'from-rose-600 via-rose-400 to-pink-400', hex: '#f43f5e', rgb: '244, 63, 94' },
  amber: { name: 'Solar Amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/30', shadow: 'shadow-amber-500/20', gradient: 'from-amber-600 via-amber-400 to-orange-400', hex: '#f59e0b', rgb: '245, 158, 11' },
  platinum: { name: 'Minimalist Platinum', bg: 'bg-slate-300', text: 'text-slate-300', border: 'border-slate-300/30', ring: 'ring-slate-300/30', shadow: 'shadow-slate-300/20', gradient: 'from-slate-400 via-slate-300 to-zinc-200', hex: '#cbd5e1', rgb: '203, 213, 225' },
  tokyo: { name: 'Tokyo Sunset', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/30', ring: 'ring-pink-500/30', shadow: 'shadow-pink-500/20', gradient: 'from-pink-500 via-purple-500 to-orange-400', hex: '#ec4899', rgb: '236, 72, 153' },
  crimson: { name: 'Crimson Protocol', bg: 'bg-red-600', text: 'text-red-400', border: 'border-red-600/30', ring: 'ring-red-600/30', shadow: 'shadow-red-600/20', gradient: 'from-red-700 via-rose-500 to-amber-500', hex: '#dc2626', rgb: '220, 38, 38' },
  aurora: { name: 'Aurora Glow', bg: 'bg-teal-400', text: 'text-teal-300', border: 'border-teal-400/30', ring: 'ring-teal-400/30', shadow: 'shadow-teal-400/20', gradient: 'from-teal-400 via-emerald-400 to-yellow-300', hex: '#2dd4bf', rgb: '45, 212, 191' },
  carbon: { name: 'Carbon Stealth', bg: 'bg-zinc-600', text: 'text-zinc-400', border: 'border-zinc-600/30', ring: 'ring-zinc-600/30', shadow: 'shadow-zinc-600/20', gradient: 'from-zinc-700 via-zinc-600 to-slate-500', hex: '#52525b', rgb: '82, 82, 91' }
};

const AppContent: React.FC = () => {
  const [tourStep, setTourStep] = useState<number>(-1);
  const [isBooting, setIsBooting] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [offlineToast, setOfflineToast] = useState<'offline' | 'online' | null>(null);

  useEffect(() => {
    let timer: any = null;

    const handleOnline = () => {
      clearTimeout(timer);
      setOfflineToast('online');
      timer = setTimeout(() => setOfflineToast(null), 2500);
    };

    const handleOffline = () => {
      clearTimeout(timer);
      setOfflineToast('offline');
      // Auto-hide after 3.5 seconds
      timer = setTimeout(() => setOfflineToast(null), 3500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const haptic = useHaptics();

  // Modal States
  const [isDashboardDealModalOpen, setIsDashboardDealModalOpen] = useState(false);
  const [isProfileDealModalOpen, setIsProfileDealModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
  const [isActiveDealsModalOpen, setIsActiveDealsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const activeTxIdRef = useRef<string | null>(null);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [activeRepaymentId, setActiveRepaymentId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const {
    transactions, settings, isLoggedIn, accounts, allAccounts, stats,
    setIsLoggedIn, updateSetting, addLoan, addPayment, addProfilePayment, editTransaction, editRepayment,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, restoreBackupData
  } = useLedger(tourStep, debouncedSearchQuery);

  const { currentAd, isAdOpen, closeAd, checkEligibility } = useAdManager(isLoggedIn);

  // Keyboard Context Sync
  const { setEnabled: setKeyboardEnabled, closeKeyboard, isVisible: isKeyboardVisible } = useKeyboard();

  useEffect(() => {
    setKeyboardEnabled(!!settings.useVirtualKeyboard);
  }, [settings.useVirtualKeyboard, setKeyboardEnabled]);

  // Initialize virtual keyboard for search
  const kbSearch = useVirtualKeyboard('text', setSearchQuery);

  const activeTheme = THEMES[settings.themeColor] || THEMES.emerald;
  const activeTx = transactions.find(t => t.id === activeTxId);
  const activeRepayment = activeTx?.repayments.find(r => r.id === activeRepaymentId);
  const activeProfile = allAccounts.find(a => a.id === selectedProfileId);

  // --- Check for updates once after boot and schedule periodic background check ---
  useEffect(() => {
    scheduleBackgroundUpdateCheck();

    if (!isLoggedIn) return;
    // Delay check by 3 seconds after login so it doesn't block the UI
    const timer = setTimeout(async () => {
      const update = await checkForUpdate();
      if (update) {
        setUpdateInfo(update);
        notifyNewAppVersionAvailable(update);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const closeModal = useCallback(() => {
    setIsDashboardDealModalOpen(false);
    setIsProfileDealModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditDateModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setIsBackupModalOpen(false);
    setBackupOriginMenu(false);
    setTutorialOriginMenu(false);
    setIsMobileMenuOpen(false);
    setActiveRepaymentId(null);
    closeAd();
    closeKeyboard();
  }, [closeAd, closeKeyboard]);

  const handleLogout = useCallback(() => {
    haptic('light');
    setIsMobileMenuOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsDashboardDealModalOpen(false);
    setIsProfileDealModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setIsBackupModalOpen(false);
    setActiveRepaymentId(null);
    closeAd();
    closeKeyboard();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('abhi_ledger_is_logged_out', 'true');
      localStorage.removeItem('abhi_ledger_logged_in');
    }
    setIsLoggedIn(false);
  }, [closeAd, setIsLoggedIn, closeKeyboard, haptic]);

  const [profileOriginModal, setProfileOriginModal] = useState<'active-deals' | 'search' | null>(null);
  const [typographyOrigin, setTypographyOrigin] = useState<'settings' | 'menu' | null>(null);
  const [settingsOriginMenu, setSettingsOriginMenu] = useState(false);
  const [backupOriginMenu, setBackupOriginMenu] = useState(false);
  const [tutorialOriginMenu, setTutorialOriginMenu] = useState(false);

  const navigateToProfile = (profileId: string, origin: 'active-deals' | 'search' | null = null) => {
    setProfileOriginModal(origin);
    setSelectedProfileId(profileId);
  };

  const handleCloseProfile = useCallback(() => {
    setSelectedProfileId(null);
    if (profileOriginModal === 'active-deals') {
      setIsActiveDealsModalOpen(true);
    }
    setProfileOriginModal(null);
  }, [profileOriginModal]);

  const handleOpenTypography = (origin: 'settings' | 'menu' | null = null) => {
    setTypographyOrigin(origin);
    setIsTypographyModalOpen(true);
  };

  const handleCloseTypography = useCallback(() => {
    setIsTypographyModalOpen(false);
    if (typographyOrigin === 'settings') {
      setIsSettingsModalOpen(true);
    } else if (typographyOrigin === 'menu') {
      setIsMobileMenuOpen(true);
    }
    setTypographyOrigin(null);
  }, [typographyOrigin]);

  const handleOpenSettings = (fromMenu = false) => {
    setSettingsOriginMenu(fromMenu);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = useCallback(() => {
    setIsSettingsModalOpen(false);
    if (settingsOriginMenu) {
      setSettingsOriginMenu(false);
      setIsMobileMenuOpen(true);
    }
  }, [settingsOriginMenu]);

  const handleOpenBackup = (fromMenu = false) => {
    setBackupOriginMenu(fromMenu);
    setIsBackupModalOpen(true);
  };

  const handleCloseBackup = useCallback(() => {
    setIsBackupModalOpen(false);
    if (backupOriginMenu) {
      setBackupOriginMenu(false);
      setIsMobileMenuOpen(true);
    }
  }, [backupOriginMenu]);

  const handleOpenTutorial = (fromMenu = false) => {
    setTutorialOriginMenu(fromMenu);
    setIsTutorialModalOpen(true);
  };

  const handleCloseTutorial = useCallback(() => {
    setIsTutorialModalOpen(false);
    if (tutorialOriginMenu) {
      setTutorialOriginMenu(false);
      setIsMobileMenuOpen(true);
    }
  }, [tutorialOriginMenu]);

  const handleBackAction = useCallback(() => {
    handleCloseProfile();
  }, [handleCloseProfile]);

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  };

  // Register LIFO Back Handlers for true native Android hierarchical navigation
  useBackHandler(isAdOpen, () => { closeAd(); });
  useBackHandler(isDeleteModalOpen, () => { setIsDeleteModalOpen(false); });
  useBackHandler(isEditDateModalOpen, () => { setIsEditDateModalOpen(false); });
  useBackHandler(isPaymentModalOpen, () => { setIsPaymentModalOpen(false); });
  useBackHandler(isDashboardDealModalOpen, () => { setIsDashboardDealModalOpen(false); });
  useBackHandler(isProfileDealModalOpen, () => { setIsProfileDealModalOpen(false); });
  useBackHandler(isBackupModalOpen, () => { handleCloseBackup(); });
  useBackHandler(isTutorialModalOpen, () => { handleCloseTutorial(); });
  useBackHandler(tourStep >= 0, () => { handleCompleteTour(); });
  useBackHandler(isTypographyModalOpen, () => { handleCloseTypography(); });
  useBackHandler(isSettingsModalOpen, () => { handleCloseSettings(); });
  useBackHandler(isActiveDealsModalOpen, () => { setIsActiveDealsModalOpen(false); });
  useBackHandler(!!selectedProfileId, () => { handleCloseProfile(); });
  useBackHandler(isMobileMenuOpen, () => { setIsMobileMenuOpen(false); });
  useBackHandler(searchQuery.trim().length > 0, () => {
    setSearchQuery('');
    closeKeyboard();
  });

  const closeTopmost = useCallback(() => {
    // Logic to close only the TOPMOST UI element
    // Priority must match the visual stacking order (Z-Index)

    // 1. Critical Overlays
    if (isDeleteModalOpen) { setIsDeleteModalOpen(false); return; }

    // 2. Secondary Modals
    if (isEditDateModalOpen) { setIsEditDateModalOpen(false); return; }
    if (isPaymentModalOpen) { setIsPaymentModalOpen(false); return; }
    if (isDashboardDealModalOpen) { setIsDashboardDealModalOpen(false); return; }
    if (isProfileDealModalOpen) { setIsProfileDealModalOpen(false); return; }

    // 3. Full Screen / Main Modals
    if (tourStep >= 0) { handleCompleteTour(); return; }
    if (isTutorialModalOpen) { handleCloseTutorial(); return; }
    if (isBackupModalOpen) { handleCloseBackup(); return; }
    if (isSettingsModalOpen) { setIsSettingsModalOpen(false); return; }
    if (isTypographyModalOpen) { setIsTypographyModalOpen(false); return; }

    // 4. Content Layers
    if (isActiveDealsModalOpen) { setIsActiveDealsModalOpen(false); return; }

    // 5. Profile View
    if (selectedProfileId) { setSelectedProfileId(null); return; }

    // 6. Base Modals
    if (isMobileMenuOpen) { setIsMobileMenuOpen(false); return; }

    // Fallback
    if (isAdOpen) { closeAd(); }
    closeKeyboard();
  }, [
    isDeleteModalOpen, isEditDateModalOpen, isPaymentModalOpen, isDashboardDealModalOpen, isProfileDealModalOpen,
    isBackupModalOpen, isSettingsModalOpen, isTypographyModalOpen, isActiveDealsModalOpen, selectedProfileId, isMobileMenuOpen,
    isAdOpen, closeAd, closeKeyboard
  ]);

  // Handle Hardware Back Button (Android) - Ref-based state access
  const backButtonStateRef = useRef({
    isAdOpen,
    closeAd,
    isAnyModalOpen: false,
    closeTopmost
  });

  const lastBackPressTime = useRef(0);
  const lastBackgroundTime = useRef<number>(Date.now());
  const lastUnlockTime = useRef<number>(Date.now());
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const handleUnlockSuccess = useCallback(() => {
    lastUnlockTime.current = Date.now();
    setIsBiometricVerified(true);
  }, []);

  const checkShouldLock = useCallback(async () => {
    if (!settingsRef.current.useBiometricLock) return;

    // 1. Guard: If unlocked within the last 4 seconds, ignore
    if (Date.now() - lastUnlockTime.current < 4000) {
      return;
    }

    // 2. Guard: If native biometric prompt is active or was recently dismissed, ignore
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await NativeSecurity.isAuthenticating();
        if (res?.isAuthenticating) {
          return;
        }
      }
    } catch (e) {
      // Ignore native check error
    }

    // 3. Check elapsed background duration
    const elapsedSec = (Date.now() - lastBackgroundTime.current) / 1000;
    const configuredTimeout = settingsRef.current.securityLockTimeout ?? 0;

    // Minimum 2.5s threshold so brief pauses (keyboard, permission prompt, contact picker) never falsely lock the app
    const thresholdSec = Math.max(2.5, configuredTimeout);
    if (elapsedSec >= thresholdSec) {
      setIsBiometricVerified(false);
    }
  }, []);

  // Visibility auto-lock for web and native resume
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        lastBackgroundTime.current = Date.now();
      } else {
        checkShouldLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkShouldLock]);

  useEffect(() => {
    backButtonStateRef.current = {
      isAdOpen,
      closeAd,
      isAnyModalOpen: isDashboardDealModalOpen || isProfileDealModalOpen || isPaymentModalOpen || isDeleteModalOpen
        || isEditDateModalOpen || isBackupModalOpen || isSettingsModalOpen || isTypographyModalOpen || isActiveDealsModalOpen || isMobileMenuOpen || !!selectedProfileId,
      closeTopmost
    };
  }, [isAdOpen, closeAd, isDashboardDealModalOpen, isProfileDealModalOpen, isPaymentModalOpen, isDeleteModalOpen,
    isEditDateModalOpen, isBackupModalOpen, isSettingsModalOpen, isTypographyModalOpen, isActiveDealsModalOpen, isMobileMenuOpen,
    selectedProfileId, closeTopmost]);

  useEffect(() => {
    let appImport: any;

    const setupListener = async () => {
      appImport = await import('@capacitor/app');
      const { App } = appImport;

      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        const info = await StatusBar.getInfo() as any;
        if (info.height > 0) {
          document.documentElement.style.setProperty('--sat-fallback', `${info.height}px`);
        }
      } catch (e) {
        console.warn('StatusBar plugin not found or failed', e);
      }

      App.removeAllListeners();

      App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        const { isAdOpen, isAnyModalOpen, closeTopmost } = backButtonStateRef.current;

        // 1. Ads: STRICT LOCK.
        if (isAdOpen) return;

        // 2. Try the LIFO Navigation Stack for true hierarchical back navigation
        const wasHandled = executeTopBackHandler();
        if (wasHandled) {
          triggerHaptic('light');
          return;
        }

        // 3. Fallback: Close topmost directly if any untracked layer is open
        if (isAnyModalOpen) {
          closeTopmost();
          return;
        }

        // 4. Exit with double-back when on the base Dashboard Home
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          App.exitApp();
        } else {
          lastBackPressTime.current = now;
          window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
            detail: {
              message: 'Press back again to exit',
              type: 'info',
              duration: 2000
            }
          }));
        }
      });

      // App lifecycle: auto-lock and check updates when returning from background
      App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (!isActive) {
          lastBackgroundTime.current = Date.now();
        } else {
          checkShouldLock();
          // Check for update when resuming from background
          checkForUpdate().then((update) => {
            if (update) {
              setUpdateInfo(update);
              notifyNewAppVersionAvailable(update);
            }
          }).catch(() => {});
        }
      });
    };

    setupListener();

    const handleGlobalHaptics = (e: Event) => {
      const target = (e.target as HTMLElement).closest('button, [role="button"]');
      if (target) {
        triggerHaptic('light');
      }
    };
    document.addEventListener('pointerdown', handleGlobalHaptics, { passive: true });

    return () => {
      if (appImport) {
        appImport.App.removeAllListeners();
      }
      document.removeEventListener('pointerdown', handleGlobalHaptics);
    };
  }, []);

  const handlePaymentSave = (amount: number, date: string) => {
    haptic('success');
    if (activeTxId) {
      addPayment(activeTxId, amount, date);
    } else if (selectedProfileId) {
      addProfilePayment(selectedProfileId, amount, date);
    }
    closeModal();
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    let timer: any;
    const checkStatus = async () => {
      const tourComplete = await getMeta<boolean>(TOUR_KEY);
      if (!tourComplete) {
        timer = setTimeout(() => setTourStep(0), 1500);
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') !== 'new') {
          checkEligibility();
        }
      }
    };

    checkStatus();

    if (new URLSearchParams(window.location.search).get('action') === 'new') {
      setTimeout(() => openModal(setIsDashboardDealModalOpen), 500);
    }

    return () => clearTimeout(timer);
  }, [isLoggedIn, checkEligibility]);

  // Tour Automation Effect - accurately synchronizes UI state with each interactive tour step
  useEffect(() => {
    if (tourStep === -1) return;
    const isMobile = window.innerWidth < 768;

    // Steps 0..4: Main Dashboard (Intro, Stats, Search, Contacts, Floating Plus Button)
    if (tourStep <= 4) {
      setIsMobileMenuOpen(false);
      setIsSettingsModalOpen(false);
      setSelectedProfileId(null);
    }
    // Steps 5..7: Inside Contact Profile (Timeline, UPI QR code, Record Repayments)
    else if (tourStep >= 5 && tourStep <= 7) {
      setIsMobileMenuOpen(false);
      setIsSettingsModalOpen(false);
      setSelectedProfileId('SIM-PROFILE');
    }
    // Step 8: Top Menu Toggle Button (on Dashboard)
    else if (tourStep === 8) {
      setSelectedProfileId(null);
      setIsMobileMenuOpen(false);
      setIsSettingsModalOpen(false);
    }
    // Steps 9..11: Inside Menu Drawer (Settings, Typography, Backup Vault)
    else if (tourStep >= 9 && tourStep <= 11) {
      setSelectedProfileId(null);
      setIsSettingsModalOpen(false);
      if (isMobile) setIsMobileMenuOpen(true);
    }
    // Steps 12..13: Biometrics & Security, Final Celebration
    else if (tourStep >= 12) {
      setSelectedProfileId(null);
      setIsMobileMenuOpen(false);
      setIsSettingsModalOpen(false);
    }
  }, [tourStep]);

  const handleCompleteTour = useCallback(async () => {
    await saveMeta(TOUR_KEY, true);
    setTourStep(-1);
    setIsMobileMenuOpen(false);
    setIsSettingsModalOpen(false);
    setSelectedProfileId(null);
    checkEligibility();
  }, [checkEligibility]);

  const isOled = settings.baseColor === 'oled';
  const appBg = isOled ? '#000000' : '#141416';
  const isCompact = settings.density === 'compact';

  // Corner radius design tokens
  const radius = settings.cornerRadius === 'sharp' ? '4px' : settings.cornerRadius === 'round' ? '16px' : '24px';
  const radiusLg = settings.cornerRadius === 'sharp' ? '6px' : settings.cornerRadius === 'round' ? '22px' : '28px';
  const radiusSm = settings.cornerRadius === 'sharp' ? '3px' : settings.cornerRadius === 'round' ? '12px' : '18px';
  const radiusPill = settings.cornerRadius === 'sharp' ? '4px' : settings.cornerRadius === 'round' ? '16px' : '9999px';

  // Spacing & Density tokens
  const appPadding = isCompact ? '12px' : '16px';
  const rowPy = isCompact ? '9px' : '13px';
  const rowPx = isCompact ? '14px' : '16px';
  const cardPadding = isCompact ? '14px 16px' : '20px 20px';
  const contentGap = isCompact ? '6px' : '10px';

  // Glass blur, opacity, and glow
  const glassBlur = settings.glassBlur ?? 16;
  const glassOpacity = settings.glassOpacity ?? 0.5;
  const glowIntensity = settings.glowIntensity ?? 0.5;

  const cardBg = isOled
    ? `rgba(255, 255, 255, ${0.03 + glassOpacity * 0.07})`
    : `rgba(28, 28, 30, ${0.55 + glassOpacity * 0.42})`;

  const cardBorder = isOled
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.06)';

  const cardGlow = `0 4px ${Math.round(16 + glowIntensity * 24)}px rgba(0, 0, 0, ${0.4 + glassOpacity * 0.2})`;

  useEffect(() => {
    document.documentElement.style.backgroundColor = appBg;
    document.body.style.backgroundColor = appBg;
  }, [appBg]);

  const getFontClass = () => ({
    mono: 'font-mono-app',
    sans: 'font-sans-app',
    system: 'font-system-app',
    outfit: 'font-outfit-app',
    jakarta: 'font-jakarta-app',
    playfair: 'font-playfair-app',
    serif: 'font-serif-app',
    comic: 'font-comic-app',
  }[settings.fontStyle] || 'font-sans-app');

  if (isLoggedIn && settings.useBiometricLock && !isBiometricVerified) {
    return (
      <BiometricLockScreen
        activeTheme={activeTheme}
        settings={settings}
        onUnlock={handleUnlockSuccess}
        onSaveNewPin={(pinHash) => updateSetting('securityPinHash', pinHash)}
      />
    );
  }

  return (
    <div className={`min-h-screen text-white pb-safe selection:bg-white/10 ${getFontClass()}`} style={{ background: appBg, overscrollBehavior: 'none', position: 'relative' }}>
      <style>{`
        :root {
          --app-bg: ${appBg};
          --app-card-bg: ${cardBg};
          --app-card-border: ${cardBorder};
          --app-card-shadow: ${cardGlow};
          --app-glass-blur: ${glassBlur}px;
          --app-glass-opacity: ${glassOpacity};
          --app-glow-opacity: ${glowIntensity};
          --app-radius: ${radius};
          --app-radius-lg: ${radiusLg};
          --app-radius-sm: ${radiusSm};
          --app-radius-pill: ${radiusPill};
          --app-padding: ${appPadding};
          --app-row-py: ${rowPy};
          --app-row-px: ${rowPx};
          --app-card-padding: ${cardPadding};
          --app-content-gap: ${contentGap};
        }
      `}</style>

      {/* ─── TEXTURE & GRAIN LAYERS ─── */}
      {/* Nebula Texture */}
      {settings.background === 'nebula' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              right: '-10%',
              width: '75vw',
              height: '75vw',
              maxWidth: 440,
              maxHeight: 440,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${activeTheme.hex} 0%, transparent 70%)`,
              opacity: (settings.glowIntensity ?? 0.5) * 0.25,
              filter: 'blur(60px)',
              transform: 'translate3d(0,0,0)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '-15%',
              width: '65vw',
              height: '65vw',
              maxWidth: 380,
              maxHeight: 380,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${activeTheme.hex} 0%, transparent 70%)`,
              opacity: (settings.glowIntensity ?? 0.5) * 0.16,
              filter: 'blur(70px)',
              transform: 'translate3d(0,0,0)',
            }}
          />
        </div>
      )}

      {/* Grid Texture */}
      {settings.background === 'grid' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.65,
          }}
        />
      )}

      {/* Film Grain Effect */}
      {settings.enableGrain && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9998,
            opacity: 0.05,
            mixBlendMode: 'screen',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* GLOBAL SYSTEM BOOT OVERLAY */}
      <AnimatePresence>
        {isBooting && (
          <SystemBoot activeTheme={activeTheme} onComplete={() => setIsBooting(false)} />
        )}
      </AnimatePresence>

      {/* MAIN APP CONTENT */}
      {!isLoggedIn ? (
        <WelcomeScreen
          settings={settings}
          activeTheme={activeTheme}
          onLogin={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('abhi_ledger_is_logged_out');
              localStorage.setItem('abhi_ledger_logged_in', 'true');
            }
            haptic('medium');
            setIsLoggedIn(true);
          }}
          handleImport={handleImport}
          restoreBackupData={restoreBackupData}
          updateSetting={updateSetting}
          hasTransactions={transactions.length > 0}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* --- DASHBOARD LAYER --- */}
          <div>
            <Navbar
              settings={settings} activeTheme={activeTheme} tourStep={tourStep} setTourStep={setTourStep}
              onOpenTutorialSelection={(fromMenu) => handleOpenTutorial(fromMenu ?? isMobileMenuOpen)}
              setIsSettingsModalOpen={(v) => v ? handleOpenSettings(isMobileMenuOpen) : setIsSettingsModalOpen(false)}
              handleExport={(fromMenu) => handleOpenBackup(fromMenu ?? isMobileMenuOpen)} onLogout={handleLogout}
              onOpenTypographyModal={() => handleOpenTypography(isMobileMenuOpen ? 'menu' : null)}
              isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={(v) => v ? openModal(setIsMobileMenuOpen) : setIsMobileMenuOpen(false)}
              updateSetting={updateSetting}
            />
            <main
              className="max-w-4xl mx-auto px-4 pb-32 md:pl-32 pt-[calc(5rem_+_var(--sat))] md:pt-10 md:pr-6 relative"
              style={{ overscrollBehavior: 'none' }}
            >
              {/* Balance Header */}
              <div className="z-20 pb-5">
                <DashboardStats stats={stats} settings={settings} activeTheme={activeTheme} tourStep={tourStep} onShowActiveDeals={() => openModal(setIsActiveDealsModalOpen)} />
              </div>

              <div className="space-y-4 mt-2">
                {/* Section header + search */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <h2 style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                      fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: '#fff',
                    }}>Contacts</h2>
                    <p style={{ fontSize: 12, color: 'rgba(235,235,245,0.35)', fontWeight: 400, marginTop: 2 }}>
                      {accounts.length} {accounts.length === 1 ? 'contact' : 'contacts'}
                    </p>
                  </div>
                </div>

                {/* Search bar */}
                <div id="tour-search" style={{ position: 'relative', marginBottom: 10 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(235, 235, 245, 0.55)',
                    }}
                  >
                    <Search size={17} strokeWidth={2.2} />
                  </div>
                  <input
                    {...kbSearch}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    style={{
                      width: '100%',
                      height: 42,
                      paddingLeft: 42,
                      paddingRight: searchQuery ? 40 : 16,
                      background: 'var(--app-card-bg, rgba(120,120,128,0.18))',
                      border: '0.5px solid var(--app-card-border, rgba(255,255,255,0.06))',
                      borderRadius: 'var(--app-radius-sm, 12px)',
                      backdropFilter: 'blur(var(--app-glass-blur, 16px))',
                      WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 15,
                      letterSpacing: '-0.01em',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'rgba(235, 235, 245, 0.2)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        zIndex: 10,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                <div id="tour-contacts-list" className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--app-content-gap, 8px)' }}>
                  <AnimatePresence>
                    {accounts.length > 0 ? accounts.map((account, index) => (
                      <AccountRow key={account.id} account={account} settings={settings} activeTheme={activeTheme} onClick={() => navigateToProfile(account.id)} index={index} />
                    )) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          background: 'var(--app-card-bg, #1C1C1E)',
                          borderRadius: 'var(--app-radius-lg, 20px)',
                          padding: '40px 24px',
                          textAlign: 'center',
                          border: '0.5px solid var(--app-card-border, rgba(255,255,255,0.05))',
                          backdropFilter: 'blur(var(--app-glass-blur, 16px))',
                          WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
                        }}
                      >
                        <div style={{
                          width: 64, height: 64, borderRadius: 'var(--app-radius, 18px)',
                          background: 'rgba(120,120,128,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}>
                          <UserPlus size={28} style={{ color: 'rgba(235,235,245,0.3)' }} />
                        </div>
                        <h3 style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                          fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em', color: '#fff',
                          marginBottom: 6,
                        }}>No Contacts Yet</h3>
                        <p style={{ fontSize: 14, color: 'rgba(235,235,245,0.4)', marginBottom: 20 }}>
                          Add someone to start tracking loans.
                        </p>
                        <button
                          onClick={() => { setSearchQuery(''); openModal(setIsDashboardDealModalOpen); }}
                          style={{
                            padding: '12px 28px',
                            borderRadius: 'var(--app-radius-pill, 14px)',
                            background: activeTheme.hex, color: '#000',
                            fontFamily: 'inherit', fontWeight: 600, fontSize: 16,
                            letterSpacing: '-0.01em', border: 'none', cursor: 'pointer',
                          }}
                        >
                          Add Contact
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </main>

            {/* Persistent Keyboard Spacer placed after main content */}
            <div className="max-w-4xl mx-auto px-6">
              <div
                className="transition-[height] duration-300 ease-out"
                style={{ height: isKeyboardVisible ? '350px' : '0px' }}
              />
            </div>

            <motion.button
              id="tour-add-profile"
              onClick={() => { haptic('medium'); openModal(setIsDashboardDealModalOpen); }}
              whileTap={{ scale: 0.88 }}
              style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                right: 24,
                width: 56,
                height: 56,
                borderRadius: 'var(--app-radius-pill, 16px)',
                background: activeTheme.hex,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 2px 8px ${activeTheme.hex}55`,
                zIndex: 30,
                cursor: 'pointer',
              }}
            >
              <Plus size={26} style={{ color: '#000', strokeWidth: 2.5 }} />
            </motion.button>
          </div>

          <AnimatePresence>
            {selectedProfileId && activeProfile && (
              <motion.div
                key="profile-layer"
                className="fixed inset-0 z-[100] isolate"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ backgroundColor: 'transparent' }}
              >
                <ProfileView
                  account={activeProfile} settings={settings} activeTheme={activeTheme}
                  onBack={handleBackAction}
                  onGive={() => openModal(setIsProfileDealModalOpen)}
                  onReceive={(txId) => {
                    setActiveTxId(txId);
                    openModal(setIsPaymentModalOpen);
                  }}
                  onDeleteTransaction={deleteTransaction} onDeleteRepayment={deleteRepayment}
                  onDeleteProfile={() => { deleteProfile(activeProfile.id); handleBackAction(); }}
                  onUpdateDueDate={(txId) => { setActiveTxId(txId); openModal(setIsEditDateModalOpen); }}
                  onEditRepayment={(txId, repId) => {
                    setActiveTxId(txId);
                    setActiveRepaymentId(repId);
                    openModal(setIsEditDateModalOpen);
                  }}
                  onUpdateSettings={updateSetting}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <SponsorModal isOpen={isAdOpen} onClose={closeAd} activeTheme={activeTheme} ad={currentAd} onBackup={() => handleOpenBackup(false)} />
          <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={handleCompleteTour} activeTheme={activeTheme} />

          <TutorialSelectionModal
            isOpen={isTutorialModalOpen}
            onClose={handleCloseTutorial}
            onSelectInteractive={() => {
              setTutorialOriginMenu(false);
              setIsMobileMenuOpen(false);
              setTourStep(0);
            }}
            activeTheme={activeTheme}
            settings={settings}
          />

          <BackupModal
            isOpen={isBackupModalOpen}
            onClose={handleCloseBackup}
            transactions={transactions}
            settings={settings}
            activeTheme={activeTheme}
            onRestoreSuccess={(restored, restoredSettings) => {
              setBackupOriginMenu(false);
              restoreBackupData(restored, restoredSettings);
            }}
          />

          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={handleCloseSettings}
            settings={settings}
            updateSetting={updateSetting}
            activeTheme={activeTheme}
            themes={THEMES}
            currencies={CURRENCIES}
            tourStep={tourStep}
            onUpdateAvailable={(info) => {
              setUpdateInfo(info);
              setUpdateDismissed(false);
            }}
          />
          <TypographyModal
            isOpen={isTypographyModalOpen}
            onClose={handleCloseTypography}
            currentFont={settings.fontStyle}
            onSelect={(font) => updateSetting('fontStyle', font)}
            activeTheme={activeTheme}
            currency={settings.currency}
          />
          <ActiveDealsModal
            isOpen={isActiveDealsModalOpen}
            onClose={() => setIsActiveDealsModalOpen(false)}
            transactions={transactions}
            currency={settings.currency}
            activeTheme={activeTheme}
            onSelectDeal={(pId) => navigateToProfile(pId, 'active-deals')}
          />

          <DealModal
            isOpen={isDashboardDealModalOpen}
            onClose={closeModal}
            onSave={(data) => { haptic('success'); addLoan(data); setSearchQuery(''); closeModal(); }}
            activeTheme={activeTheme}
            currency={settings.currency}
            initialName=""
            initialProfileId={undefined}
            existingAccounts={allAccounts}
          />

          <DealModal
            isOpen={isProfileDealModalOpen}
            onClose={closeModal}
            onSave={(data) => { haptic('success'); addLoan(data); closeModal(); }}
            activeTheme={activeTheme}
            currency={settings.currency}
            initialName={activeProfile ? activeProfile.name : ''}
            initialProfileId={activeProfile ? activeProfile.id : undefined}
            existingAccounts={allAccounts}
          />

          <PaymentModal isOpen={isPaymentModalOpen} onClose={closeModal} onSave={handlePaymentSave} activeTheme={activeTheme} currency={settings.currency} />

          <EditDateModal
            isOpen={isEditDateModalOpen}
            onClose={closeModal}
            onSave={(amount, date) => {
              haptic('success');
              if (activeRepaymentId && activeTxId) {
                editRepayment(activeTxId, activeRepaymentId, { amount, date });
              } else {
                editTransaction(activeTxId, { amount, date });
              }
              closeModal();
            }}
            initialDate={activeRepaymentId ? (activeRepayment?.date || '') : (activeTx?.returnDate || '')}
            initialAmount={activeRepaymentId ? (activeRepayment?.amount || 0) : (activeTx?.principalAmount || 0)}
            title={activeRepaymentId ? "Edit Payment" : "Edit Loan"}
          />

          <DeleteModal isOpen={isDeleteModalOpen} onClose={closeModal} onConfirm={() => { haptic('heavy'); deleteTransaction(activeTxId); closeModal(); }} />

          <VirtualKeyboard
            activeTheme={activeTheme}
            settings={settings}
            updateSetting={updateSetting}
          />

          {/* Update Banner */}
          {updateInfo && !updateDismissed && (
            <UpdateBanner
              updateInfo={updateInfo}
              activeTheme={activeTheme}
              settings={settings}
              onDismiss={() => setUpdateDismissed(true)}
            />
          )}

          {/* Premium Floating Network Status Indicator (Auto-hides in 3.5s) */}
          <AnimatePresence>
            {offlineToast && (
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                style={{
                  position: 'fixed',
                  top: 'calc(14px + var(--sat))',
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    background: 'rgba(24, 24, 27, 0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: offlineToast === 'offline'
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 9999,
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      offlineToast === 'offline' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <WifiOff
                    size={14}
                    className={`shrink-0 ${
                      offlineToast === 'offline' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#F4F4F5', letterSpacing: '-0.01em' }}>
                    {offlineToast === 'offline'
                      ? 'Offline Mode • Mobile data / Wi-Fi disconnected'
                      : 'Back Online • Connected'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};


import Toast from './components/Toast';

// Wrap App in KeyboardProvider
const App: React.FC = () => (
  <ErrorBoundary>
    <KeyboardProvider>
      <AppContent />
      <Toast />
    </KeyboardProvider>
  </ErrorBoundary>
);

export default App;
