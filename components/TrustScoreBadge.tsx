
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Award } from 'lucide-react';

interface Props {
  score: number;
}

const TrustScoreBadge: React.FC<Props> = ({ score }) => {
  const getInfo = () => {
    if (score >= 800) return { label: 'Excellent', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]', icon: <Award className="w-3.5 h-3.5" /> };
    if (score >= 700) return { label: 'Good', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
    if (score >= 550) return { label: 'Fair', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: <Shield className="w-3.5 h-3.5" /> };
    return { label: 'Risky', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', icon: <ShieldAlert className="w-3.5 h-3.5" /> };
  };

  const info = getInfo();

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${info.color}`}>
      {info.icon}
      <span>{score} • {info.label}</span>
    </div>
  );
};

export default TrustScoreBadge;
