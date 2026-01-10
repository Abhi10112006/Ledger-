
import React from 'react';
import { ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';
import TrustScoreBadge from './TrustScoreBadge';

interface Props {
  account: any;
  settings: AppSettings;
  activeTheme: any;
  onClick: () => void;
}

const AccountRow: React.FC<Props> = ({ account, settings, activeTheme, onClick }) => {
  const isOverdue = account.transactions.some((t: any) => {
    return !t.isCompleted && new Date() > new Date(t.returnDate);
  });

  return (
    <div 
      onClick={onClick}
      className="glass p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer border border-transparent hover:border-white/5"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full ${activeTheme.bg} text-slate-950 flex items-center justify-center font-black text-xl shadow-lg relative`}>
          {account.name.charAt(0).toUpperCase()}
          {isOverdue && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          )}
        </div>
        
        <div className="space-y-0.5">
          <h3 className="font-bold text-slate-100 text-lg">{account.name}</h3>
          <div className="flex items-center gap-2">
            <TrustScoreBadge 
                score={account.trustScore}
                friendName={account.name}
                allTransactions={account.transactions}
                currency={settings.currency}
            />
            {account.transactions.length > 0 && (
               <span className="text-[10px] text-slate-500 font-medium">
                 {account.transactions.length} Loans
               </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          {account.totalExposure > 0 ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">To Collect</p>
              <p className={`text-lg font-mono font-black ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                {settings.currency}{Math.round(account.totalExposure).toLocaleString('en-IN')}
              </p>
            </>
          ) : (
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Settled</span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
};

export default AccountRow;
