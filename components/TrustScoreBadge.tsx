
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, ShieldAlert, ShieldCheck, Award, X, History, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { getTrustBreakdown } from '../utils/calculations';
import { Transaction } from '../types';

interface Props {
  score: number;
  friendName?: string;
  allTransactions?: Transaction[];
  currency: string;
}

const TrustScoreBadge: React.FC<Props> = ({ score, friendName, allTransactions = [], currency }) => {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Safe score handling to prevent crashes
  const safeScore = isNaN(score) ? 50 : Math.round(score);

  const getInfo = () => {
    if (safeScore >= 90) return { label: 'Elite', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]', icon: <Award className="w-3.5 h-3.5" /> };
    if (safeScore >= 75) return { label: 'Reliable', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
    if (safeScore >= 50) return { label: 'Fair', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: <Shield className="w-3.5 h-3.5" /> };
    if (safeScore >= 25) return { label: 'Risky', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', icon: <ShieldAlert className="w-3.5 h-3.5" /> };
    return { label: 'Critical', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse', icon: <ShieldAlert className="w-3.5 h-3.5" /> };
  };

  const getDescription = () => {
    if (safeScore >= 75) return "This person is good to give money.";
    if (safeScore >= 50) return "This person is fair/ok to give money.";
    return "This person is bad to give money.";
  };

  const info = getInfo();

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowModal(false);
  };

  // Only calculate breakdown if modal is requested to save performance
  // and ensure we don't return null from the component body
  const renderModal = () => {
    if (!showModal || !friendName) return null;
    
    let breakdown = null;
    try {
      breakdown = getTrustBreakdown(friendName, allTransactions, currency);
    } catch (e) {
      console.error("Trust breakdown calculation failed", e);
      return null;
    }
    
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={handleClose}
      >
        <div 
          className="glass w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] border-white/10 relative flex flex-col h-auto max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 p-5 flex justify-between items-center border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="text-emerald-500 w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Trust Report</h3>
            </div>
            <button 
              type="button"
              onClick={handleClose} 
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-full text-rose-400 transition-all active:scale-75"
              aria-label="Exit briefing"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide overscroll-contain bg-slate-950/20">
            <div className="flex flex-col items-center text-center space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className={`text-6xl font-black font-mono tracking-tighter drop-shadow-lg ${info.color.split(' ')[0]}`}>
                {breakdown.score}
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${info.color}`}>
                {info.label} Performance
              </div>
              <p className="text-slate-300 font-bold text-sm leading-relaxed max-w-[220px]">
                {getDescription()}
              </p>
            </div>

            {/* Factors */}
            {breakdown.factors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                  <Info className="w-3 h-3" /> Score Details
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {breakdown.factors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 group transition-colors hover:bg-slate-900">
                      <span className="text-xs font-semibold text-slate-300">{f.label}</span>
                      <div className={`flex items-center gap-1.5 text-xs font-black ${f.impact === 'positive' ? 'text-emerald-400' : f.impact === 'negative' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {f.impact === 'positive' ? <TrendingUp className="w-3 h-3" /> : f.impact === 'negative' ? <TrendingDown className="w-3 h-3" /> : null}
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                <History className="w-3 h-3" /> Payment History
              </div>
              <div className="space-y-1 pb-4">
                {breakdown.history.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                    <div className={`w-1.5 h-1.5 rounded-full ${h.status === 'On-Time' ? 'bg-emerald-500' : h.status === 'Late' ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
                    <div className="flex-1 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-slate-200 font-bold">{h.event}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{h.date}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${h.status === 'On-Time' ? 'text-emerald-400 bg-emerald-500/10' : h.status === 'Late' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 bg-slate-500/10'}`}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
                {breakdown.history.length === 0 && (
                  <div className="p-4 text-center glass rounded-2xl border-dashed border-white/10 text-slate-600 text-[11px] italic">
                    No records found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${info.color}`}
      >
        {info.icon}
        <span>{safeScore} • {info.label}</span>
      </button>

      {mounted && showModal && createPortal(renderModal(), document.body)}
    </>
  );
};

export default TrustScoreBadge;
