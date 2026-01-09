
import React from 'react';
import { CheckCircle2, Wallet, AlertCircle, PieChart } from 'lucide-react';
import { SummaryStats, AppSettings } from '../types';

interface Props {
  stats: SummaryStats;
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
  onShowActiveDeals: () => void;
}

const DashboardStats: React.FC<Props> = ({ stats, settings, activeTheme, tourStep, onShowActiveDeals }) => {
  const totalVolume = stats.pending + stats.received;
  const recoveryRate = totalVolume > 0 ? Math.round((stats.received / totalVolume) * 100) : 0;

  return (
    <div 
      id="tour-stats"
      className={`relative transition-all duration-300 ${tourStep === 1 ? `z-[60] scale-105 ring-4 ${activeTheme.ring} ring-offset-8 ring-offset-slate-950 rounded-[2rem]` : ''}`}
    >
        {/* Main Dashboard Card */}
        <div 
            className="glass relative overflow-hidden group border border-white/5 hover:border-white/10 transition-colors"
            style={{ borderRadius: 'var(--app-radius)', padding: 'var(--app-padding)' }}
        >
            {/* Dynamic Background Gradient */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 ${activeTheme.bg} opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}></div>
            
            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <Wallet className="w-3.5 h-3.5" /> Total To Collect
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl text-slate-500 font-bold font-mono">{settings.currency}</span>
                            <span className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tighter">
                                {stats.pending.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Circular Recovery Indicator */}
                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                         <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                                className="text-slate-800"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={`${activeTheme.text} transition-all duration-1000 ease-out`}
                                strokeDasharray={`${recoveryRate}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {recoveryRate}%
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Collected Metric */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex flex-col justify-between hover:bg-slate-900 transition-colors">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> Collected
                        </div>
                        <div className="text-lg font-bold font-mono text-slate-300 truncate">
                             {settings.currency}{stats.received.toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* Active/Overdue Metric */}
                    <div 
                        onClick={onShowActiveDeals}
                        className={`p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${stats.overdueCount > 0 ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800'}`}
                    >
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${stats.overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                             {stats.overdueCount > 0 ? <AlertCircle className="w-3 h-3" /> : <PieChart className="w-3 h-3" />}
                             {stats.overdueCount > 0 ? 'Attention Needed' : 'Active Deals'}
                        </div>
                        <div className={`text-lg font-bold font-mono truncate ${stats.overdueCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                             {stats.overdueCount > 0 ? `${stats.overdueCount} Overdue` : `${stats.activeCount} Active`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardStats;
