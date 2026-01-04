
import React from 'react';
import { ShieldCheck, Upload, MonitorDown } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  onLogin: () => void;
  deferredPrompt: any;
  handleInstallClick: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const WelcomeScreen: React.FC<Props> = ({ 
    settings, 
    activeTheme, 
    onLogin, 
    deferredPrompt, 
    handleInstallClick, 
    handleImport 
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950/80 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <ShieldCheck className="w-12 h-12 text-slate-200" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            {settings.userName.split(' ')[0] || "Abhi's"} <span className={activeTheme.text}>Ledger</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">The elite offline debt tracking engine.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-4">
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group">
            <Upload className={`w-10 h-10 ${activeTheme.text} mb-3 group-hover:scale-110 transition-transform`} />
            <span className="text-slate-300 font-bold">Restore Backup</span>
            <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
          </label>
          <button onClick={onLogin} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all active:scale-95 transform">Fresh Ledger</button>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="w-full py-4 mt-2 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
              <MonitorDown className="w-5 h-5" /> Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
