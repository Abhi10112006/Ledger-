
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, UserPlus } from 'lucide-react';
import { useLedger } from './hooks/useLedger';
import { generateStatementPDF } from './utils/pdfGenerator';
import TrustScoreBadge from './components/TrustScoreBadge';
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
import { ThemeColor } from './types';

const TOUR_KEY = 'abhi_ledger_tour_complete_v8';
const CURRENCIES = ['₹', '$', '€', '£', '¥'];

const THEMES = {
  emerald: { name: 'Cyber Emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/30', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-600 via-emerald-400 to-teal-400', hex: '#10b981', rgb: '16, 185, 129' },
  violet: { name: 'Neon Violet', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30', shadow: 'shadow-violet-500/20', gradient: 'from-violet-600 via-violet-400 to-fuchsia-400', hex: '#8b5cf6', rgb: '139, 92, 246' },
  blue: { name: 'Tron Blue', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/30', shadow: 'shadow-blue-500/20', gradient: 'from-blue-600 via-blue-400 to-cyan-400', hex: '#3b82f6', rgb: '59, 130, 246' },
  rose: { name: 'Laser Rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/30', shadow: 'shadow-rose-500/20', gradient: 'from-rose-600 via-rose-400 to-pink-400', hex: '#f43f5e', rgb: '244, 63, 94' },
  amber: { name: 'Solar Amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/30', shadow: 'shadow-amber-500/20', gradient: 'from-amber-600 via-amber-400 to-orange-400', hex: '#f59e0b', rgb: '245, 158, 11' }
};

const App: React.FC = () => {
  // UI State
  const [tourStep, setTourStep] = useState<number>(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
  const [isActiveDealsModalOpen, setIsActiveDealsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  // Back Button / Exit Logic State
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPress = useRef<number>(0);
  const isBackingFromApp = useRef(false);

  const {
    transactions, settings, isLoggedIn, deferredPrompt, accounts, stats,
    setIsLoggedIn, updateSetting, addLoan, addPayment, updateDueDate,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, handleInstallClick
  } = useLedger(tourStep, searchQuery);

  const activeTheme = THEMES[settings.themeColor];
  const activeTx = transactions.find(t => t.id === activeTxId);
  const activeProfile = accounts.find(a => a.name === selectedProfileName);

  // Helper: Is any modal currently visible?
  const isAnyModalOpen = isModalOpen || isPaymentModalOpen || isDeleteModalOpen || 
                        isEditDateModalOpen || isSettingsModalOpen || isTypographyModalOpen || 
                        isActiveDealsModalOpen || isSponsorModalOpen || (tourStep !== -1);

  // --- NAVIGATION CONTROLLER ---
  
  // Close all modals without affecting history (internal use)
  const clearModalsState = useCallback(() => {
    setIsModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditDateModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setIsSponsorModalOpen(false);
    setIsMobileMenuOpen(false);
    if (tourStep !== -1) setTourStep(-1);
  }, [tourStep]);

  // Public close function that handles history
  const closeModal = useCallback(() => {
    isBackingFromApp.current = true;
    window.history.back();
  }, []);

  const navigateToProfile = (name: string) => {
    window.history.pushState({ key: 'profile', id: name }, '', '');
    setSelectedProfileName(name);
  };

  const handleBackAction = useCallback(() => {
    isBackingFromApp.current = true;
    window.history.back();
  }, []);

  // --- NATIVE BACK BUTTON LOGIC ---
  useEffect(() => {
    // Initial history setup: [Root] -> [Home]
    if (!window.history.state || window.history.state.key !== 'home') {
      window.history.replaceState({ key: 'root' }, '', '');
      window.history.pushState({ key: 'home' }, '', '');
    }

    const onPopState = (e: PopStateEvent) => {
      // Logic Priority:
      // 1. If Modal is open -> Close it and stay on page
      if (isAnyModalOpen || isMobileMenuOpen) {
        clearModalsState();
        // If the user used hardware back, we are already synced. 
        // If we called window.back(), we are also synced.
        return;
      }

      // 2. If Profile is open -> Close it and go back to home
      if (selectedProfileName) {
        setSelectedProfileName(null);
        return;
      }

      // 3. Home Screen Exit logic
      // We check if we've hit the 'root' state
      if (!e.state || e.state.key === 'root') {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          // Double tap! We let the browser actually go back from root, which exits.
          window.history.back();
        } else {
          lastBackPress.current = now;
          setShowExitToast(true);
          // Push 'home' back on the stack to "trap" the next back button
          window.history.pushState({ key: 'home' }, '', '');
          setTimeout(() => setShowExitToast(false), 2000);
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isAnyModalOpen, isMobileMenuOpen, selectedProfileName, clearModalsState]);

  // Sync state for modals: whenever we open a modal, we MUST push a state
  useEffect(() => {
    if (isAnyModalOpen && !isBackingFromApp.current) {
        window.history.pushState({ key: 'modal' }, '', '');
    }
    isBackingFromApp.current = false;
  }, [isAnyModalOpen]);

  // Initialization effects
  useEffect(() => {
    const tourComplete = localStorage.getItem(TOUR_KEY);
    if (!tourComplete) {
      setTimeout(() => setTourStep(0), 1500);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') !== 'new') setIsSponsorModalOpen(true);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setTimeout(() => setIsModalOpen(true), 500);
      window.history.replaceState({}, document.title, "");
    }
  }, []);

  // Tour sync for settings
  useEffect(() => {
    if (tourStep >= 6 && tourStep <= 8) {
      setIsSettingsModalOpen(true);
    } else if (tourStep === -1) {
      setIsSettingsModalOpen(false);
    }
  }, [tourStep]);

  if (!isLoggedIn) {
    return (
      <WelcomeScreen 
        settings={settings} activeTheme={activeTheme} onLogin={() => setIsLoggedIn(true)} 
        deferredPrompt={deferredPrompt} handleInstallClick={handleInstallClick}
        handleImport={handleImport} updateSetting={updateSetting}
      />
    );
  }

  // Visual Engine Helpers
  const getRadius = () => settings.cornerRadius === 'sharp' ? '0px' : settings.cornerRadius === 'round' ? '0.75rem' : '2rem';
  const getPadding = () => settings.density === 'compact' ? '1rem' : '1.5rem';
  const getFontClass = () => ({ mono: 'font-mono-app', sans: 'font-sans-app', system: 'font-system-app', serif: 'font-serif-app', comic: 'font-comic-app' }[settings.fontStyle] || 'font-sans-app');
  const getBaseColor = () => settings.baseColor === 'oled' ? '#000000' : '#020617';
  const getBackgroundClass = () => settings.background === 'nebula' ? 'bg-gradient-to-br from-[var(--app-bg)] via-slate-900/50 to-[var(--app-bg)]' : settings.background === 'grid' ? 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]' : '';

  return (
    <div className={`min-h-screen text-slate-100 pb-safe selection:bg-emerald-500/30 ${getFontClass()} ${getBackgroundClass()}`}>
       <style>{`:root { --app-bg: ${getBaseColor()}; --app-radius: ${getRadius()}; --app-padding: ${getPadding()}; --glass-bg: rgba(15, 23, 42, ${settings.glassOpacity}); --glass-blur: ${settings.glassBlur}px; --glass-border: rgba(255, 255, 255, ${0.1 * settings.glowIntensity + 0.05}); --glow-opacity: ${settings.glowIntensity}; }`}</style>
       {settings.enableGrain && <div className="grain-overlay"></div>}
       {settings.background === 'nebula' && <div className={`fixed top-0 left-0 right-0 h-[50vh] ${activeTheme.bg}/10 blur-[120px] pointer-events-none rounded-b-full`}></div>}

      {selectedProfileName && activeProfile ? (
        <div className="max-w-4xl mx-auto px-6 pt-safe">
           <ProfileView 
              account={activeProfile} settings={settings} activeTheme={activeTheme}
              onBack={handleBackAction}
              onGive={() => setIsModalOpen(true)}
              onReceive={(txId) => { setActiveTxId(txId); setIsPaymentModalOpen(true); }}
              onDeleteTransaction={deleteTransaction} onDeleteRepayment={deleteRepayment}
              onDeleteProfile={() => { deleteProfile(activeProfile.name); handleBackAction(); }}
              onUpdateDueDate={(txId) => { setActiveTxId(txId); setIsEditDateModalOpen(true); }}
           />
        </div>
      ) : (
        <>
          <Navbar 
            settings={settings} activeTheme={activeTheme} tourStep={tourStep} setTourStep={setTourStep}
            onOpenTutorialSelection={() => setTourStep(0)} setIsSettingsModalOpen={setIsSettingsModalOpen}
            handleExport={handleExport} setIsLoggedIn={setIsLoggedIn} deferredPrompt={deferredPrompt}
            handleInstallClick={handleInstallClick} onOpenTypographyModal={() => setIsTypographyModalOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="max-w-4xl mx-auto px-6 space-y-8 pt-24 pb-8 md:pl-32 md:pt-12 md:pr-6 relative transition-all duration-300">
            <DashboardStats stats={stats} settings={settings} activeTheme={activeTheme} tourStep={tourStep} onShowActiveDeals={() => setIsActiveDealsModalOpen(true)} />
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 mt-12">
                <div>
                  <h2 className="text-2xl font-black text-slate-200 tracking-tight">People</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Friends added</p>
                </div>
                <div className="relative group flex-grow sm:w-64">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${searchQuery ? activeTheme.text : 'text-slate-500'}`}><Search className="h-4 w-4" /></div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all uppercase tracking-wider" placeholder="Search Name..." />
                </div>
              </div>
              <div className="space-y-4">
                {accounts.length > 0 ? accounts.map(account => (
                  <AccountRow key={account.name} account={account} settings={settings} activeTheme={activeTheme} onClick={() => navigateToProfile(account.name)} />
                )) : (
                  <div className="glass border-slate-800/40 border-dashed border-2 text-center" style={{ borderRadius: 'var(--app-radius)', padding: '3rem' }}>
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800"><UserPlus className="w-10 h-10 text-slate-700" /></div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Friends Added</h3>
                    <button onClick={() => { setSearchQuery(''); setIsModalOpen(true); }} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>Add a Friend</button>
                  </div>
                )}
              </div>
            </div>
          </main>
          <button onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-6 md:right-8 w-16 h-16 md:w-18 md:h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group z-30`}><Plus className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-300" /></button>
        </>
      )}
      
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-[5000] transition-all duration-300 pointer-events-none ${showExitToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}><p className="text-xs font-bold uppercase tracking-widest">Press back again to exit</p></div>

      {/* Modals */}
      <SponsorModal isOpen={isSponsorModalOpen} onClose={closeModal} activeTheme={activeTheme} />
      <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={() => { setTourStep(-1); localStorage.setItem(TOUR_KEY, 'true'); }} activeTheme={activeTheme} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={closeModal} settings={settings} updateSetting={updateSetting} activeTheme={activeTheme} themes={THEMES} currencies={CURRENCIES} tourStep={tourStep} />
      <TypographyModal isOpen={isTypographyModalOpen} onClose={closeModal} currentFont={settings.fontStyle} onSelect={(font) => updateSetting('fontStyle', font)} activeTheme={activeTheme} />
      <ActiveDealsModal isOpen={isActiveDealsModalOpen} onClose={closeModal} transactions={transactions} currency={settings.currency} activeTheme={activeTheme} onSelectDeal={(name) => navigateToProfile(name)} />
      <DealModal isOpen={isModalOpen} onClose={closeModal} onSave={(data) => { addLoan(data); clearModalsState(); }} activeTheme={activeTheme} currency={settings.currency} initialName={selectedProfileName || ''} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={closeModal} onSave={(amount, date) => { addPayment(activeTxId, amount, date); clearModalsState(); }} activeTheme={activeTheme} currency={settings.currency} />
      <EditDateModal isOpen={isEditDateModalOpen} onClose={closeModal} onSave={(date) => { updateDueDate(activeTxId, date); clearModalsState(); }} initialDate={activeTx ? activeTx.returnDate : ''} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={closeModal} onConfirm={() => { deleteTransaction(activeTxId); clearModalsState(); }} />
    </div>
  );
};

export default App;
