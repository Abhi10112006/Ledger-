
import React from 'react';
// Added Plus icon to imports
import { Calendar, Trash2, CheckCircle2, Clock, ShieldAlert, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { calculateInterest, getTotalPayable, calculateDaysBetween, calculateTrustScore } from '../utils/calculations';
import TrustScoreBadge from './TrustScoreBadge';

interface Props {
  transaction: Transaction;
  allTransactions: Transaction[];
  onAddPayment: (id: string) => void;
  onDelete: (id: string) => void;
}

const TransactionCard: React.FC<Props> = ({ transaction, allTransactions, onAddPayment, onDelete }) => {
  const totalPayable = getTotalPayable(transaction);
  const interest = calculateInterest(transaction);
  const balance = Math.max(0, totalPayable - transaction.paidAmount);
  const progress = Math.min(100, (transaction.paidAmount / totalPayable) * 100);
  const trustScore = calculateTrustScore(transaction.friendName, allTransactions);

  const now = new Date();
  const dueDate = new Date(transaction.returnDate);
  const isOverdue = !transaction.isCompleted && now > dueDate;
  const daysDiff = calculateDaysBetween(now, dueDate);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(transaction.id);
  };

  return (
    <div className={`glass rounded-2xl p-5 transition-all duration-300 relative group overflow-hidden ${transaction.isCompleted ? 'opacity-60' : 'hover:border-emerald-500/40 shadow-xl shadow-slate-950/50'}`}>
      {/* Background Glow - Added pointer-events-none to prevent blocking clicks */}
      {!transaction.isCompleted && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-xl font-bold tracking-tight ${transaction.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
            {transaction.friendName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <TrustScoreBadge score={trustScore} />
            {transaction.isCompleted ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            ) : isOverdue ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 animate-pulse">
                <ShieldAlert className="w-3 h-3" /> Overdue
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                <Clock className="w-3 h-3" /> {daysDiff} Days Left
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={handleDeleteClick} 
          className="relative z-10 p-2 hover:bg-rose-500/20 rounded-full text-slate-500 hover:text-rose-400 transition-colors"
          aria-label="Delete transaction"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="space-y-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Owed</p>
          <p className="text-xl font-mono font-bold text-slate-200">
            ₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          {interest > 0 && (
            <p className="text-[10px] text-emerald-400/70">Inc. ₹{interest.toFixed(0)} Interest</p>
          )}
        </div>
        <div className="space-y-1 text-right">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Remaining</p>
          <p className={`text-xl font-mono font-bold ${transaction.isCompleted ? 'text-slate-500' : 'text-emerald-400'}`}>
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Repayment Progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${transaction.isCompleted ? 'bg-slate-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due {new Date(transaction.returnDate).toLocaleDateString()}</span>
        </div>
        
        {!transaction.isCompleted && (
          <button 
            onClick={() => onAddPayment(transaction.id)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        )}
      </div>

      {transaction.notes && (
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 italic">
          "{transaction.notes}"
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
