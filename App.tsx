
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  X,
  PlusCircle,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  LogOut,
  Info,
  Trash2,
  AlertTriangle,
  CalendarDays,
  Calendar
} from 'lucide-react';
import { Transaction, Repayment, InterestType } from './types';
import { getSummaryStats } from './utils/calculations';
import TransactionCard from './components/TransactionCard';

const STORAGE_KEY = 'abhi_ledger_session';

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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoggedIn]);

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
          alert("Backup file content is not a valid transaction list.");
        }
      } catch (err) {
        alert("Failed to parse the file. Please ensure it's a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !amount) return;

    const numAmount = parseFloat(amount);
    
    setTransactions(prev => {
      const newTx: Transaction = {
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
      };
      return [newTx, ...prev];
    });

    setFriendName('');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setReturnDate('');
    setNotes('');
    setInterestRate('0');
    setInterestType('none');
    setIsModalOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxId || !paymentAmount) return;

    const numPayment = parseFloat(paymentAmount);
    
    setTransactions(prev => {
      const txIdx = prev.findIndex(t => t.id === activeTxId);
      if (txIdx === -1) return prev;

      const updated = [...prev];
      const tx = updated[txIdx];
      const newPaidAmount = tx.paidAmount + numPayment;
      
      updated[txIdx] = {
        ...tx,
        paidAmount: newPaidAmount,
        isCompleted: newPaidAmount >= tx.principalAmount,
        repayments: [
          ...tx.repayments,
          { id: generateId(), amount: numPayment, date: new Date(paymentDate).toISOString() }
        ]
      };
      return updated;
    });

    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(false);
    setActiveTxId(null);
  };

  const handleUpdateDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxId || !newDueDate) return;

    setTransactions(prev => {
      const txIdx = prev.findIndex(t => t.id === activeTxId);
      if (txIdx === -1) return prev;

      const updated = [...prev];
      updated[txIdx] = {
        ...updated[txIdx],
        returnDate: new Date(newDueDate).toISOString(),
        notes: `${updated[txIdx].notes}\n[Term Updated]: Due date extended to ${newDueDate}`
      };
      return updated;
    });

    setNewDueDate('');
    setIsEditDateModalOpen(false);
    setActiveTxId(null);
  };

  const confirmDelete = () => {
    if (activeTxId) {
      setTransactions(prev => prev.filter(t => t.id !== activeTxId));
      setIsDeleteModalOpen(false);
      setActiveTxId(null);
    }
  };

  const stats = getSummaryStats(transactions);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center border border-emerald-500/30 animate-pulse">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              Abhi's <span className="text-emerald-400">Ledger</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Cyberpunk personal finance tracker. Totally offline, totally private. 
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50 hover:bg-slate-900 transition-all cursor-pointer group">
              <Upload className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-slate-300 font-bold text-base">Import Backup File</span>
              <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
            </label>
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-colors shadow-lg active:scale-95 transform">
              Initialize New Ledger
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-emerald-500/30">
      <nav className="sticky top-0 z-40 glass border-b border-slate-800/30 px-6 py-4 flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
          <h1 className="font-bold text-xl tracking-tight">Abhi's Ledger</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleExport} className="p-2 text-slate-400 hover:text-emerald-400 transition-all hover:bg-slate-800/50 rounded-lg" title="Export JSON"><Download className="w-5 h-5" /></button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-slate-800/50 rounded-lg" title="Logout"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <MinimalStatCard 
            label="PENDING" 
            value={`₹${stats.pending.toLocaleString('en-IN')}`} 
            icon={<TrendingUp className="w-4 h-4" />}
            accent="text-emerald-400"
            subtext={`${stats.activeCount} active loans`}
          />
          <MinimalStatCard 
            label="RETURNED" 
            value={`₹${stats.received.toLocaleString('en-IN')}`} 
            icon={<CheckCircle2 className="w-4 h-4" />}
            accent="text-slate-300"
            subtext={`${stats.overdueCount} overdue`}
          />
        </div>

        <div className="flex justify-between items-end mt-12 border-b border-slate-800/50 pb-4">
          <h2 className="text-xl font-bold text-slate-200 tracking-tight">Recent Activity</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] hover:text-emerald-300 transition-colors"
          >
            + Initiate Contract
          </button>
        </div>

        <div className="space-y-6">
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <TransactionCard 
                key={tx.id} 
                transaction={tx} 
                allTransactions={transactions}
                onAddPayment={(id) => { setActiveTxId(id); setIsPaymentModalOpen(true); }}
                onUpdateDueDate={(id) => { 
                  setActiveTxId(id); 
                  const tx = transactions.find(t => t.id === id);
                  if (tx) setNewDueDate(tx.returnDate.split('T')[0]);
                  setIsEditDateModalOpen(true); 
                }}
                onDelete={(id) => { setActiveTxId(id); setIsDeleteModalOpen(true); }}
              />
            ))
          ) : (
            <div className="text-center py-20 text-slate-500">
              <div className="w-16 h-16 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-800/50">
                <Info className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-medium">No active contracts found in local sector.</p>
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all z-50 group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <PlusCircle className="text-emerald-500 w-7 h-7" /> New Deal
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddLoan} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Counterparty</label>
                  <input required autoFocus placeholder="Enter name" value={friendName} onChange={e => setFriendName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Principal (₹)</label>
                  <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Disbursement Date</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Return Date</label>
                  <input required type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Interest Rate (%)</label>
                  <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Accrual Cycle</label>
                  <select 
                    value={interestType} 
                    onChange={e => setInterestType(e.target.value as InterestType)} 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 appearance-none"
                  >
                    <option value="none">No Interest</option>
                    <option value="daily">Per Day</option>
                    <option value="monthly">Per Month</option>
                    <option value="yearly">Per Year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contract Memo</label>
                <textarea 
                  rows={2} 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  placeholder="Notes for history..."
                />
              </div>

              <button className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all mt-4 active:scale-[0.98]">Authorize Deal</button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-xl font-black uppercase tracking-tight">Log Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Repayment Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-2xl">₹</span>
                  <input required autoFocus type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-5 text-3xl font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 text-center" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Repayment Date</label>
                <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-colors text-center font-mono" />
              </div>
              <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Verify Repayment</button>
            </form>
          </div>
        </div>
      )}

      {isEditDateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-blue-500 w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">Extend Due Date</h2>
              </div>
              <button onClick={() => setIsEditDateModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleUpdateDueDate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Settlement Date</label>
                <input required autoFocus type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-5 text-xl font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500/50 text-center" />
              </div>
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">Changing terms will be logged in the permanent ledger history.</p>
              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Update Contract</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="glass w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-90 duration-300 border-rose-500/20">
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase text-slate-100 tracking-tight">Purge Contract?</h2>
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                  This action erases the record from the local sector <span className="text-rose-400 font-bold uppercase">permanently</span>. Recovering data will be impossible.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-900/40 active:scale-95">Confirm Purge</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest transition-all">Abort Action</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MinimalStatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; accent: string; subtext: string }> = ({ label, value, icon, accent, subtext }) => (
  <div className="glass p-6 rounded-[2.5rem] border border-slate-800/40 flex flex-col justify-between aspect-[1.3/1] transition-all hover:border-slate-700/60 group">
    <div className={`flex items-center gap-2 ${accent} font-black text-[10px] tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity`}>
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-2">
      <div className="text-3xl sm:text-4xl font-bold text-slate-100 font-mono tracking-tighter leading-none">{value}</div>
      {subtext && <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">{subtext}</div>}
    </div>
  </div>
);

export default App;
