
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AppSettings } from '../types';
import TrustScoreBadge from './TrustScoreBadge';
import { motion } from 'framer-motion';

interface Props {
  account: any;
  settings: AppSettings;
  activeTheme: any;
  onClick: () => void;
  index?: number;
}

const AccountRow: React.FC<Props> = ({ account, settings, activeTheme, onClick, index = 0 }) => {
  const isOverdue = account.transactions.some((t: any) => {
    return !t.isCompleted && new Date() > new Date(t.returnDate);
  });

  const getAvatarBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <motion.div 
      id={index === 0 ? 'tour-account-row' : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-white/5"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full ${getAvatarBg(account.trustScore)} text-slate-950 flex items-center justify-center font-black text-xl shadow-lg relative`}>
          {account.name.charAt(0).toUpperCase()}
          {isOverdue && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          )}
        </div>
        
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-lg leading-tight">{account.name}</h3>
            {account.id && (
               <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">
                  #{account.id}
               </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TrustScoreBadge 
                score={account.trustScore}
                friendName={account.name}
                profileId={account.id}
                allTransactions={account.transactions}
                currency={settings.currency}
            />
            {account.transactions.length > 0 && (
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-60">
                 {account.transactions.length} Contracts
               </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          {account.totalExposure > 0 ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">To Pay</p>
              <p className={`text-lg font-mono font-black ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                {settings.currency}{Math.round(account.totalExposure).toLocaleString('en-IN')}
              </p>
            </>
          ) : (
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded-md">Settled</span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
      </div>
    </motion.div>
  );
};

export default AccountRow;
