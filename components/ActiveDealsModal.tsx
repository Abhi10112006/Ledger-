
import React from 'react';
import { X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Transaction } from '../types';
import { getTotalPayable } from '../utils/calculations';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: string;
  activeTheme: any;
  onSelectDeal?: (profileId: string) => void;
}

const ActiveDealsModal: React.FC<Props> = ({ isOpen, onClose, transactions, currency, activeTheme, onSelectDeal }) => {
  const activeDeals = transactions.filter(t => !t.isCompleted).sort((a, b) => {
    // Sort by due date (overdue first)
    return new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime();
  });

  const now = new Date();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  return (
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass w-full max-w-lg rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] relative z-10"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl bg-slate-800 ${activeTheme.text}`}>
                  <AlertCircle className="w-5 h-5" />
               </div>
               <h2 className="text-xl font-black text-white">Active Deals</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="overflow-y-auto space-y-3 pr-2 scrollbar-hide"
          >
            {activeDeals.length > 0 ? (
              activeDeals.map((deal) => {
                 const total = getTotalPayable(deal);
                 const remaining = total - deal.paidAmount;
                 const isOverdue = now > new Date(deal.returnDate);
                 const dueDateStr = new Date(deal.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                 return (
                  <motion.div 
                    key={deal.id}
                    variants={itemVariants}
                    onClick={(e) => {
                        e.stopPropagation();
                        if(onSelectDeal) {
                            onSelectDeal(deal.profileId);
                            onClose();
                        }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border flex justify-between items-center transition-all cursor-pointer group ${isOverdue ? 'bg-rose-950/10 border-rose-900/30 hover:bg-rose-900/20' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-1">
                       <div className="flex items-center gap-2">
                           <div className={`font-bold text-sm sm:text-base ${isOverdue ? 'text-rose-200' : 'text-slate-200'}`}>
                              {deal.friendName}
                           </div>
                           {deal.profileId && (
                              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded border border-slate-800">
                                  #{deal.profileId}
                              </span>
                           )}
                           <ArrowRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isOverdue ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                             {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                             Due: {dueDateStr}
                          </span>
                       </div>
                    </div>
                    <div className="text-right pl-3">
                       <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Remaining</div>
                       <div className={`font-mono font-bold text-lg ${isOverdue ? 'text-rose-400' : activeTheme.text}`}>
                          {currency}{Math.round(remaining).toLocaleString('en-IN')}
                       </div>
                    </div>
                  </motion.div>
                 );
              })
            ) : (
              <motion.div variants={itemVariants} className="text-center py-10 text-slate-500">
                 <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p className="text-sm">No active deals found.</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default ActiveDealsModal;
