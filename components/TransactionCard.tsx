
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
  tourStep?: number;
}

const TransactionCard: React.FC<Props> = ({ transaction, allTransactions, onAddPayment, onUpdateDueDate, onDelete, tourStep = -1 }) => {
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

  // Improved Layering for Tour Steps
  const isFirstItem = allTransactions[0]?.id === transaction.id;
  const isTourActive = tourStep >= 3 && tourStep <= 6;
  const highlightCard = isTourActive && isFirstItem;

  const highlightPayment = tourStep === 3 && isFirstItem;
  const highlightTrust = tourStep === 4 && isFirstItem;
  const highlightDueDate = tourStep === 5 && isFirstItem;
  const highlightPDF = tourStep === 6 && isFirstItem;

  return (
    <div className={`glass rounded-[2rem] p-6 transition-all duration-500 relative group overflow-hidden ${transaction.isCompleted ? 'opacity-60 grayscale-[0.3]' : 'hover:border-emerald-500/40 shadow-xl shadow-slate-950/50'} ${highlightCard ? 'z-[60] border-emerald-400 ring-4 ring-emerald-500/60 bg-slate-900 shadow-[0_0_150px_rgba(16,185,129,0.6)] scale-[1.04]' : 'z-0'}`}>
      {/* Dynamic Glow Layer */}
      {!transaction.isCompleted && (
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2.5">
          <h3 className={`text-2xl font-black tracking-tighter transition-colors ${transaction.isCompleted ? 'text-slate-500' : 'text-white'}`}>
            {transaction.friendName}
          </h3>
          <div className={`flex flex-wrap items-center gap-2.5 transition-all duration-300 ${highlightTrust ? 'scale-110 ring-[6px] ring-emerald-400/80 ring-offset-4 ring-offset-slate-950 rounded-lg z-[65] bg-emerald-500/10' : ''}`}>
            <TrustScoreBadge 
              score={trustScore} 
              friendName={transaction.friendName} 
              allTransactions={allTransactions} 
            />
            {transaction.isCompleted ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-white/5">
                <CheckCircle2 className="w-3 h-3" /> Resolved
              </span>
            ) : isOverdue ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-3 h-3" /> Breach
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-3 h-3" /> {daysDiff}d Left
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button 
            onClick={handleDownloadStatement}
            className={`p-2.5 rounded-xl transition-all duration-300 ${highlightPDF ? 'z-[65] bg-rose-600 text-white scale-125 shadow-2xl shadow-rose-500/50 ring-4 ring-rose-500/40' : 'hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400'}`}
            title="Export Intelligence Dossier"
          >
            <FileText className="w-5.5 h-5.5" />
          </button>
          <button onClick={handleDeleteClick} className="p-2.5 hover:bg-rose-500/10 rounded-xl text-slate-600 hover:text-rose-500 transition-all duration-300"><Trash2 className="w-5.5 h-5.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-1.5">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Liability</p>
          <p className="text-2xl font-mono font-bold text-slate-200">₹{totalPayable.toLocaleString('en-IN')}</p>
        </div>
        <div className="space-y-1.5 text-right">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Current Exposure</p>
          <p className={`text-2xl font-mono font-bold transition-colors ${transaction.isCompleted ? 'text-slate-500' : 'text-emerald-400'}`}>₹{balance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Modern Progress Tracking */}
      <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-8 shadow-inner border border-white/5">
        <div 
          className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${transaction.isCompleted ? 'bg-slate-700' : 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400'}`}
          style={{ width: `${progress}%` }}
        ></div>
        {progress > 0 && progress < 100 && (
          <div className="absolute top-0 right-0 h-full w-px bg-white/20"></div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={() => onUpdateDueDate(transaction.id)}
          className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest transition-all p-2.5 rounded-xl border border-transparent ${highlightDueDate ? 'z-[65] bg-blue-600 text-white scale-110 shadow-2xl shadow-blue-500/40 ring-4 ring-blue-500/40 border-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Settlement: {new Date(transaction.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        </button>
        
        {!transaction.isCompleted && (
          <button 
            onClick={() => onAddPayment(transaction.id)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${highlightPayment ? 'z-[65] bg-purple-600 text-white scale-110 shadow-2xl shadow-purple-500/40 ring-4 ring-purple-500/40' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95'}`}
          >
            <Plus className="w-4 h-4" /> Entry Payment
          </button>
        )}
      </div>

      {transaction.notes && (
        <div className="mt-6 pt-5 border-t border-slate-800/60 text-[10px] text-slate-400 leading-relaxed italic">
          <span className="text-emerald-500 font-black uppercase tracking-widest not-italic mr-3">Intelligence Log:</span>
          {transaction.notes}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
