
import React, { useState, useEffect } from 'react';
import { Plus, Cpu, PlusCircle, FileText } from 'lucide-react';
import { useLedger, SortOption } from './hooks/useLedger';
import { generateStatementPDF } from './utils/pdfGenerator';
import TransactionCard from './components/TransactionCard';
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
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

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
    handleExport,
    handleImport,
    handleInstallClick
  } = useLedger(tourStep);

  // Derived Theme State
  const activeTheme = THEMES[settings.themeColor];
  const activeTx = transactions.find(t => t.id === activeTxId);

  useEffect(() => {
    const tourComplete = localStorage.getItem(TOUR_KEY);
    if (!tourComplete) {
      setTimeout(() => setTourStep(0), 1500);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourStep(-1);
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
          default: return 'font-sans-app';
      }
  };

  const getBaseColor = () => {
      return settings.baseColor === 'oled' ? '#000000' : '#020617';
  };

  // Background Styles Logic for Texture
  const getBackgroundClass = () => {
    switch(settings.background) {
      case 'nebula': return 'bg-gradient-to-br from-[var(--app-bg)] via-slate-900/50 to-[var(--app-bg)]';
      case 'grid': return 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen text-slate-100 pb-24 selection:bg-emerald-500/30 ${getFontClass()} ${getBackgroundClass()}`}>
       
       {/* Inject Dynamic CSS Variables for Visual Engine */}
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

       {/* Grain Overlay */}
       {settings.enableGrain && <div className="grain-overlay"></div>}

       {/* Nebula Ambient Glow - Controlled by Base Color */}
       {settings.background === 'nebula' && (
         <div className={`fixed top-0 left-0 right-0 h-[50vh] ${activeTheme.bg}/10 blur-[120px] pointer-events-none rounded-b-full`}></div>
       )}

      <Navbar 
        settings={settings}
        activeTheme={activeTheme}
        tourStep={tourStep}
        setTourStep={setTourStep}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        handleExport={handleExport}
        setIsLoggedIn={setIsLoggedIn}
        deferredPrompt={deferredPrompt}
        handleInstallClick={handleInstallClick}
      />

      <main className="max-w-4xl mx-auto px-6 space-y-8 pt-8 relative">
        <DashboardStats 
          stats={stats}
          settings={settings}
          activeTheme={activeTheme}
          tourStep={tourStep}
        />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-6 mt-12">
            <div>
              <h2 className="text-2xl font-black text-slate-200 tracking-tight">Accounts Portfolio</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{accounts.length} Client Profiles Active</p>
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-800 p-1 rounded-xl shrink-0">
                {(['recent', 'exposure', 'trust', 'name'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${sortBy === opt ? `${activeTheme.bg} text-slate-950 shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button 
                id="tour-new-deal"
                onClick={() => setIsModalOpen(true)} 
                className={`border ${activeTheme.border} ${activeTheme.text} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:${activeTheme.bg} hover:text-slate-950 transition-all flex items-center gap-2 group whitespace-nowrap shrink-0`}
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" /> <span className="hidden sm:inline">+ New Deal</span><span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {accounts.length > 0 ? (
              accounts.map((account, accIdx) => (
                <div key={account.name} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${accIdx * 100}ms` }}>
                  {/* Account Section Header */}
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-xl">
                        <span className={`text-xl font-black ${activeTheme.text}`}>{account.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-white">{account.name}</h3>
                        <div className="flex items-center gap-3 mt-1" id={accIdx === 0 ? "tour-trust" : undefined}>
                           <TrustScoreBadge 
                            score={account.trustScore} 
                            friendName={account.name} 
                            allTransactions={transactions} 
                            currency={settings.currency}
                          />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {account.transactions.length} Contracts
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                       {/* PDF Button */}
                      <button 
                        id={accIdx === 0 ? "tour-pdf" : undefined}
                        onClick={() => generateStatementPDF(account.name, transactions, settings)}
                        className={`p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:${activeTheme.border} hover:${activeTheme.bg.replace('bg-', 'bg-')}/10 transition-all group ${tourStep === 6 && accIdx === 0 ? 'z-[65] ring-4 ring-rose-500/60 bg-rose-500/10 border-rose-500' : ''}`}
                        title="Generate Statement"
                      >
                        <FileText className={`w-5 h-5 ${tourStep === 6 && accIdx === 0 ? 'text-rose-500' : `text-slate-400 group-hover:${activeTheme.text}`}`} />
                      </button>

                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Liability</p>
                        <p className={`text-2xl font-mono font-black ${account.totalExposure > 0 ? activeTheme.text : 'text-slate-600'}`}>
                          {settings.currency}{account.totalExposure.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account's Transactions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2 sm:pl-16 relative">
                    {/* Visual Connector */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 via-slate-800 to-transparent hidden sm:block"></div>
                    
                    {account.transactions.map((tx, txIdx) => (
                      <TransactionCard 
                        key={tx.id} 
                        transaction={tx} 
                        allTransactions={transactions} 
                        onAddPayment={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsPaymentModalOpen(true); }}
                        onUpdateDueDate={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsEditDateModalOpen(true); }}
                        onDelete={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsDeleteModalOpen(true); }}
                        tourStep={(accIdx === 0 && txIdx === 0) ? tourStep : -1}
                        currency={settings.currency}
                        themeStyles={activeTheme}
                        isFirstCard={accIdx === 0 && txIdx === 0}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="glass border-slate-800/40 border-dashed border-2 text-center"
                style={{ borderRadius: 'var(--app-radius)', padding: '3rem' }}
              >
                <Cpu className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Profiles Detected</h3>
                <p className="text-slate-500 text-sm mb-6">Initiate a new contract to build your intelligence database.</p>
                <button onClick={() => setIsModalOpen(true)} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>Start Now</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <button onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-8 w-18 h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group ${tourStep === 2 ? `z-[60] ring-8 ${activeTheme.ring} scale-110` : 'z-30'}`}>
        <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <TourOverlay 
        tourStep={tourStep}
        setTourStep={setTourStep}
        completeTour={completeTour}
        activeTheme={activeTheme}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        updateSetting={updateSetting}
        activeTheme={activeTheme}
        themes={THEMES}
        currencies={CURRENCIES}
      />

      <DealModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          addLoan(data);
          setIsModalOpen(false);
        }}
        activeTheme={activeTheme}
        currency={settings.currency}
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
