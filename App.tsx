
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserPlus } from 'lucide-react';
import { useLedger } from './hooks/useLedger';
import { useAdManager } from './hooks/useAdManager';
import { getMeta, saveMeta } from './utils/db';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import SettingsModal from './components/SettingsModal';
import DealModal from './components/DealModal';
import PaymentModal from './components/PaymentModal';
import EditDateModal from './components/EditDateModal';
import DeleteModal from './components/DeleteModal';
import TourOverlay from './components/TourOverlay';
import WelcomeScreen from './components/WelcomeScreen';
import SponsorModal from './components/SponsorModal';
import AccountRow from './components/AccountRow';
import ProfileView from './components/ProfileView';
import TypographyModal from './components/TypographyModal';
import ActiveDealsModal from './components/ActiveDealsModal';
import ErrorBoundary from './components/ErrorBoundary';
import VirtualKeyboard from './components/VirtualKeyboard';
import SystemBoot from './components/SystemBoot';
import AndroidBlocker from './components/AndroidBlocker';
import { KeyboardProvider, useKeyboard } from './contexts/KeyboardContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';

const TOUR_KEY = 'abhi_ledger_tour_complete_v9';
const CURRENCIES = ['₹', '$', '€', '£', '¥'];

const THEMES: Record<string, any> = {
  emerald: { name: 'Cyber Emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/30', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-600 via-emerald-400 to-teal-400', hex: '#10b981', rgb: '16, 185, 129' },
  violet: { name: 'Neon Violet', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30', shadow: 'shadow-violet-500/20', gradient: 'from-violet-600 via-violet-400 to-fuchsia-400', hex: '#8b5cf6', rgb: '139, 92, 246' },
  blue: { name: 'Tron Blue', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/30', shadow: 'shadow-blue-500/20', gradient: 'from-blue-600 via-blue-400 to-cyan-400', hex: '#3b82f6', rgb: '59, 130, 246' },
  rose: { name: 'Laser Rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/30', shadow: 'shadow-rose-500/20', gradient: 'from-rose-600 via-rose-400 to-pink-400', hex: '#f43f5e', rgb: '244, 63, 94' },
  amber: { name: 'Solar Amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/30', shadow: 'shadow-amber-500/20', gradient: 'from-amber-600 via-amber-400 to-orange-400', hex: '#f59e0b', rgb: '245, 158, 11' }
};

const AppContent: React.FC = () => {
  const [tourStep, setTourStep] = useState<number>(-1);
  const [isBooting, setIsBooting] = useState(true);
  const [isAndroidWeb, setIsAndroidWeb] = useState(false);
  
  // Modal States
  const [isDashboardDealModalOpen, setIsDashboardDealModalOpen] = useState(false);
  const [isProfileDealModalOpen, setIsProfileDealModalOpen] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
  const [isActiveDealsModalOpen, setIsActiveDealsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [activeRepaymentId, setActiveRepaymentId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const {
    transactions, settings, isLoggedIn, accounts, allAccounts, stats, showInstallButton,
    setIsLoggedIn, updateSetting, addLoan, addPayment, addProfilePayment, editTransaction, editRepayment,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, handleInstallClick
  } = useLedger(tourStep, searchQuery);

  const { currentAd, isAdOpen, closeAd, checkEligibility } = useAdManager(isLoggedIn);
  
  // Keyboard Context Sync
  const { setEnabled: setKeyboardEnabled, closeKeyboard, isVisible: isKeyboardVisible } = useKeyboard();
  
  useEffect(() => {
    setKeyboardEnabled(!!settings.useVirtualKeyboard);
  }, [settings.useVirtualKeyboard, setKeyboardEnabled]);

  // Detect Android Web & PWA (Block everything except the native APK/TWA)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    
    // Strict Check: Only allow if coming from the specific Trusted Web Activity (APK)
    // PWA (Add to Homescreen) does NOT set this referrer.
    // External apps (Gmail, WhatsApp) set their own package names, so they will still be blocked.
    // NOTE: This requires the APK to be a TWA associated with this domain via assetlinks.json
    const isTWA = document.referrer.includes('android-app://app.vercel.ledger69.twa');

    // We block if it's Android AND NOT the verified native application
    if (isAndroid && !isTWA) {
      setIsAndroidWeb(true);
      setIsBooting(false); // Stop boot if blocked
    }
  }, []);

  // Initialize virtual keyboard for search
  const kbSearch = useVirtualKeyboard('text', setSearchQuery);

  const activeTheme = THEMES[settings.themeColor] || THEMES.emerald;
  const activeTx = transactions.find(t => t.id === activeTxId);
  const activeRepayment = activeTx?.repayments.find(r => r.id === activeRepaymentId);
  const activeProfile = allAccounts.find(a => a.id === selectedProfileId);

  const pushHistoryState = (stateName: string) => {
    if (window.history.state?.view !== stateName) {
      window.history.pushState({ view: stateName }, '', window.location.search);
    }
  };

  const closeModal = useCallback(() => {
    setIsDashboardDealModalOpen(false);
    setIsProfileDealModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditDateModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setIsMobileMenuOpen(false);
    setActiveRepaymentId(null);
    closeAd();
    closeKeyboard(); // Ensure virtual keyboard closes when modals close
  }, [closeAd, closeKeyboard]);

  const handleLogout = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsDashboardDealModalOpen(false);
    setIsProfileDealModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setActiveRepaymentId(null);
    closeAd();
    closeKeyboard();
    setIsLoggedIn(false);
    // Note: We DO NOT reset isBooting here, so the user sees the Welcome Screen immediately without boot animation
  }, [closeAd, setIsLoggedIn, closeKeyboard]);

  const navigateToProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    pushHistoryState('profile');
  };

  const handleBackAction = useCallback(() => {
    if (selectedProfileId) {
        setSelectedProfileId(null);
        if (window.history.state?.view === 'profile') {
            window.history.back();
        }
    }
  }, [selectedProfileId]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const view = event.state?.view;
      if (!view) {
        closeModal();
        setSelectedProfileId(null);
        setActiveRepaymentId(null);
      } else if (view === 'profile') {
        closeModal();
        setActiveRepaymentId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeModal]);

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    pushHistoryState('modal');
  };

  const handlePaymentSave = (amount: number, date: string) => {
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

  // Tour Automation Effect
  useEffect(() => {
    if (tourStep === -1) return;
    const isMobile = window.innerWidth < 768;
    
    if (tourStep <= 3) {
       setIsMobileMenuOpen(false);
       setIsSettingsModalOpen(false);
       setSelectedProfileId(null);
    }
    else if (tourStep === 4 || tourStep === 5) {
       if (isMobile) setIsMobileMenuOpen(true);
       setIsSettingsModalOpen(false); 
    }
    else if (tourStep >= 6 && tourStep <= 9) {
       setIsMobileMenuOpen(false);
       setIsSettingsModalOpen(true);
    }
    else if (tourStep === 10) {
        // Close settings, ensure we are on dashboard to show profile list
        setIsSettingsModalOpen(false);
        setSelectedProfileId(null);
    }
    else if (tourStep === 11) {
        // Open the simulated profile for UPI step
        setSelectedProfileId('SIM-PROFILE');
    }
    else if (tourStep === 12) {
       setSelectedProfileId(null);
       if (isMobile) setIsMobileMenuOpen(true);
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

  const getRadius = () => settings.cornerRadius === 'sharp' ? '0px' : settings.cornerRadius === 'round' ? '0.75rem' : '2rem';
  const getPadding = () => settings.density === 'compact' ? '1rem' : '1.5rem';
  const getFontClass = () => ({ mono: 'font-mono-app', sans: 'font-sans-app', system: 'font-system-app', serif: 'font-serif-app', comic: 'font-comic-app' }[settings.fontStyle] || 'font-sans-app');
  const getBaseColor = () => settings.baseColor === 'oled' ? '#000000' : '#020617';
  const getBackgroundClass = () => settings.background === 'nebula' ? 'bg-gradient-to-br from-[var(--app-bg)] via-slate-900/50 to-[var(--app-bg)]' : settings.background === 'grid' ? 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]' : '';

  if (isAndroidWeb) {
    return <AndroidBlocker onBackup={handleExport} />;
  }

  return (
    <div className={`min-h-screen text-slate-100 pb-safe selection:bg-emerald-500/30 ${getFontClass()} ${getBackgroundClass()}`}>
       <style>{`:root { --app-bg: ${getBaseColor()}; --app-radius: ${getRadius()}; --app-padding: ${getPadding()}; --glass-bg: rgba(15, 23, 42, ${settings.glassOpacity}); --glass-blur: ${settings.glassBlur}px; --glass-border: rgba(255, 255, 255, ${0.1 * settings.glowIntensity + 0.05}); --glow-opacity: ${settings.glowIntensity}; }`}</style>
       {settings.enableGrain && <div className="grain-overlay"></div>}
       {settings.background === 'nebula' && <div className={`fixed top-0 left-0 right-0 h-[50vh] ${activeTheme.bg}/10 blur-[120px] pointer-events-none rounded-b-full`}></div>}

       {/* GLOBAL SYSTEM BOOT OVERLAY */}
       <AnimatePresence>
         {isBooting && (
            <SystemBoot activeTheme={activeTheme} onComplete={() => setIsBooting(false)} />
         )}
       </AnimatePresence>

       {/* MAIN APP CONTENT */}
       {/* 
          IMPORTANT: We render the app ALWAYS, even during boot. 
          The SystemBoot component covers it with z-index.
          This ensures that when SystemBoot fades out, the app is already there (no flash/mount glitch).
       */}
       {!isLoggedIn ? (
          <WelcomeScreen 
            settings={settings} activeTheme={activeTheme} onLogin={() => setIsLoggedIn(true)} 
            showInstallButton={showInstallButton} handleInstallClick={handleInstallClick}
            handleImport={handleImport} updateSetting={updateSetting}
          />
       ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {/* --- DASHBOARD LAYER --- */}
            <div>
              <Navbar 
                settings={settings} activeTheme={activeTheme} tourStep={tourStep} setTourStep={setTourStep}
                onOpenTutorialSelection={() => setTourStep(0)} setIsSettingsModalOpen={(v) => v ? openModal(setIsSettingsModalOpen) : setIsSettingsModalOpen(false)}
                handleExport={handleExport} onLogout={handleLogout} showInstallButton={showInstallButton}
                handleInstallClick={handleInstallClick} onOpenTypographyModal={() => openModal(setIsTypographyModalOpen)}
                isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={(v) => v ? openModal(setIsMobileMenuOpen) : setIsMobileMenuOpen(false)}
                updateSetting={updateSetting}
              />
              <main className="max-w-4xl mx-auto px-6 space-y-8 pt-24 pb-8 md:pl-32 md:pt-12 md:pr-6 relative">
                <DashboardStats stats={stats} settings={settings} activeTheme={activeTheme} tourStep={tourStep} onShowActiveDeals={() => openModal(setIsActiveDealsModalOpen)} />
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 mt-12">
                    <div>
                      <h2 className="text-2xl font-black text-slate-200 tracking-tight">People</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Friends added</p>
                    </div>
                    
                    <div id="tour-search" className="relative group flex-grow sm:w-64">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${searchQuery ? activeTheme.text : 'text-slate-500'}`}><Search className="h-4 w-4" /></div>
                        <input 
                          {...kbSearch}
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all uppercase tracking-wider" 
                          placeholder="Search Name..." 
                        />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {accounts.length > 0 ? accounts.map((account, index) => (
                        <AccountRow key={account.id} account={account} settings={settings} activeTheme={activeTheme} onClick={() => navigateToProfile(account.id)} index={index} />
                      )) : (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass border-slate-800/40 border-dashed border-2 text-center" style={{ borderRadius: 'var(--app-radius)', padding: '3rem' }}>
                          <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800"><UserPlus className="w-10 h-10 text-slate-700" /></div>
                          <h3 className="text-xl font-bold text-slate-300 mb-2">No Friends Added</h3>
                          <button onClick={() => { setSearchQuery(''); openModal(setIsDashboardDealModalOpen); }} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>Add a Friend</button>
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
                onClick={() => openModal(setIsDashboardDealModalOpen)} 
                whileHover={{ scale: 1.1, rotate: 90 }} 
                whileTap={{ scale: 0.9 }} 
                className={`fixed bottom-8 right-6 md:right-8 w-16 h-16 md:w-18 md:h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all group z-30`}
              >
                <Plus className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300" />
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
            
            <SponsorModal isOpen={isAdOpen} onClose={closeAd} activeTheme={activeTheme} ad={currentAd} onBackup={handleExport} />
            <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={handleCompleteTour} activeTheme={activeTheme} />
            
            <SettingsModal isOpen={isSettingsModalOpen} onClose={closeModal} settings={settings} updateSetting={updateSetting} activeTheme={activeTheme} themes={THEMES} currencies={CURRENCIES} tourStep={tourStep} />
            <TypographyModal isOpen={isTypographyModalOpen} onClose={closeModal} currentFont={settings.fontStyle} onSelect={(font) => updateSetting('fontStyle', font)} activeTheme={activeTheme} />
            <ActiveDealsModal isOpen={isActiveDealsModalOpen} onClose={closeModal} transactions={transactions} currency={settings.currency} activeTheme={activeTheme} onSelectDeal={navigateToProfile} />
            
            <DealModal 
              isOpen={isDashboardDealModalOpen} 
              onClose={closeModal} 
              onSave={(data) => { addLoan(data); setSearchQuery(''); closeModal(); }} 
              activeTheme={activeTheme} 
              currency={settings.currency} 
              initialName="" 
              initialProfileId={undefined} 
              existingAccounts={allAccounts}
            />

            <DealModal 
              isOpen={isProfileDealModalOpen} 
              onClose={closeModal} 
              onSave={(data) => { addLoan(data); closeModal(); }} 
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
            
            <DeleteModal isOpen={isDeleteModalOpen} onClose={closeModal} onConfirm={() => { deleteTransaction(activeTxId); closeModal(); }} />
            
            {/* VIRTUAL KEYBOARD */}
            <VirtualKeyboard 
              activeTheme={activeTheme} 
              settings={settings}
              updateSetting={updateSetting}
            />
          </motion.div>
       )}
    </div>
  );
};

// Wrap App in KeyboardProvider
const App: React.FC = () => (
  <ErrorBoundary>
    <KeyboardProvider>
       <AppContent />
    </KeyboardProvider>
  </ErrorBoundary>
);

export default App;
