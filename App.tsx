import React, { useState, useEffect, useCallback, Component } from 'react';
import { Plus, Search, UserPlus, AlertOctagon, RefreshCw } from 'lucide-react';
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

const THEMES: Record<string, any> = {
  emerald: { name: 'Cyber Emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/30', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-600 via-emerald-400 to-teal-400', hex: '#10b981', rgb: '16, 185, 129' },
  violet: { name: 'Neon Violet', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30', shadow: 'shadow-violet-500/20', gradient: 'from-violet-600 via-violet-400 to-fuchsia-400', hex: '#8b5cf6', rgb: '139, 92, 246' },
  blue: { name: 'Tron Blue', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/30', shadow: 'shadow-blue-500/20', gradient: 'from-blue-600 via-blue-400 to-cyan-400', hex: '#3b82f6', rgb: '59, 130, 246' },
  rose: { name: 'Laser Rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/30', shadow: 'shadow-rose-500/20', gradient: 'from-rose-600 via-rose-400 to-pink-400', hex: '#f43f5e', rgb: '244, 63, 94' },
  amber: { name: 'Solar Amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/30', shadow: 'shadow-amber-500/20', gradient: 'from-amber-600 via-amber-400 to-orange-400', hex: '#f59e0b', rgb: '245, 158, 11' }
};

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
           <AlertOctagon className="w-16 h-16 text-rose-500 mb-4" />
           <h1 className="text-2xl font-black mb-2">System Failure</h1>
           <p className="text-slate-400 mb-6 max-w-xs">Something went wrong. Don't worry, your data is saved safely.</p>
           <button 
             onClick={() => window.location.reload()} 
             className="px-6 py-3 bg-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700"
           >
             <RefreshCw className="w-4 h-4" /> Reboot System
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
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
  
  // Use Profile ID for selection instead of Name to handle duplicates
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const {
    transactions, settings, isLoggedIn, deferredPrompt, accounts, stats,
    setIsLoggedIn, updateSetting, addLoan, addPayment, updateDueDate,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, handleInstallClick
  } = useLedger(tourStep, searchQuery);

  const activeTheme = THEMES[settings.themeColor] || THEMES.emerald;
  const activeTx = transactions.find(t => t.id === activeTxId);
  
  // Find profile by ID (more robust)
  const activeProfile = accounts.find(a => a.id === selectedProfileId);

  // --- NAVIGATION CONTROLLER (HISTORY API) ---
  
  // Helper to safely modify history without creating loops
  const pushHistoryState = (stateName: string) => {
    // Only push if not already there to avoid duplicates
    if (window.history.state?.view !== stateName) {
      window.history.pushState({ view: stateName }, '', window.location.search);
    }
  };

  const closeModal = useCallback(() => {
    // 1. Reset Internal State
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
    
    // 2. If we were deep in history, go back (only if this call wasn't triggered by popstate)
    // We handle the 'back' action implicitly via the popstate listener below.
    // If this function is called manually (e.g. clicking 'X'), we should also probably go back if history has state.
    if (window.history.state?.view) {
        window.history.back();
    }
  }, [tourStep]);

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

  // Handle Browser Back Button (Hardware Back on Android)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we popped back to null/root state
      if (!event.state || !event.state.view) {
        // Close everything
        setIsModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsEditDateModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsTypographyModalOpen(false);
        setIsActiveDealsModalOpen(false);
        setIsSponsorModalOpen(false);
        setIsMobileMenuOpen(false);
        setSelectedProfileId(null);
      } else if (event.state.view === 'profile') {
        // We are at profile level, ensure modals are closed
        setIsModalOpen(false);
        // ... close other modals if necessary ...
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Modal Open Wrappers that Push History
  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    pushHistoryState('modal');
  };

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
      setTimeout(() => openModal(setIsModalOpen), 500);
    }
  }, []);

  // Tour sync for settings & View State
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (tourStep !== -1) {
       setSelectedProfileId(null);
    }

    // STEPS NEEDING MOBILE MENU: 
    // 4: Settings (tour-settings)
    // 5: Fonts (tour-typography)
    // 9: Backup (tour-backup)
    if ([4, 5, 9].includes(tourStep)) {
       if (isMobile) {
          setIsMobileMenuOpen(true);
       }
    } else {
       // Close menu for other steps (Stats, Search, etc.) to clean up view
       setIsMobileMenuOpen(false);
    }

    // STEPS NEEDING SETTINGS MODAL:
    // 6: Look & Feel
    // 7: Colors
    // 8: Cool Effects
    if (tourStep >= 6 && tourStep <= 8) {
      setIsSettingsModalOpen(true);
      setIsMobileMenuOpen(false);
    } else {
      // Ensure settings modal is closed for other steps (e.g. step 9)
      // This is crucial for the backup button to be clickable/visible in the menu
      if (tourStep !== -1) {
         setIsSettingsModalOpen(false);
      }
      
      if (tourStep === -1) {
        setIsSettingsModalOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
  }, [tourStep]);

  // Finish tour
  const handleCompleteTour = useCallback(() => {
     localStorage.setItem(TOUR_KEY, 'true');
     // Reset state directly
     setTourStep(-1);
  }, []);

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

      {/* Safety Check: Only show profile if data exists. If deleted, it falls back to Dashboard */}
      {selectedProfileId && activeProfile ? (
        <div className="max-w-4xl mx-auto px-6 pt-safe">
           <ProfileView 
              account={activeProfile} settings={settings} activeTheme={activeTheme}
              onBack={handleBackAction}
              onGive={() => openModal(setIsModalOpen)}
              onReceive={(txId) => { setActiveTxId(txId); openModal(setIsPaymentModalOpen); }}
              onDeleteTransaction={deleteTransaction} onDeleteRepayment={deleteRepayment}
              onDeleteProfile={() => { deleteProfile(activeProfile.id); handleBackAction(); }}
              onUpdateDueDate={(txId) => { setActiveTxId(txId); openModal(setIsEditDateModalOpen); }}
           />
        </div>
      ) : (
        <>
          <Navbar 
            settings={settings} activeTheme={activeTheme} tourStep={tourStep} setTourStep={setTourStep}
            onOpenTutorialSelection={() => setTourStep(0)} setIsSettingsModalOpen={(v) => v ? openModal(setIsSettingsModalOpen) : setIsSettingsModalOpen(false)}
            handleExport={handleExport} setIsLoggedIn={setIsLoggedIn} deferredPrompt={deferredPrompt}
            handleInstallClick={handleInstallClick} onOpenTypographyModal={() => openModal(setIsTypographyModalOpen)}
            isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={(v) => v ? openModal(setIsMobileMenuOpen) : setIsMobileMenuOpen(false)}
          />
          <main className="max-w-4xl mx-auto px-6 space-y-8 pt-24 pb-8 md:pl-32 md:pt-12 md:pr-6 relative transition-all duration-300">
            <DashboardStats stats={stats} settings={settings} activeTheme={activeTheme} tourStep={tourStep} onShowActiveDeals={() => openModal(setIsActiveDealsModalOpen)} />
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 mt-12">
                <div>
                  <h2 className="text-2xl font-black text-slate-200 tracking-tight">People</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Friends added</p>
                </div>
                {/* ADDED ID: tour-search */}
                <div id="tour-search" className="relative group flex-grow sm:w-64">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${searchQuery ? activeTheme.text : 'text-slate-500'}`}><Search className="h-4 w-4" /></div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all uppercase tracking-wider" placeholder="Search Name..." />
                </div>
              </div>
              <div className="space-y-4">
                {accounts.length > 0 ? accounts.map(account => (
                  <AccountRow key={account.id} account={account} settings={settings} activeTheme={activeTheme} onClick={() => navigateToProfile(account.id)} />
                )) : (
                  <div className="glass border-slate-800/40 border-dashed border-2 text-center" style={{ borderRadius: 'var(--app-radius)', padding: '3rem' }}>
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800"><UserPlus className="w-10 h-10 text-slate-700" /></div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Friends Added</h3>
                    <button onClick={() => { setSearchQuery(''); openModal(setIsModalOpen); }} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>Add a Friend</button>
                  </div>
                )}
              </div>
            </div>
          </main>
          {/* ADDED ID: tour-add-profile */}
          <button id="tour-add-profile" onClick={() => openModal(setIsModalOpen)} className={`fixed bottom-8 right-6 md:right-8 w-16 h-16 md:w-18 md:h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group z-30`}><Plus className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-300" /></button>
        </>
      )}
      
      {/* Modals */}
      <SponsorModal isOpen={isSponsorModalOpen} onClose={closeModal} activeTheme={activeTheme} />
      <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={handleCompleteTour} activeTheme={activeTheme} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={closeModal} settings={settings} updateSetting={updateSetting} activeTheme={activeTheme} themes={THEMES} currencies={CURRENCIES} tourStep={tourStep} />
      <TypographyModal isOpen={isTypographyModalOpen} onClose={closeModal} currentFont={settings.fontStyle} onSelect={(font) => updateSetting('fontStyle', font)} activeTheme={activeTheme} />
      <ActiveDealsModal isOpen={isActiveDealsModalOpen} onClose={closeModal} transactions={transactions} currency={settings.currency} activeTheme={activeTheme} onSelectDeal={(profileId) => {
          // Direct navigation by Profile ID
          navigateToProfile(profileId);
      }} />
      <DealModal isOpen={isModalOpen} onClose={closeModal} onSave={(data) => { addLoan(data); setSearchQuery(''); closeModal(); }} activeTheme={activeTheme} currency={settings.currency} initialName={activeProfile ? activeProfile.name : ''} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={closeModal} onSave={(amount, date) => { addPayment(activeTxId, amount, date); closeModal(); }} activeTheme={activeTheme} currency={settings.currency} />
      <EditDateModal isOpen={isEditDateModalOpen} onClose={closeModal} onSave={(date) => { updateDueDate(activeTxId, date); closeModal(); }} initialDate={activeTx?.returnDate || ''} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={closeModal} onConfirm={() => { deleteTransaction(activeTxId); closeModal(); }} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;