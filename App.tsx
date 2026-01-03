import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  TrendingUp, 
  CheckCircle2, 
  X,
  PlusCircle,
  ShieldCheck,
  Zap,
  LogOut,
  HelpCircle,
  Cpu,
  Target,
  ArrowRight,
  UserCheck,
  CalendarDays,
  AlertTriangle,
  FileText,
  CreditCard,
  Sparkles,
  ArrowUpDown,
  Filter,
  Globe,
  MonitorDown,
  Settings,
  Palette,
  Layout,
  Type
} from 'lucide-react';
import { Transaction, Repayment, InterestType, AppSettings, ThemeColor, BackgroundType } from './types';
import { getSummaryStats, calculateTrustScore, getTotalPayable } from './utils/calculations';
import { generateStatementPDF } from './utils/pdfGenerator';
import TransactionCard from './components/TransactionCard';
import TrustScoreBadge from './components/TrustScoreBadge';

const STORAGE_KEY = 'abhi_ledger_session';
const SETTINGS_KEY = 'abhi_ledger_settings_v1';
const TOUR_KEY = 'abhi_ledger_tour_complete_v8';

type SortOption = 'name' | 'exposure' | 'trust' | 'recent';

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
    hex: '#10b981'
  },
  violet: {
    name: 'Neon Violet',
    bg: 'bg-violet-500',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    ring: 'ring-violet-500/30',
    shadow: 'shadow-violet-500/20',
    gradient: 'from-violet-600 via-violet-400 to-fuchsia-400',
    hex: '#8b5cf6'
  },
  blue: {
    name: 'Tron Blue',
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    ring: 'ring-blue-500/30',
    shadow: 'shadow-blue-500/20',
    gradient: 'from-blue-600 via-blue-400 to-cyan-400',
    hex: '#3b82f6'
  },
  rose: {
    name: 'Laser Rose',
    bg: 'bg-rose-500',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    ring: 'ring-rose-500/30',
    shadow: 'shadow-rose-500/20',
    gradient: 'from-rose-600 via-rose-400 to-pink-400',
    hex: '#f43f5e'
  },
  amber: {
    name: 'Solar Amber',
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    ring: 'ring-amber-500/30',
    shadow: 'shadow-amber-500/20',
    gradient: 'from-amber-600 via-amber-400 to-orange-400',
    hex: '#f59e0b'
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: "Abhi's Ledger",
  themeColor: 'emerald',
  background: 'solid',
  currency: '₹'
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number>(-1);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Form States
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<InterestType>('none');
  
  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState('');

  // Derived Theme State
  const activeTheme = THEMES[settings.themeColor];

  // Refs for Tour Highlighting
  const statsRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const tourComplete = localStorage.getItem(TOUR_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }

    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) { console.error("Failed settings load", e); }
    }

    if (!tourComplete) {
      setTimeout(() => setTourStep(0), 1500);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourStep(-1);
  };

  const handleExport = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `abhi_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [transactions]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          setTransactions(data);
          setIsLoggedIn(true);
          event.target.value = '';
        } else {
          alert("Invalid backup format.");
        }
      } catch (err) {
        alert("Failed to parse the file.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !amount) return;
    const numAmount = parseFloat(amount);
    setTransactions(prev => [{
      id: generateId(),
      friendName: friendName.trim(), // SANITIZATION: Prevents whitespace ghosts
      principalAmount: numAmount,
      paidAmount: 0,
      startDate: new Date(startDate).toISOString(),
      returnDate: new Date(returnDate || Date.now() + 604800000).toISOString(),
      notes,
      interestType,
      interestRate: parseFloat(interestRate) || 0,
      isCompleted: false,
      repayments: []
    }, ...prev]);
    setFriendName(''); setAmount(''); setStartDate(new Date().toISOString().split('T')[0]); setReturnDate(''); setNotes(''); setInterestRate('0'); setInterestType('none'); setIsModalOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxId || !paymentAmount) return;
    const numPayment = parseFloat(paymentAmount);
    
    setTransactions(prev => prev.map(t => {
      if (t.id === activeTxId) {
        const newRepayment: Repayment = { 
          id: generateId(), 
          amount: numPayment, 
          date: new Date(paymentDate).toISOString() 
        };
        const updatedRepayments = [...t.repayments, newRepayment];
        const updatedPaidAmount = t.paidAmount + numPayment;

        // Calculate total payable including interest to determine completion
        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: updatedPaidAmount };
        const totalPayable = getTotalPayable(tempTx);
        
        // Contract is complete if total paid >= total payable (allowing slight float precision tolerance)
        const isCompleted = updatedPaidAmount >= (totalPayable - 0.1);

        return {
          ...t,
          paidAmount: updatedPaidAmount,
          isCompleted,
          repayments: updatedRepayments
        };
      }
      return t;
    }));

    setPaymentAmount(''); 
    setPaymentDate(new Date().toISOString().split('T')[0]); 
    setIsPaymentModalOpen(false); 
    setActiveTxId(null);
  };

  const handleUpdateDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxId || !newDueDate) return;
    setTransactions(prev => prev.map(t => t.id === activeTxId ? {
      ...t,
      returnDate: new Date(newDueDate).toISOString(),
      notes: `${t.notes}\n[System Log]: Deadline adjusted to ${newDueDate}`
    } : t));
    setNewDueDate(''); setIsEditDateModalOpen(false); setActiveTxId(null);
  };

  // Logic to group and sort transactions by Client
  const accounts = useMemo(() => {
    const simulationTx: Transaction = {
      id: 'sim-tx',
      friendName: 'Example Client',
      principalAmount: 5000,
      paidAmount: 1500,
      startDate: new Date().toISOString(),
      returnDate: new Date(Date.now() + 604800000).toISOString(),
      notes: 'Sample deal for tour.',
      interestType: 'monthly',
      interestRate: 3,
      isCompleted: false,
      repayments: []
    };

    const txToProcess = (transactions.length === 0 && tourStep >= 3 && tourStep <= 6) 
      ? [simulationTx] 
      : transactions;

    // Grouping
    const grouped: Record<string, Transaction[]> = {};
    txToProcess.forEach(t => {
      const name = t.friendName.trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(t);
    });

    // Transform into Account objects for sorting
    const accountList = Object.entries(grouped).map(([name, txs]) => {
      const exposure = txs.reduce((acc, t) => acc + (getTotalPayable(t) - t.paidAmount), 0);
      const trust = calculateTrustScore(name, transactions);
      const lastActivity = Math.max(...txs.map(t => new Date(t.startDate).getTime()));
      
      return {
        name,
        transactions: txs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        totalExposure: exposure,
        trustScore: trust,
        lastActivity
      };
    });

    // Sorting
    return accountList.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'exposure': return b.totalExposure - a.totalExposure;
        case 'trust': return b.trustScore - a.trustScore;
        case 'recent': return b.lastActivity - a.lastActivity;
        default: return 0;
      }
    });
  }, [transactions, sortBy, tourStep]);

  const stats = getSummaryStats(transactions);

  const tourSteps = [
    { 
      title: "Welcome aboard!", 
      desc: "This ledger is your personal vault. I'll show you how to master your cash flow in 8 easy steps. Ready?", 
      icon: <Sparkles className="text-cyan-400" />,
      pos: 'center'
    },
    { 
      title: "1. Monitor Exposure", 
      desc: "The Dashboard tracks your money real-time. 'Pending' is the capital currently in the wild. 'Returned' is what's safely back in your pocket.", 
      icon: <TrendingUp className={activeTheme.text} />,
      pos: 'bottom'
    },
    { 
      title: "2. Issue a Loan", 
      desc: "Hit this '+' button to start a new record. Add the person, interest rate, and a return date. Everything is calculated automatically.", 
      icon: <PlusCircle className="text-blue-400" />,
      pos: 'top'
    },
    { 
      title: "3. Log Installments", 
      desc: "When they pay you back partially, use the 'Log Payment' button on the card. It's the large button we're highlighting now!", 
      icon: <CreditCard className="text-purple-400" />,
      pos: 'top' 
    },
    { 
      title: "4. Neural Trust Score", 
      desc: "The Score tracks reliability from 0 to 100. Click the score to see a full breakdown of factors like on-time payments and late penalties.", 
      icon: <UserCheck className="text-emerald-500" />,
      pos: 'bottom' 
    },
    { 
      title: "5. Flex Deadlines", 
      desc: "Plans change. Click the 'Due Date' on any card to extend the return window. The system will log this as a term adjustment.", 
      icon: <CalendarDays className="text-blue-400" />,
      pos: 'top' 
    },
    { 
      title: "6. Detailed PDF Dossier", 
      desc: "Click the File icon (the red one highlighted) next to the Total Liability to generate a professional PDF statement including the new nuanced Trust breakdown.", 
      icon: <FileText className="text-rose-400" />,
      pos: 'top'
    },
    { 
      title: "7. Save Your Data", 
      desc: "Final step: Since this is offline, click the Download icon at the top to save a backup to your device. Look for the blinking icon!", 
      icon: <Download className="text-amber-400" />,
      pos: 'bottom'
    }
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 relative overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-slate-950/80 pointer-events-none"></div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <ShieldCheck className="w-12 h-12 text-slate-200" />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">
              {settings.userName.split(' ')[0] || "Abhi's"} <span className={activeTheme.text}>Ledger</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">The elite offline debt tracking engine.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-4">
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group">
              <Upload className={`w-10 h-10 ${activeTheme.text} mb-3 group-hover:scale-110 transition-transform`} />
              <span className="text-slate-300 font-bold">Restore Backup</span>
              <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
            </label>
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all active:scale-95 transform">Fresh Ledger</button>
            {deferredPrompt && (
              <button onClick={handleInstallClick} className="w-full py-4 mt-2 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                <MonitorDown className="w-5 h-5" /> Install App
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = tourStep >= 0 ? tourSteps[tourStep] : null;

  // Background Styles Logic
  const getBackgroundClass = () => {
    switch(settings.background) {
      case 'nebula': return 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950';
      case 'grid': return 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] bg-slate-950';
      default: return 'bg-slate-950';
    }
  };

  return (
    <div className={`min-h-screen text-slate-100 pb-24 selection:bg-emerald-500/30 font-inter ${getBackgroundClass()}`}>
       {/* Nebula Ambient Glow */}
       {settings.background === 'nebula' && (
         <div className={`fixed top-0 left-0 right-0 h-[50vh] ${activeTheme.bg}/10 blur-[120px] pointer-events-none rounded-b-full`}></div>
       )}

      {/* Navigation */}
      <nav className={`sticky top-0 px-6 py-4 flex justify-between items-center glass border-b border-slate-800/30 transition-all duration-500 ${tourStep === 7 ? `z-[60] ${activeTheme.border}` : 'z-40'}`}>
        <div className="flex items-center gap-3">
          <Zap className={`w-6 h-6 ${activeTheme.text}`} />
          <h1 className="font-bold text-xl tracking-tight hidden sm:block">{settings.userName}</h1>
          <h1 className="font-bold text-xl tracking-tight sm:hidden">{settings.userName.split(' ')[0]}</h1>
        </div>
        <div ref={headerActionsRef} className={`flex items-center gap-3 relative transition-all ${tourStep === 7 ? 'z-[70]' : ''}`}>
          
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick} 
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${activeTheme.border} rounded-lg hover:bg-white/5 transition-all flex items-center gap-2 ${activeTheme.text}`}
            >
              <MonitorDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Install</span>
            </button>
          )}

          <button onClick={() => setIsSettingsModalOpen(true)} className={`p-2 text-slate-400 hover:${activeTheme.text} transition-all hover:bg-slate-800/50 rounded-lg`}>
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          <button onClick={() => setTourStep(0)} className="p-2 text-slate-400 hover:text-blue-400 transition-all hover:bg-slate-800/50 rounded-lg"><HelpCircle className="w-5 h-5" /></button>
          <button 
            ref={exportBtnRef} 
            onClick={handleExport} 
            className={`p-2 transition-all rounded-lg duration-500 ${tourStep === 7 ? `z-[80] ${activeTheme.bg} text-slate-950 scale-125 shadow-[0_0_50px_rgba(255,255,255,0.3)] ring-4 ${activeTheme.ring} animate-pulse` : `text-slate-400 hover:${activeTheme.text} hover:bg-slate-800/50`}`} 
            title="Save Backup to Device"
          >
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-slate-800/50 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main ref={mainAreaRef} className="max-w-4xl mx-auto px-6 space-y-8 pt-8 relative">
        <div ref={statsRef} className={`grid grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-300 ${tourStep === 1 ? `z-[60] scale-105 ring-4 ${activeTheme.ring} ring-offset-8 ring-offset-slate-950 rounded-3xl` : ''}`}>
          <MinimalStatCard label="PENDING" value={`${settings.currency}${stats.pending.toLocaleString('en-IN')}`} icon={<TrendingUp className="w-4 h-4" />} accent={activeTheme.text} subtext={`${stats.activeCount} active`} />
          <MinimalStatCard label="RETURNED" value={`${settings.currency}${stats.received.toLocaleString('en-IN')}`} icon={<CheckCircle2 className="w-4 h-4" />} accent="text-slate-300" subtext={`${stats.overdueCount} overdue`} />
        </div>

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
              <button onClick={() => setIsModalOpen(true)} className={`border ${activeTheme.border} ${activeTheme.text} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:${activeTheme.bg} hover:text-slate-950 transition-all flex items-center gap-2 group whitespace-nowrap shrink-0`}>
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
                        <div className="flex items-center gap-3 mt-1">
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
                       {/* PDF Button - Account Level */}
                      <button 
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
                    {/* Visual Connector for Grouping */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 via-slate-800 to-transparent hidden sm:block"></div>
                    
                    {account.transactions.map((tx, txIdx) => (
                      <TransactionCard 
                        key={tx.id} 
                        transaction={tx} 
                        allTransactions={transactions} 
                        onAddPayment={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsPaymentModalOpen(true); }}
                        onUpdateDueDate={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); const t = transactions.find(x => x.id === id); if (t) setNewDueDate(t.returnDate.split('T')[0]); setIsEditDateModalOpen(true); }}
                        onDelete={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsDeleteModalOpen(true); }}
                        tourStep={(accIdx === 0 && txIdx === 0) ? tourStep : -1}
                        currency={settings.currency}
                        themeStyles={activeTheme}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="glass rounded-[2.5rem] p-12 border-slate-800/40 border-dashed border-2 text-center">
                <Cpu className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Profiles Detected</h3>
                <p className="text-slate-500 text-sm mb-6">Initiate a new contract to build your intelligence database.</p>
                <button onClick={() => setIsModalOpen(true)} className={`px-8 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold hover:brightness-110 transition-all`}>Start Now</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <button ref={addBtnRef} onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-8 w-18 h-18 ${activeTheme.bg} hover:brightness-110 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group ${tourStep === 2 ? `z-[60] ring-8 ${activeTheme.ring} scale-110` : 'z-30'}`}>
        <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Tour UI Overlay */}
      {currentStep && (
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 100 }}>
          <div className="absolute inset-0 bg-slate-950/80 pointer-events-auto" style={{ zIndex: 50 }} onClick={completeTour}></div>
          
          <div className={`relative w-full max-w-sm transition-all duration-500 pointer-events-auto ${
            currentStep.pos === 'top' ? 'mb-auto mt-4' : 
            currentStep.pos === 'bottom' ? 'mt-auto mb-20' : 
            'm-auto'
          }`} style={{ zIndex: 70 }}>
            <div className={`glass rounded-[2.5rem] overflow-hidden border ${activeTheme.border} shadow-[0_40px_100px_rgba(0,0,0,1)] flex flex-col`}>
              <div className="p-8 space-y-6 bg-slate-900/95 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                    {currentStep.icon}
                  </div>
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.text} mb-1`}>Briefing {tourStep + 1}/8</div>
                    <h3 className="text-xl font-black leading-tight text-white">{currentStep.title}</h3>
                  </div>
                </div>
                
                <p className="text-slate-100 text-sm leading-relaxed font-semibold">{currentStep.desc}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <button onClick={completeTour} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-400 transition-colors">Skip Tour</button>
                  <button 
                    onClick={() => tourStep < tourSteps.length - 1 ? setTourStep(tourStep + 1) : completeTour()}
                    className={`px-6 py-3 ${activeTheme.bg} text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 group shadow-2xl ${activeTheme.shadow}`}
                  >
                    {tourStep < tourSteps.length - 1 ? 'Next Phase' : 'Activate Ledger'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {tourStep === 7 && (
              <div className="fixed top-24 right-10 animate-bounce pointer-events-none" style={{ zIndex: 80 }}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-1 bg-gradient-to-t ${activeTheme.gradient} to-transparent h-12`}></div>
                  <Target className={`w-10 h-10 ${activeTheme.text} drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-[2.5rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-xl font-black flex items-center gap-3"><Settings className={`${activeTheme.text} w-5 h-5`} /> Personalization</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              
              {/* Identity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Type className="w-3 h-3" /> Identity
                </div>
                <div className="space-y-3">
                  <label className="text-xs text-slate-400 font-medium">Ledger Name</label>
                  <input 
                    type="text" 
                    value={settings.userName}
                    onChange={(e) => updateSetting('userName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
                 <div className="space-y-3">
                  <label className="text-xs text-slate-400 font-medium">Global Currency</label>
                  <div className="flex gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => updateSetting('currency', c)}
                        className={`w-10 h-10 rounded-lg font-mono font-bold flex items-center justify-center transition-all ${settings.currency === c ? `${activeTheme.bg} text-slate-950` : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Palette className="w-3 h-3" /> System Accent
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(THEMES) as ThemeColor[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSetting('themeColor', t)}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all border-2 ${settings.themeColor === t ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                      style={{ backgroundColor: THEMES[t].hex }}
                      title={THEMES[t].name}
                    >
                      {settings.themeColor === t && <CheckCircle2 className="w-5 h-5 text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Layout className="w-3 h-3" /> Visual Environment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => updateSetting('background', 'solid')}
                    className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'solid' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                  >
                    <div className="w-full h-12 bg-slate-950 rounded-lg mb-2 border border-slate-700"></div>
                    <div className="text-xs font-bold text-slate-200">Deep Space</div>
                    <div className="text-[10px] text-slate-500">Minimalist Solid</div>
                  </button>

                  <button 
                    onClick={() => updateSetting('background', 'nebula')}
                    className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'nebula' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                  >
                    <div className={`w-full h-12 rounded-lg mb-2 border border-slate-700 overflow-hidden relative`}>
                       <div className={`absolute top-0 left-0 w-full h-full bg-slate-950`}></div>
                       <div className={`absolute top-0 left-0 w-full h-full ${activeTheme.bg}/40 blur-xl`}></div>
                    </div>
                    <div className="text-xs font-bold text-slate-200">Nebula</div>
                    <div className="text-[10px] text-slate-500">Ambient Gradient</div>
                  </button>

                  <button 
                    onClick={() => updateSetting('background', 'grid')}
                    className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'grid' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                  >
                     <div className="w-full h-12 bg-[linear-gradient(to_right,#80808050_1px,transparent_1px),linear-gradient(to_bottom,#80808050_1px,transparent_1px)] bg-[size:10px_10px] bg-slate-950 rounded-lg mb-2 border border-slate-700"></div>
                    <div className="text-xs font-bold text-slate-200">Cyber Grid</div>
                    <div className="text-[10px] text-slate-500">Tech Pattern</div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-[2.5rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-2xl font-black flex items-center gap-3"><PlusCircle className={`${activeTheme.text} w-7 h-7`} /> New Deal</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddLoan} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Client</label>
                  <input required autoFocus placeholder="Name" value={friendName} onChange={e => setFriendName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Principal ({settings.currency})</label>
                  <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Start</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">End</label>
                  <input required type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Interest (%)</label>
                  <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Cycle</label>
                  <select value={interestType} onChange={e => setInterestType(e.target.value as InterestType)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 appearance-none">
                    <option value="none">Fixed</option><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <button className={`w-full py-5 ${activeTheme.bg} text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl ${activeTheme.shadow} active:scale-[0.98] transition-transform`}>Save Deal</button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Log Payment</h2><button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400"><X /></button></div>
            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="relative"><span className={`absolute left-5 top-1/2 -translate-y-1/2 ${activeTheme.text} font-bold text-2xl`}>{settings.currency}</span><input required autoFocus type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={`w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-5 py-5 text-3xl font-mono font-bold ${activeTheme.text} text-center`} /></div>
              <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 text-center font-mono" />
              <button className={`w-full py-5 ${activeTheme.bg} text-slate-950 rounded-2xl font-black shadow-lg`}>Save Payment</button>
            </form>
          </div>
        </div>
      )}

      {isEditDateModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Extend Return</h2><button onClick={() => setIsEditDateModalOpen(false)} className="text-slate-400"><X /></button></div>
            <form onSubmit={handleUpdateDueDate} className="space-y-6">
              <input required autoFocus type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-5 text-xl font-mono font-bold text-blue-400 text-center" />
              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black">Update Deadline</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-in zoom-in-90 duration-300">
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2 text-white">Confirm Deletion</h2>
            <p className="text-slate-400 mb-8">This action is permanent and will purge this deal from your ledger.</p>
            <div className="space-y-3">
              <button onClick={() => { setTransactions(prev => prev.filter(t => t.id !== activeTxId)); setIsDeleteModalOpen(false); setActiveTxId(null); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform">Purge Record</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MinimalStatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; accent: string; subtext: string }> = ({ label, value, icon, accent, subtext }) => (
  <div className="glass p-6 rounded-[2.5rem] border border-slate-800/40 flex flex-col justify-between aspect-[1.3/1] transition-all hover:border-slate-700/60 group">
    <div className={`flex items-center gap-2 ${accent} font-black text-[10px] tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity`}>{icon}<span>{label}</span></div>
    <div className="mt-2"><div className="text-3xl sm:text-4xl font-bold text-slate-100 font-mono tracking-tighter leading-none">{value}</div>{subtext && <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">{subtext}</div>}</div>
  </div>
);

export default App;
