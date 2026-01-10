
import React from 'react';
import { BellRing } from 'lucide-react';
import { Transaction, AppSettings } from '../../types';
import TrustScoreBadge from '../TrustScoreBadge';

interface Props {
  account: {
    id: string;
    name: string;
    trustScore: number;
    totalExposure: number;
    transactions: Transaction[];
  };
  settings: AppSettings;
  activeTheme: any;
  nextDueTx: Transaction | null;
  onSetReminder: () => void;
}

const ProfileStats: React.FC<Props> = ({ account, settings, activeTheme, nextDueTx, onSetReminder }) => {
  
  const getAvatarClasses = (score: number) => {
    if (score >= 75) return 'bg-emerald-500 shadow-emerald-500/20';
    if (score >= 50) return 'bg-amber-500 shadow-amber-500/20';
    return 'bg-rose-500 shadow-rose-500/20';
  };

  const getDueDateColor = () => {
    if (!nextDueTx) return 'text-slate-500';
    const today = new Date();
    const due = new Date(nextDueTx.returnDate);
    if (today > due) return 'text-rose-400 animate-pulse'; 
    const diffTime = Math.abs(due.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'text-amber-400'; 
    return 'text-blue-400';
  };

  return (
    <div className="text-center space-y-2 mb-8 shrink-0">
       <div className={`w-20 h-20 mx-auto rounded-full ${getAvatarClasses(account.trustScore)} flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl`}>
          {account.name.charAt(0).toUpperCase()}
       </div>
       <div className="space-y-0.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">{account.name}</h2>
          <div className="text-[10px] text-slate-500 font-mono font-bold bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-800">
              ID: {account.id}
          </div>
       </div>
       <div className="flex justify-center mt-2">
          <TrustScoreBadge 
              score={account.trustScore}
              friendName={account.name}
              profileId={account.id}
              allTransactions={account.transactions}
              currency={settings.currency}
          />
       </div>
       <div className="mt-6 flex flex-col items-center gap-3">
           <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 inline-block min-w-[200px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">To Collect</p>
              <p className={`text-3xl font-mono font-black ${account.totalExposure > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                 {settings.currency}{Math.round(account.totalExposure).toLocaleString('en-IN')}
              </p>
           </div>
           {nextDueTx && (
             <button 
               onClick={onSetReminder}
               className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all group"
             >
               <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next Collection</p>
                 <p className={`text-xs font-bold font-mono ${getDueDateColor()}`}>
                   {new Date(nextDueTx.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                 </p>
               </div>
               <div className="w-px h-6 bg-slate-700"></div>
               <div className={`p-1.5 rounded-full bg-slate-900 ${activeTheme.text} group-hover:scale-110 transition-transform`}>
                  <BellRing className="w-4 h-4" />
               </div>
             </button>
           )}
       </div>
    </div>
  );
};

export default ProfileStats;
