
import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { SummaryStats, AppSettings } from '../types';

interface MinimalStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  subtext: string;
}

const MinimalStatCard: React.FC<MinimalStatCardProps> = ({ label, value, icon, accent, subtext }) => (
  <div 
    className="glass border border-slate-800/40 flex flex-col justify-between aspect-[1.3/1] transition-all hover:border-slate-700/60 group"
    style={{ borderRadius: 'var(--app-radius)', padding: 'var(--app-padding)' }}
  >
    <div className={`flex items-center gap-2 ${accent} font-black text-[10px] tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity`}>{icon}<span>{label}</span></div>
    <div className="mt-2"><div className="text-3xl sm:text-4xl font-bold text-slate-100 font-mono tracking-tighter leading-none">{value}</div>{subtext && <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">{subtext}</div>}</div>
  </div>
);

interface Props {
  stats: SummaryStats;
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
}

const DashboardStats: React.FC<Props> = ({ stats, settings, activeTheme, tourStep }) => {
  return (
    <div 
      id="tour-stats"
      className={`grid grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-300 ${tourStep === 1 ? `z-[60] scale-105 ring-4 ${activeTheme.ring} ring-offset-8 ring-offset-slate-950 rounded-3xl` : ''}`}
    >
      <MinimalStatCard 
        label="TO COLLECT" 
        value={`${settings.currency}${stats.pending.toLocaleString('en-IN')}`} 
        icon={<TrendingUp className="w-4 h-4" />} 
        accent={activeTheme.text} 
        subtext={`${stats.activeCount} friends`} 
      />
      <MinimalStatCard 
        label="COLLECTED" 
        value={`${settings.currency}${stats.received.toLocaleString('en-IN')}`} 
        icon={<CheckCircle2 className="w-4 h-4" />} 
        accent="text-slate-300" 
        subtext={`${stats.overdueCount} late`} 
      />
    </div>
  );
};

export default DashboardStats;
