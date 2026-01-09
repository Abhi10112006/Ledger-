
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

// --- THEME CONFIGURATION ---
const THEMES = {
  emerald: {
    name: 'Cyber Emerald',
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-500/30',
    shadow: 'shadow-emerald-500/20',
    gradient: 'from-emerald-600 via-emerald-400 to-teal-400',
    hex: '#10b981',
    rgb: '16, 185, 129'
  },
  violet: {
    name: 'Neon Violet',
    bg: 'bg-violet-500',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    ring: 'ring-violet-500/30',
    shadow: 'shadow-violet-500/20',
    gradient: 'from-violet-600 via-violet-400 to-fuchsia-400',
    hex: '#8b5cf6',
    rgb: '139, 92, 246'
  },
  blue: {
    name: 'Tron Blue',
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    ring: 'ring-blue-500/30',
    shadow: 'shadow-blue-500/20',
    gradient: 'from-blue-600 via-blue-400 to-cyan-400',
    hex: '#3b82f6',
    rgb: '59, 130, 246'
  },
  rose: {
    name: 'Laser Rose',
    bg: 'bg-rose-500',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    ring: 'ring-rose-500/30',
    shadow: 'shadow-rose-500/20',
    gradient: 'from-rose-600 via-rose-400 to-pink-400',
    hex: '#f43f5e',
    rgb: '244, 63, 94'
  },
  amber: {
    name: 'Solar Amber',
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    ring: 'ring-amber-500/30',
    shadow: 'shadow-amber-500/20',
    gradient: 'from-amber-600 via-amber-400 to-orange-400',
    hex: '#f59e0b',
    rgb: '245, 158, 11'
  }
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
  
  // Ad State
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  
  // Navigation State
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  // Back Button Logic State
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPress = useRef<number>(0);

  // Business Logic from Hook
  const {
    transactions,
    settings,
    isLoggedIn,
    deferredPrompt,
    sortBy,
    accounts,
    stats,
    setIsLoggedIn,
    setSortBy,
    updateSetting,
    addLoan,
    addPayment,
    updateDueDate,
    deleteTransaction,
    deleteRepayment,
    deleteProfile,
    handleExport,
    handleImport,
    handleInstallClick
  } = useLedger(tourStep, searchQuery);

  // Derived Theme State
  const activeTheme = THEMES[settings.themeColor];
  const activeTx = transactions.find(t => t.id === activeTxId);

  // Find active profile object
  const activeProfile = accounts.find(a => a.name === selectedProfileName);

  // Helper to check if any modal is open
  const isAnyModalOpen = isModalOpen || isPaymentModalOpen || isDeleteModalOpen || isEditDateModalOpen || isSettingsModalOpen || isTypographyModalOpen || isActiveDealsModalOpen || isSponsorModalOpen || (tourStep !== -1);

  const closeAllModals = useCallback(() => {
    setIsModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditDateModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsTypographyModalOpen(false);
    setIsActiveDealsModalOpen(false);
    setIsSponsorModalOpen(false);
    // If tour is active, we might want to close it or handle differently. For now, we leave it.
    if (tourStep !== -1) setTourStep(-1);
  }, [tourStep]);

  // --- NAVIGATION CONTROLLER ---
  const navigateToProfile = (name: string) => {
    // Fixed SecurityError: Avoid explicit URL manipulation in environments like blob-runners
    window.history.pushState({ key: 'profile', id: name }, '', '');
    setSelectedProfileName(name);
  };

  const navigateBack = () => {
    window.history.back();
  };

  // --- HISTORY LISTENER (Back Button Logic) ---
  useEffect(() => {
    // 1. Initialize History Stack on Mount
    // Using empty string for URL to avoid cross-scheme SecurityErrors in sandboxed/preview environments
    if (!window.history.state || window.history.state.key !== 'home') {
       window.history.replaceState({ key: 'root' }, '', '');
       window.history.pushState({ key: 'home' }, '', '');
    }

    const handlePopState = (e: PopStateEvent) => {
        // A. If any modal or menu is open, close it and prevent navigation
        if (isAnyModalOpen || isMobileMenuOpen) {
            closeAllModals();
            setIsMobileMenuOpen(false);
            
            // Restore the history stack to the current view (Home or Profile)
            // Using empty string for URL to prevent SecurityErrors
            if (selectedProfileName) {
                window.history.pushState({ key: 'profile', id: selectedProfileName }, '', '');
            } else {
                window.history.pushState({ key: 'home' }, '', '');
            }
            return;
        }

        // B. Navigation Routing based on History State
        const destState = e.state;

        if (destState?.key === 'profile') {
            // User navigated back/forward to a Profile
            setSelectedProfileName(destState.id);
        } else if (destState?.key === 'home') {
            // User navigated back to Home
            setSelectedProfileName(null);
        } else if (!destState || destState.key === 'root') {
             // C. Home Page Exit Logic (User hit the 'root' state)
             const now = Date.now();
             if (now - lastBackPress.current < 2000) {
                 // Double click confirmed: Let browser exit
                 window.history.back(); 
             } else {
                 // First click: Show toast and trap user
                 lastBackPress.current = now;
                 setShowExitToast(true);
                 
                 // Push 'home' state back to keep user in app
                 window.history.pushState({ key: 'home' }, '', '');
                 
                 setTimeout(() => setShowExitToast(false), 2000);
             }
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAnyModalOpen, isMobileMenuOpen, selectedProfileName, closeAllModals]);

  // --- INITIALIZATION EFFECTS ---
  useEffect(() => {
    // 1. Check for Tour Status
    const tourComplete = localStorage.getItem(TOUR_KEY);
    if (!tourComplete) {
      setTimeout(() => setTourStep(0), 1500);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') !== 'new') {
        setIsSponsorModalOpen(true);
      }
    }

    // 2. Handle PWA Shortcuts
    const handleShortcut = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setTimeout(() => setIsModalOpen(true), 500);
        // Avoid SecurityError with explicit paths in some runners
        window.history.replaceState({}, document.title, "");
      }
    };
    handleShortcut();

  }, []);

  // Update Settings Modal for Tour Step 6-8 (Visual Engine)
  useEffect(() => {
    if (tourStep >= 6 && tourStep <= 8) {
      setIsSettingsModalOpen(true);
      setIsTypographyModalOpen(false);
    } else if (tourStep === -1) {
      setIsSettingsModalOpen(false);
    } else {
      setIsSettingsModalOpen(false);
    }
  }, [tourStep]);

  // Update Mobile Menu for Tour Steps
  useEffect(() => {
    if (tourStep !== -1) {
      const isMobile = window.innerWidth < 768;
      // Steps: 4 (Config), 5 (Typography), 9 (Backup)
      if (tourStep === 4 || tourStep === 5 || tourStep === 9) {
        if (isMobile) {
          setIsMobileMenuOpen(true);
        }
      } else {
        setIsMobileMenuOpen(false);
      }
    }
  }, [tourStep]);

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourStep(-1);
    setIsSettingsModalOpen(false);
    setIsMobileMenuOpen(false);
    setIsSponsorModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <WelcomeScreen 
        settings={settings}
        activeTheme={activeTheme}
        onLogin={() => setIsLoggedIn(true)}
        deferredPrompt={deferredPrompt}
        handleInstallClick={handleInstallClick}
        handleImport={handleImport}
        updateSetting={updateSetting}
      />
    );
  }

  // --- VISUAL ENGINE LOGIC ---
  const getRadius = () => {
      switch(settings.cornerRadius) {
          case 'sharp': return '0px';
          case 'round': return '0.75rem';
          case 'pill': return '2rem';
          default: return '2rem';
      }
  };

  const getPadding = () => {
      return settings.density === 'compact' ? '1rem' : '1.5rem';
  };

  const getFontClass = () => {
      switch(settings.fontStyle) {
          case 'mono': return 'font-mono-app';
          case 'sans': return 'font-sans-app';
          case 'system': return 'font-system-app';
          case 'serif': return 'font-serif-app';
          case 'comic': return 'font-comic-app';
          default: return 'font-sans-app';
      }
  };

  const getBaseColor = () => {
      return settings.baseColor === 'oled' ? '#000000' : '#020617';
  };

  const getBackgroundClass = () => {
    switch(settings.background) {
      case 'nebula': return 'bg-gradient-to-br from-[var(--app-bg)] via-slate-900/50 to-[var(--app-bg)]';
      case 'grid': return 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen text-slate-100 pb-safe selection:bg-emerald-500/30 ${getFontClass()} ${getBackgroundClass()}`}>
       
       <style>{`
          :root {
              --app-bg: ${getBaseColor()};
              --app-radius: ${getRadius()};
              --app-padding: ${getPadding()};
              --glass-bg: rgba(15, 23, 42, ${settings.glassOpacity});
              --glass-blur: ${settings.glassBlur}px;
              --glass-border: rgba(255, 255, 255, ${0.1 * settings.glowIntensity + 0.05});
              --glow-opacity: ${settings.glowIntensity};
          }
       `}</style>

       {settings.enableGrain && <div className="grain-overlay"></div>}

       {settings.background === 'nebula' && (
         <div className={`fixed top-0 left-0 right-0 h-[50vh] ${activeTheme.bg}/10 blur-[120px] pointer-events-none rounded-b-full`}></div>
       )}

      {/* Conditional Rendering: Profile Detail OR Main Dashboard */}
      {selectedProfileName && activeProfile ? (
        <div className="max-w-4xl mx-auto px-6 pt-safe">
           <ProfileView 
              account={activeProfile} 
              settings={settings} 
              activeTheme={activeTheme}
              onBack={navigateBack}
              onGive={() => setIsModalOpen(true)}
              onReceive={(txId) => { setActiveTxId(txId); setIsPaymentModalOpen(true); }}
              onDeleteTransaction={deleteTransaction}
              onDeleteRepayment={deleteRepayment}
              onDeleteProfile={() => { 
                  deleteProfile(activeProfile.name); 
                  navigateBack(); // Go back in history (to Home) after deletion
              }}
              onUpdateDueDate={(txId) => { setActiveTxId(txId); setIsEditDateModalOpen(true); }}
           />
        </div>
      ) : (
        <>
          <Navbar 
            settings={settings}
            activeTheme={activeTheme}
            tourStep={tourStep}
            setTourStep={setTourStep}
            onOpenTutorialSelection={() => setTourStep(0)}
            setIsSettingsModalOpen={setIsSettingsModalOpen}
            handleExport={handleExport}
            setIsLoggedIn={setIsLoggedIn}
            deferredPrompt={deferredPrompt}
            handleInstallClick={handleInstallClick}
            onOpenTypographyModal={() => setIsTypographyModalOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* 
            MAIN CONTAINER LAYOUT
            Mobile: Top padding 24 (6rem for header), NO bottom padding for rail (Hamburger mode).
            Desktop: Left padding 32 (8rem for rail), Top padding 12, Right padding 6
          */}
          <main className="max-w-4xl mx-auto px-6 space-y-8 pt-24 pb-8 md:pl-32 md:pt-12 md:pr-6 relative transition-all duration-300">
            <DashboardStats 
              stats={stats}
              settings={settings}
              activeTheme={activeTheme}
              tourStep={tourStep}
              onShowActiveDeals={() => setIsActiveDealsModalOpen(true)}
            />

            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 mt-12">
                <div>
                  <h2 className="text-2xl font-black text-slate-200 tracking-tight">People</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Friends added</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative group flex-grow sm:w-64" id="tour-search">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${searchQuery ? activeTheme.text : 'text-slate-500'}`}>
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all uppercase tracking-wider"
                      placeholder="Search Name..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {accounts.length > 0 ? (
                  accounts.map((account, accIdx) => (
                    <AccountRow 
                      key={account.name}
                      account={account}
                      settings={settings}
                      activeTheme={activeTheme}
                      onClick={() => navigateToProfile(account.name)}
                    />
                  ))
                ) : (
                  <div 
                    className="glass border-slate-800/40 border-dashed border-2 text-center"
                    style={{ borderRadius: 'var(--app-radius)', padding: '3rem' }}
                  >
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                       <UserPlus className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Friends Added</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                        Start by adding your first friend to the ledger.
                    </p>
                    <button onClick={() => { setSearchQuery(''); setIsModalOpen(true); }} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>
                        Add a Friend
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>

          <button id="tour-add-profile" onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-6 md:right-8 w-16 h-16 md:w-18 md:h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group z-30`}>
            <Plus className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </>
      )}
      
      {/* EXIT TOAST UI */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-[5000] transition-all duration-300 pointer-events-none ${showExitToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-xs font-bold uppercase tracking-widest">Press back again to exit</p>
      </div>

      {/* --- MODALS --- */}
      <SponsorModal isOpen={isSponsorModalOpen} onClose={() => setIsSponsorModalOpen(false)} activeTheme={activeTheme} />
      
      <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={completeTour} activeTheme={activeTheme} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} updateSetting={updateSetting} activeTheme={activeTheme} themes={THEMES} currencies={CURRENCIES} tourStep={tourStep} />
      <TypographyModal isOpen={isTypographyModalOpen} onClose={() => setIsTypographyModalOpen(false)} currentFont={settings.fontStyle} onSelect={(font) => updateSetting('fontStyle', font)} activeTheme={activeTheme} />
      <ActiveDealsModal isOpen={isActiveDealsModalOpen} onClose={() => setIsActiveDealsModalOpen(false)} transactions={transactions} currency={settings.currency} activeTheme={activeTheme} onSelectDeal={(name) => navigateToProfile(name)} />

      <DealModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          addLoan(data);
          setIsModalOpen(false);
        }}
        activeTheme={activeTheme}
        currency={settings.currency}
        initialName={selectedProfileName || ''}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setActiveTxId(null); }}
        onSave={(amount, date) => {
          addPayment(activeTxId, amount, date);
          setIsPaymentModalOpen(false);
          setActiveTxId(null);
        }}
        activeTheme={activeTheme}
        currency={settings.currency}
      />

      <EditDateModal 
        isOpen={isEditDateModalOpen}
        onClose={() => { setIsEditDateModalOpen(false); setActiveTxId(null); }}
        onSave={(date) => {
          updateDueDate(activeTxId, date);
          setIsEditDateModalOpen(false);
          setActiveTxId(null);
        }}
        initialDate={activeTx ? activeTx.returnDate : ''}
      />

      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setActiveTxId(null); }}
        onConfirm={() => { 
          deleteTransaction(activeTxId);
          setIsDeleteModalOpen(false);
          setActiveTxId(null); 
        }}
      />
    </div>
  );
};

export default App;
