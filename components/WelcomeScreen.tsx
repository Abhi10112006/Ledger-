
import React from 'react';
import { ShieldCheck, Upload, MonitorDown } from 'lucide-react';
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

const WelcomeScreen: React.FC<Props> = ({ 
    settings, 
    activeTheme, 
    onLogin, 
    showInstallButton, 
    handleInstallClick, 
    handleImport
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950/80 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <ShieldCheck className="w-12 h-12 text-slate-200" />
            </div>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter">
            {settings.userName.split(' ')[0] || "Abhi's"} <span className={activeTheme.text}>Ledger</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">Simple money tracker for you and your friends.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 pt-4">
          <motion.label 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group"
          >
            <Upload className={`w-10 h-10 ${activeTheme.text} mb-3 group-hover:scale-110 transition-transform`} />
            <span className="text-slate-300 font-bold">Restore Backup File</span>
            <input type="file" className="hidden" accept=".json,application/json" onChange={handleImport} />
          </motion.label>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogin} 
            className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
          >
            Start Fresh
          </motion.button>
          
          {showInstallButton && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleInstallClick} 
              className="w-full py-4 mt-2 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <MonitorDown className="w-5 h-5" /> Install App
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
