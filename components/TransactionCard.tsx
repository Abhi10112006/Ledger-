
import React from 'react';
import { Calendar, Trash2, CheckCircle2, Clock, ShieldAlert, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { calculateInterest, getTotalPayable, calculateDaysBetween } from '../utils/calculations';

interface Props {
  transaction: Transaction;
  allTransactions: Transaction[];
  onAddPayment: (id: string) => void;
  onUpdateDueDate: (id: string) => void;
  onDelete: (id: string) => void;
  tourStep?: number;
  currency: string;
}

const TransactionCard: React.FC<Props> = ({ transaction, onAddPayment, onUpdateDueDate, onDelete, tourStep = -1, currency }) => {
  const totalPayable = getTotalPayable(transaction);
  const interest = calculateInterest(transaction);
  const balance = Math.max(0, totalPayable - transaction.paidAmount);
  const progress = Math.min(100, (transaction.paidAmount / totalPayable) * 100);
  
  const now = new Date();
  const dueDate = new Date(transaction.returnDate);
  const isOverdue = !transaction.isCompleted && now > dueDate;
  const daysDiff = calculateDaysBetween(now, dueDate);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(transaction.id);
  };

  // Improved Layering for Tour Steps
  const isTourActive = tourStep >= 3 && tourStep <= 6;
  const highlightCard = isTourActive;

  const highlightPayment = tourStep === 3;
  const highlightDueDate = tourStep === 5;

  return (
    <div className={`glass rounded-[2rem] p-6 transition-all duration-500 relative group overflow-hidden ${transaction.isCompleted ? 'opacity-50 grayscale-[0.3]' : 'hover:border-emerald-500/40 shadow-xl shadow-slate-950/50'} ${highlightCard ? 'z-[60] border-emerald-400 ring-4 ring-emerald-500/60 bg-slate-900 shadow-[0_0_150px_rgba(16,185,129,0.6)] scale-[1.04]' : 'z-0'}`}>
      {/* Dynamic Glow Layer */}
      {!transaction.isCompleted && (
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contract</span>
            <span className="text-[10px] font-mono text-slate-600">#{transaction.id.slice(0,6).toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {transaction.isCompleted ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                <CheckCircle2 className="w-3 h-3" /> Settled
              </span>
            ) : isOverdue ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <ShieldAlert className="w-3 h-3" /> Breach
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-3 h-3" /> {daysDiff}d Left
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button onClick={handleDeleteClick} className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-700 hover:text-rose-500 transition-all duration-300"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Total</p>
          <p className="text-xl font-mono font-bold text-slate-300">{currency}{totalPayable.toLocaleString('en-IN')}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Balance</p>
          <p className={`text-xl font-mono font-bold transition-colors ${transaction.isCompleted ? 'text-slate-500' : 'text-emerald-400'}`}>{currency}{balance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Modern Progress Tracking */}
      <div className="relative h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-6 border border-white/5">
        <div 
          className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${transaction.isCompleted ? 'bg-slate-700' : 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button 
          onClick={() => onUpdateDueDate(transaction.id)}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all p-2 rounded-xl border border-transparent ${highlightDueDate ? 'z-[65] bg-blue-600 text-white scale-110 shadow-2xl shadow-blue-500/40' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(transaction.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        </button>
        
        {!transaction.isCompleted && (
          <button 
            onClick={() => onAddPayment(transaction.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${highlightPayment ? 'z-[65] bg-purple-600 text-white scale-110 shadow-2xl' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'}`}
          >
            <Plus className="w-3.5 h-3.5" /> Entry
          </button>
        )}
      </div>

      {transaction.notes && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-[9px] text-slate-500 italic truncate">
          {transaction.notes}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
