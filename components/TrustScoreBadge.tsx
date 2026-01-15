
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, ShieldAlert, ShieldCheck, Award, X, History, Info, TrendingUp, TrendingDown, Skull, Frown, Meh, Smile } from 'lucide-react';
import { getTrustBreakdown } from '../utils/calculations';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  score: number;
  friendName?: string;
  profileId?: string;
  allTransactions?: Transaction[];
  currency: string;
}

const TrustScoreBadge: React.FC<Props> = ({ score, friendName, profileId, allTransactions = [], currency }) => {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Safe score handling
  const safeScore = isNaN(score) ? 60 : Math.round(score);

  // 7-TIER LOGIC
  const getInfo = () => {
    if (safeScore >= 91) return { 
        label: 'Trustworthy', 
        color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]', 
        icon: <Award className="w-3.5 h-3.5" />,
        desc: "Elite Borrower. Always pays on time."
    };
    if (safeScore >= 81) return { 
        label: 'Very Good', 
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', 
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        desc: "Highly reliable. Rarely misses a date."
    };
    if (safeScore >= 71) return { 
        label: 'Good', 
        color: 'text-green-400 border-green-500/30 bg-green-500/10', 
        icon: <Smile className="w-3.5 h-3.5" />,
        desc: "Generally safe. Good repayment history."
    };
    if (safeScore >= 61) return { 
        label: 'Fair', 
        color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', 
        icon: <Shield className="w-3.5 h-3.5" />,
        desc: "Okay to lend. Keep an eye on dates."
    };
    if (safeScore >= 51) return { 
        label: 'Okay', 
        color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', 
        icon: <Meh className="w-3.5 h-3.5" />,
        desc: "Borderline. Reminders might be needed."
    };
    if (safeScore >= 41) return { 
        label: 'Bad', 
        color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', 
        icon: <Frown className="w-3.5 h-3.5" />,
        desc: "Risky. Often late or difficult."
    };
    if (safeScore >= 21) return { 
        label: 'Very Bad', 
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', 
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        desc: "High Risk. Expect delays and issues."
    };
    return { 
        label: 'Worst', 
        color: 'text-rose-600 border-rose-600/50 bg-rose-950/40 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)]', 
        icon: <Skull className="w-3.5 h-3.5" />,
        desc: "Critical Risk. Do not lend."
    };
  };

  const info = getInfo();

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowModal(false);
  };

  const renderModalContent = () => {
    if (!profileId) return null;
    
    let breakdown = null;
    try {
      breakdown = getTrustBreakdown(profileId, allTransactions, currency);
    } catch (e) {
      console.error("Truth breakdown calculation failed", e);
      return null;
    }
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={handleClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="glass w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] border-white/10 relative flex flex-col h-auto max-h-[85vh] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 p-5 flex justify-between items-center border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <ShieldCheck className="text-slate-200 w-5 h-5" />
              </div>
              <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Truth Analysis</h3>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {profileId}</div>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleClose} 
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-full text-rose-400 transition-all active:scale-75"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide overscroll-contain bg-slate-950/20">
            <div className="flex flex-col items-center text-center space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className={`absolute inset-0 opacity-10 blur-xl ${info.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
              <div className={`text-6xl font-black font-mono tracking-tighter drop-shadow-lg relative z-10 ${info.color.split(' ')[0]}`}>
                {breakdown.score}
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg relative z-10 ${info.color}`}>
                {info.label} Score
              </div>
              <p className="text-slate-300 font-bold text-sm leading-relaxed max-w-[220px] relative z-10">
                {info.desc}
              </p>
            </div>

            {/* Factors */}
            {breakdown.factors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                  <Info className="w-3 h-3" /> Key Factors
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {breakdown.factors.map((f, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex justify-between items-center bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 group transition-colors hover:bg-slate-900"
                    >
                      <span className="text-xs font-semibold text-slate-300">{f.label}</span>
                      <div className={`flex items-center gap-1.5 text-xs font-black ${f.impact === 'positive' ? 'text-emerald-400' : f.impact === 'negative' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {f.impact === 'positive' ? <TrendingUp className="w-3 h-3" /> : f.impact === 'negative' ? <TrendingDown className="w-3 h-3" /> : null}
                        {f.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                <History className="w-3 h-3" /> Recent Activity
              </div>
              <div className="space-y-1 pb-4">
                {breakdown.history.slice(0, 5).map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all"
                  >
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
                  </motion.div>
                ))}
                {breakdown.history.length === 0 && (
                  <div className="p-4 text-center glass rounded-2xl border-dashed border-white/10 text-slate-600 text-[11px] italic">
                    No history detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <motion.button 
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { 
          e.stopPropagation(); 
          setShowModal(true); 
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${info.color}`}
      >
        {info.icon}
        <span>{safeScore} • {info.label}</span>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {showModal && renderModalContent()}
        </AnimatePresence>, 
        document.body
      )}
    </>
  );
};

export default TrustScoreBadge;
