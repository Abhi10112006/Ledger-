
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronRight,
  Cpu,
  Target,
  ArrowRight,
  Database,
  UserCheck,
  CalendarDays,
  AlertTriangle,
  FileText,
  CreditCard,
  Sparkles,
  ZapOff,
  Image as ImageIcon
} from 'lucide-react';
import { Transaction, Repayment, InterestType } from './types';
import { getSummaryStats } from './utils/calculations';
import TransactionCard from './components/TransactionCard';

const STORAGE_KEY = 'abhi_ledger_session';
const TOUR_KEY = 'abhi_ledger_tour_complete_v8';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number>(-1);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // Refs for Tour Highlighting
  const statsRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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

    if (!tourComplete) {
      setTimeout(() => setTourStep(0), 1500);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoggedIn]);

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
      friendName,
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
    setTransactions(prev => prev.map(t => t.id === activeTxId ? {
      ...t,
      paidAmount: t.paidAmount + numPayment,
      isCompleted: (t.paidAmount + numPayment) >= t.principalAmount,
      repayments: [...t.repayments, { id: generateId(), amount: numPayment, date: new Date(paymentDate).toISOString() }]
    } : t));
    setPaymentAmount(''); setPaymentDate(new Date().toISOString().split('T')[0]); setIsPaymentModalOpen(false); setActiveTxId(null);
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
      icon: <TrendingUp className="text-emerald-400" />,
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
      desc: "When they pay you back partially, use the 'Log Payment' button on the card. It's the purple button we're highlighting now!", 
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
      desc: "Click the File icon (the red one highlighted) to generate a professional PDF statement including the new nuanced Trust breakdown.", 
      icon: <FileText className="text-rose-400" />,
      pos: 'top'
    },
    { 
      title: "7. Save Your Data", 
      desc: "Final step: Since this is offline, click the Download icon at the top to save a backup to your device. Look for the blinking green icon!", 
      icon: <Download className="text-amber-400" />,
      pos: 'bottom'
    }
  ];

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

  const displayTransactions = (transactions.length === 0 && tourStep >= 3 && tourStep <= 6) 
    ? [simulationTx] 
    : transactions;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">
              Abhi's <span className="text-emerald-400">Ledger</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">The elite offline debt tracking engine.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-4">
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group">
              <Upload className="w-10 h-10 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-slate-300 font-bold">Restore Backup</span>
              <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
            </label>
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all active:scale-95 transform">Fresh Ledger</button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = tourStep >= 0 ? tourSteps[tourStep] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-emerald-500/30 font-inter">
      {/* Navigation */}
      <nav className={`sticky top-0 px-6 py-4 flex justify-between items-center glass border-b border-slate-800/30 transition-all duration-500 ${tourStep === 7 ? 'z-[60] border-emerald-500/40' : 'z-40'}`}>
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
          <h1 className="font-bold text-xl tracking-tight">Abhi's Ledger</h1>
        </div>
        <div ref={headerActionsRef} className={`flex items-center gap-4 relative transition-all ${tourStep === 7 ? 'z-[70]' : ''}`}>
          <button onClick={() => setTourStep(0)} className="p-2 text-slate-400 hover:text-blue-400 transition-all hover:bg-slate-800/50 rounded-lg"><HelpCircle className="w-5 h-5" /></button>
          <button 
            ref={exportBtnRef} 
            onClick={handleExport} 
            className={`p-2 transition-all rounded-lg duration-500 ${tourStep === 7 ? 'z-[80] bg-emerald-500 text-slate-950 scale-125 shadow-[0_0_50px_rgba(16,185,129,1)] ring-4 ring-emerald-500/40 animate-pulse' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'}`} 
            title="Save Backup to Device"
          >
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-slate-800/50 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main ref={mainAreaRef} className="max-w-4xl mx-auto px-6 space-y-8 pt-8 relative">
        <div ref={statsRef} className={`grid grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-300 ${tourStep === 1 ? 'z-[60] scale-105 ring-4 ring-emerald-500/30 ring-offset-8 ring-offset-slate-950 rounded-3xl' : ''}`}>
          <MinimalStatCard label="PENDING" value={`₹${stats.pending.toLocaleString('en-IN')}`} icon={<TrendingUp className="w-4 h-4" />} accent="text-emerald-400" subtext={`${stats.activeCount} active`} />
          <MinimalStatCard label="RETURNED" value={`₹${stats.received.toLocaleString('en-IN')}`} icon={<CheckCircle2 className="w-4 h-4" />} accent="text-slate-300" subtext={`${stats.overdueCount} overdue`} />
        </div>

        <div className="flex justify-between items-end mt-12 border-b border-slate-800/50 pb-4">
          <h2 className="text-xl font-bold text-slate-200 tracking-tight">Activity</h2>
          <button onClick={() => setIsModalOpen(true)} className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-emerald-300 transition-colors flex items-center gap-2 group">
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" /> + New Deal
          </button>
        </div>

        <div className="space-y-6">
          {displayTransactions.length > 0 ? (
            displayTransactions.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} 
                transaction={tx} 
                allTransactions={displayTransactions} 
                onAddPayment={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsPaymentModalOpen(true); }}
                onUpdateDueDate={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); const t = transactions.find(x => x.id === id); if (t) setNewDueDate(t.returnDate.split('T')[0]); setIsEditDateModalOpen(true); }}
                onDelete={(id) => { if(tx.id === 'sim-tx') return; setActiveTxId(id); setIsDeleteModalOpen(true); }}
                tourStep={idx === 0 ? tourStep : -1}
              />
            ))
          ) : (
            <div className="glass rounded-[2.5rem] p-12 border-slate-800/40 border-dashed border-2 text-center">
              <Cpu className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-300 mb-2">No Contracts</h3>
              <p className="text-slate-500 text-sm mb-6">Start your first deal to see tracking algorithms in action.</p>
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all">Start Now</button>
            </div>
          )}
        </div>
      </main>

      <button ref={addBtnRef} onClick={() => setIsModalOpen(true)} className={`fixed bottom-8 right-8 w-18 h-18 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group ${tourStep === 2 ? 'z-[60] ring-8 ring-emerald-500/30 scale-110' : 'z-30'}`}>
        <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Tour UI Overlay - No parent z-index to allow correct child interleaving */}
      {currentStep && (
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 100 }}>
          {/* Backdrop - globally z-50, slightly lighter for better visibility */}
          <div className="absolute inset-0 bg-slate-950/80 pointer-events-auto" style={{ zIndex: 50 }} onClick={completeTour}></div>
          
          <div className={`relative w-full max-w-sm transition-all duration-500 pointer-events-auto ${
            currentStep.pos === 'top' ? 'mb-auto mt-4' : 
            currentStep.pos === 'bottom' ? 'mt-auto mb-20' : 
            'm-auto'
          }`} style={{ zIndex: 70 }}>
            <div className="glass rounded-[2.5rem] overflow-hidden border border-emerald-500/60 shadow-[0_40px_100px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-8 space-y-6 bg-slate-900/95 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                    {currentStep.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Briefing {tourStep + 1}/8</div>
                    <h3 className="text-xl font-black leading-tight text-white">{currentStep.title}</h3>
                  </div>
                </div>
                
                <p className="text-slate-100 text-sm leading-relaxed font-semibold">{currentStep.desc}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <button onClick={completeTour} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-400 transition-colors">Skip Tour</button>
                  <button 
                    onClick={() => tourStep < tourSteps.length - 1 ? setTourStep(tourStep + 1) : completeTour()}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 group shadow-2xl shadow-emerald-500/20"
                  >
                    {tourStep < tourSteps.length - 1 ? 'Next Phase' : 'Activate Ledger'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Target Pointer for Export */}
            {tourStep === 7 && (
              <div className="fixed top-24 right-10 animate-bounce pointer-events-none" style={{ zIndex: 80 }}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-1 bg-gradient-to-t from-emerald-500 to-transparent h-12"></div>
                  <Target className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,1)]" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-[2.5rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-2xl font-black flex items-center gap-3"><PlusCircle className="text-emerald-500 w-7 h-7" /> New Deal</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddLoan} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Client</label>
                  <input required autoFocus placeholder="Name" value={friendName} onChange={e => setFriendName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Principal (₹)</label>
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
              <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-transform">Save Deal</button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Log Payment</h2><button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400"><X /></button></div>
            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-2xl">₹</span><input required autoFocus type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-5 py-5 text-3xl font-mono font-bold text-emerald-400 text-center" /></div>
              <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 text-center font-mono" />
              <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">Save Payment</button>
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
