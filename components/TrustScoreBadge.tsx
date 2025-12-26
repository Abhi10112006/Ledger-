
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  score: number;
}

const TrustScoreBadge: React.FC<Props> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getIcon = () => {
    if (score >= 80) return <ShieldCheck className="w-4 h-4" />;
    if (score >= 50) return <Shield className="w-4 h-4" />;
    return <ShieldAlert className="w-4 h-4" />;
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getColor()}`}>
      {getIcon()}
      <span>{score} Score</span>
    </div>
  );
};

export default TrustScoreBadge;
