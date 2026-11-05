
import React from 'react';
import { Calendar, Trash2, CheckCircle2, Clock, ShieldAlert, Plus, FileText, Barcode } from 'lucide-react';
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
  themeStyles: any;
  isFirstCard?: boolean; // New prop for targeting tour elements
}

const TransactionCard: React.FC<Props> = ({ 
  transaction, 
  onAddPayment, 
  onUpdateDueDate, 
  onDelete, 
  tourStep = -1, 
  currency,
  themeStyles,
  isFirstCard = false
}) => {
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

  const highlightPayment = tourStep === 3;
  const highlightDueDate = tourStep === 5;

  return (
    <div 
      className={`glass transition-all duration-500 relative group overflow-hidden flex flex-col ${transaction.isCompleted ? 'opacity-60 grayscale-[0.3]' : 'hover:border-white/20 shadow-2xl shadow-slate-950/50'}`}
      style={{ borderRadius: 'var(--app-radius)' }}
    >
      {/* Dossier Header Area - Darker section */}
      <div className="bg-slate-950/40 p-5 border-b border-dashed border-slate-700 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dossier / Receipt</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 uppercase tracking-widest mt-1">
              ID: {transaction.id.slice(0, 10)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <button onClick={handleDeleteClick} className="p-2 hover:bg-rose-500/10 rounded-full text-slate-600 hover:text-rose-500 transition-all duration-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {transaction.isCompleted ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
            </span>
          ) : isOverdue ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> Breach
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-3.5 h-3.5" /> {daysDiff} Days Left
            </span>
          )}
        </div>
      </div>

      {/* Dossier Body - Paper-like content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Principal</span>
            <span className="font-mono text-sm text-slate-300">{currency}{transaction.principalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Interest</span>
            <span className="font-mono text-sm text-slate-400">+{currency}{interest.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Total Payable</span>
            <span className="font-mono text-lg font-bold text-slate-200">{currency}{totalPayable.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Amount Paid</span>
            <span className="font-mono text-sm text-emerald-400">-{currency}{transaction.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex justify-between items-end pt-2">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Balance Due</span>
            <span className={`font-mono text-2xl font-black transition-colors ${transaction.isCompleted ? 'text-slate-500' : themeStyles.text}`}>
              {currency}{balance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Progress Bar styled as a Dossier tracker */}
        <div className="mb-6">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
            <span>Payment Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${transaction.isCompleted ? 'bg-slate-600' : `bg-gradient-to-r ${themeStyles.gradient}`}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {transaction.notes && (
          <div className="mb-6 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 font-mono">
            " {transaction.notes} "
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-dashed border-slate-700 relative">
          {/* Decorative faux barcode for Dossier look */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-2 text-slate-800">
             <Barcode className="w-8 h-4 opacity-50" />
          </div>

          <button 
            id={isFirstCard ? "tour-date" : undefined}
            onClick={() => onUpdateDueDate(transaction.id)}
            className={`flex items-center justify-center flex-1 gap-2 text-[10px] font-black uppercase tracking-widest transition-all py-3 px-2 rounded-xl border ${highlightDueDate ? 'z-[65] bg-blue-600 text-white scale-110 shadow-2xl shadow-blue-500/40 border-transparent' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(transaction.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </button>
          
          {!transaction.isCompleted && (
            <button 
              id={isFirstCard ? "tour-entry" : undefined}
              onClick={() => onAddPayment(transaction.id)}
              className={`flex items-center justify-center flex-1 gap-2 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${highlightPayment ? 'z-[65] bg-purple-600 text-white scale-110 shadow-2xl' : `${themeStyles.bg} hover:brightness-110 text-slate-950 shadow-lg ${themeStyles.shadow} active:scale-95`}`}
            >
              <Plus className="w-4 h-4" /> Log Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
