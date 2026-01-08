
import React, { useState, useEffect } from 'react';
import { Plus, Cpu, PlusCircle, Search, ArrowUpDown, Filter, UserPlus } from 'lucide-react';
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
  
  // Ad State
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  
  // Navigation State
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

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
        window.history.replaceState({}, document.title, "/");
      }
    };
    handleShortcut();

  }, []);

  // Update Settings Modal for Tour Step 5, 6, 7 (Visual Engine)
  // Step 5: Visual Tab (Modal must be open)
  // Step 6: Atmosphere (Modal must be open)
  // Step 7: Glass (Modal must be open)
  // Step 8: Backup (Modal must be closed to see Navbar)
  useEffect(() => {
    if (tourStep >= 5 && tourStep <= 7) setIsSettingsModalOpen(true);
    else if (tourStep === 8 || tourStep === -1) setIsSettingsModalOpen(false);
  }, [tourStep]);

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourStep(-1);
    setIsSettingsModalOpen(false);
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
              onBack={() => setSelectedProfileName(null)}
              onGive={() => setIsModalOpen(true)}
              onReceive={(txId) => { setActiveTxId(txId); setIsPaymentModalOpen(true); }}
              onDeleteTransaction={deleteTransaction}
              onDeleteRepayment={deleteRepayment}
              onDeleteProfile={() => { deleteProfile(activeProfile.name); setSelectedProfileName(null); }}
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
          />

          <main className="max-w-4xl mx-auto px-6 space-y-8 pt-8 relative pb-32">
            <DashboardStats 
              stats={stats}
              settings={settings}
              activeTheme={activeTheme}
              tourStep={tourStep}
            />

            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 mt-12">
                <div>
                  <h2 className="text-2xl font-black text-slate-200 tracking-tight">All Profiles</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Active Clients</p>
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
                      placeholder="SEARCH NAME..."
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
                      onClick={() => setSelectedProfileName(account.name)}
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
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Profiles Yet</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                        Start by adding your first client profile to the ledger.
                    </p>
                    <button onClick={() => { setSearchQuery(''); setIsModalOpen(true); }} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>
                        Add First Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>

          <button id="tour-add-profile" onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-8 w-18 h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group z-30`}>
            <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </>
      )}

      {/* --- MODALS --- */}
      <SponsorModal isOpen={isSponsorModalOpen} onClose={() => setIsSponsorModalOpen(false)} activeTheme={activeTheme} />
      
      <TourOverlay tourStep={tourStep} setTourStep={setTourStep} completeTour={completeTour} activeTheme={activeTheme} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} updateSetting={updateSetting} activeTheme={activeTheme} themes={THEMES} currencies={CURRENCIES} tourStep={tourStep} />

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
