
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, MonitorDown, ChevronRight } from 'lucide-react';
import { AppSettings } from '../types';
import { motion } from 'framer-motion';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  onLogin: () => void;
  showInstallButton: boolean;
  handleInstallClick: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateSetting: (key: keyof AppSettings, value: any) => void;
}

const DEMO_THEMES = [
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30' },
  { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' }
];

const WelcomeScreen: React.FC<Props> = ({ 
    settings, 
    activeTheme: initialTheme, 
    onLogin, 
    showInstallButton, 
    handleInstallClick, 
    handleImport
}) => {
  const [themeIndex, setThemeIndex] = useState(0);

  // Dynamic Theme Cycle
  useEffect(() => {
    const interval = setInterval(() => {
        setThemeIndex(prev => (prev + 1) % DEMO_THEMES.length);
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  const currentTheme = DEMO_THEMES[themeIndex];

  // Smart Name Logic
  const rawName = settings.userName.split(' ')[0] || "Abhi";
  const displayName = rawName.replace(/'s$/i, '');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-slate-100 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-[-20%] left-[-10%] w-[120%] h-[60%] ${currentTheme.bg} blur-[120px] opacity-30 pointer-events-none rounded-full transition-colors duration-1000`}
      />

      <motion.div 
        key="main"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
        className="w-full max-w-sm space-y-10 relative z-10"
      >
        {/* Logo Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex justify-center relative group"
          >
            <div className={`absolute inset-0 ${currentTheme.bg} blur-[40px] opacity-20 group-hover:opacity-40 transition-all duration-1000`}></div>
            <div className="w-28 h-28 bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative z-10 ring-1 ring-white/5">
              <ShieldCheck className={`w-14 h-14 ${currentTheme.text} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors duration-1000`} />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <motion.h1 
              className="text-5xl font-black tracking-tighter text-white"
            >
              <span className="text-slate-500 font-thin text-3xl align-top mr-1">{displayName}'s</span>
              Ledger
            </motion.h1>
            <motion.p 
              className="text-slate-500 text-xs font-mono font-bold uppercase tracking-[0.3em]"
            >
              Financial Mainframe
            </motion.p>
          </div>
        </div>
        
        {/* Actions Grid */}
        <div className="space-y-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogin} 
            className="group relative w-full h-20 rounded-3xl overflow-hidden shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-slate-100 group-hover:bg-white transition-colors"></div>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-1/2 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            
            <div className="absolute inset-0 flex items-center justify-between px-8 text-slate-950">
               <div className="text-left">
                  <span className="block text-lg font-black tracking-tight">System Login</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">Access Dashboard</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-slate-300 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-900" />
               </div>
            </div>
          </motion.button>

          <div className={`grid ${showInstallButton ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center h-24 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:border-slate-700 transition-all cursor-pointer group backdrop-blur-md"
            >
              <Upload className={`w-6 h-6 text-slate-500 group-hover:${currentTheme.text} transition-colors mb-2 duration-500`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Restore Data</span>
              <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
            </motion.label>

            {showInstallButton && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick} 
                className="flex flex-col items-center justify-center h-24 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:border-slate-700 transition-all cursor-pointer group backdrop-blur-md"
              >
                <MonitorDown className={`w-6 h-6 text-slate-500 group-hover:${currentTheme.text} transition-colors mb-2 duration-500`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Install App</span>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <motion.div 
          className="absolute bottom-[-60px] left-0 right-0 text-center"
        >
           <p className="text-[9px] text-slate-600 font-mono">ENCRYPTED // OFFLINE // SECURE</p>
        </motion.div>

      </motion.div>

      <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1 }}
          className="absolute bottom-6 right-6 z-20"
      >
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 font-mono">V1.0</span>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
