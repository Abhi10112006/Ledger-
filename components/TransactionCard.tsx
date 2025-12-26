
import React from 'react';
import { Calendar, Trash2, CheckCircle2, Clock, ShieldAlert, Plus, CalendarPlus, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { calculateInterest, getTotalPayable, calculateDaysBetween, calculateTrustScore } from '../utils/calculations';
import { generateStatementPDF } from '../utils/pdfGenerator';
import TrustScoreBadge from './TrustScoreBadge';

interface Props {
  transaction: Transaction;
  allTransactions: Transaction[];
  onAddPayment: (id: string) => void;
  onUpdateDueDate: (id: string) => void;
  onDelete: (id: string) => void;
}

const TransactionCard: React.FC<Props> = ({ transaction, allTransactions, onAddPayment, onUpdateDueDate, onDelete }) => {
  const totalPayable = getTotalPayable(transaction);
  const interest = calculateInterest(transaction);
  const balance = Math.max(0, totalPayable - transaction.paidAmount);
  const progress = Math.min(100, (transaction.paidAmount / totalPayable) * 100);
  const trustScore = calculateTrustScore(transaction.friendName, allTransactions);

  const now = new Date();
  const dueDate = new Date(transaction.returnDate);
  const isOverdue = !transaction.isCompleted && now > dueDate;
  const daysDiff = calculateDaysBetween(now, dueDate);

  const handleDownloadStatement = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateStatementPDF(transaction.friendName, allTransactions);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(transaction.id);
  };

  return (
    <div className={`glass rounded-2xl p-5 transition-all duration-300 relative group overflow-hidden ${transaction.isCompleted ? 'opacity-60 grayscale-[0.3]' : 'hover:border-emerald-500/40 shadow-xl shadow-slate-950/50'}`}>
      {/* Background Glow */}
      {!transaction.isCompleted && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-5">
        <div className="space-y-2">
          <h3 className={`text-xl font-bold tracking-tight ${transaction.isCompleted ? 'text-slate-500' : 'text-slate-100'}`}>
            {transaction.friendName}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <TrustScoreBadge score={trustScore} />
            {transaction.isCompleted ? (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                <CheckCircle2 className="w-2.5 h-2.5" /> Completed Deal
              </span>
            ) : isOverdue ? (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <ShieldAlert className="w-2.5 h-2.5" /> Overdue
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-2.5 h-2.5" /> {daysDiff} Days Remaining
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button 
            onClick={handleDownloadStatement}
            className="p-2 hover:bg-emerald-500/20 rounded-xl text-slate-500 hover:text-emerald-400 transition-all active:scale-90"
            title="Download PDF Statement"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteClick} 
            className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-400 transition-all active:scale-90"
            aria-label="Delete transaction"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em]">Liability</p>
          <p className="text-xl font-mono font-bold text-slate-200">
            ₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          {interest > 0 && (
            <p className="text-[9px] text-emerald-400/80 font-medium tracking-wide">+ ₹{interest.toFixed(0)} Interest Accrued</p>
          )}
        </div>
        <div className="space-y-1 text-right">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em]">Exposure</p>
          <p className={`text-xl font-mono font-bold ${transaction.isCompleted ? 'text-slate-500' : 'text-emerald-400'}`}>
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
          <span>Repayment Strategy</span>
          <span>{progress.toFixed(0)}% Recovered</span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${transaction.isCompleted ? 'bg-slate-600' : 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={() => onUpdateDueDate(transaction.id)}
          className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors group/btn ${isOverdue ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Calendar className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
          <span>Due {new Date(transaction.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          {!transaction.isCompleted && <CalendarPlus className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
        </button>
        
        {!transaction.isCompleted && (
          <button 
            onClick={() => onAddPayment(transaction.id)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Log Payment
          </button>
        )}
      </div>

      {transaction.notes && (
        <div className="mt-5 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 italic leading-relaxed">
          <span className="text-slate-600 font-bold uppercase not-italic mr-2">Logs:</span>
          {transaction.notes}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
