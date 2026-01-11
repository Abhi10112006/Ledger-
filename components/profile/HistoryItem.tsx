
import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, Loader2, Image as ImageIcon, ScrollText, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../../types';

interface HistoryItemProps {
  item: any;
  isActive: boolean;
  onToggle: () => void;
  settings: AppSettings;
  sharingId: string | null;
  onShareReceipt: (item: any) => void;
  onShareLoan: (item: any) => void;
  onUpdateDueDate: (id: string) => void;
  onEditRepayment: (txId: string, repId: string) => void;
  onDelete: (type: 'TRANSACTION' | 'REPAYMENT', id: string, repId?: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  isActive,
  onToggle,
  settings,
  sharingId,
  onShareReceipt,
  onShareLoan,
  onUpdateDueDate,
  onEditRepayment,
  onDelete
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ layout: { duration: 0.2 }, default: { duration: 0.1 } }}
      className={`glass p-4 rounded-2xl flex items-center justify-between border cursor-pointer group transition-colors duration-300 ${isActive ? 'border-white/10 bg-slate-900/60' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}
    >
        <motion.div layout="position" className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${item.type === 'LOAN' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {item.type === 'LOAN' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
          </div>
          <div>
              <div className="text-sm font-bold text-slate-200">
                {item.type === 'LOAN' ? 'You gave' : 'You got'}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                <Calendar className="w-3 h-3" />
                {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                {item.type === 'LOAN' && item.rawTx.hasTime && (
                  <span className="text-slate-400 ml-1">
                      {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
                {item.type === 'LOAN' && item.rawTx.isCompleted && (
                  <span className="bg-slate-800 px-1 rounded text-slate-400">SETTLED</span>
                )}
              </div>
          </div>
        </motion.div>
        
        <div className="flex items-center">
            <motion.div layout="position" className="text-right mr-3">
              <div className={`font-mono font-bold text-lg ${item.type === 'LOAN' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {settings.currency}{item.amount.toLocaleString('en-IN')}
              </div>
              {item.type === 'LOAN' && (
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5 truncate max-w-[100px]">
                  {item.note}
                </div>
              )}
            </motion.div>
            
            <AnimatePresence>
            {isActive && (
                <motion.div 
                    initial={{ opacity: 0, width: 0, x: 20 }}
                    animate={{ opacity: 1, width: 'auto', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="flex items-center gap-2 overflow-hidden pl-2 border-l border-white/5"
                    onClick={(e) => e.stopPropagation()} // Prevent toggling row when clicking actions
                >
                    {item.type === 'PAYMENT' && (
                      <>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShareReceipt(item);
                            }}
                            className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg flex items-center justify-center"
                            title="Generate Receipt"
                        >
                            {sharingId === item.repId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditRepayment(item.id, item.repId!);
                            }}
                            className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg"
                            title="Edit Payment"
                        >
                            <Edit className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                    
                    {item.type === 'LOAN' && (
                      <>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShareLoan(item);
                            }}
                            className="p-2 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg"
                            title="Share Contract"
                        >
                            {sharingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateDueDate(item.id);
                            }}
                            className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg"
                            title="Edit Loan"
                        >
                            <Edit className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (item.type === 'LOAN') {
                                onDelete('TRANSACTION', item.id);
                            } else {
                                onDelete('REPAYMENT', item.id, item.repId!);
                            }
                        }}
                        className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};

export default HistoryItem;
