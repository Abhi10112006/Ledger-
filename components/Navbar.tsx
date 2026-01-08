
import React from 'react';
import { Zap, MonitorDown, Settings, HelpCircle, Download, LogOut } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
  setTourStep: (step: number) => void;
  onOpenTutorialSelection: () => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  handleExport: () => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  deferredPrompt: any;
  handleInstallClick: () => void;
}

const Navbar: React.FC<Props> = ({
  settings,
  activeTheme,
  tourStep,
  setTourStep,
  onOpenTutorialSelection,
  setIsSettingsModalOpen,
  handleExport,
  setIsLoggedIn,
  deferredPrompt,
  handleInstallClick
}) => {
  return (
    <nav 
      className="sticky top-0 flex justify-between items-center glass border-b border-slate-800/30 z-40 transition-all duration-500"
      style={{ 
        paddingLeft: 'var(--app-padding)', 
        paddingRight: 'var(--app-padding)',
        paddingTop: 'calc(1rem + env(safe-area-inset-top))',
        paddingBottom: '1rem'
      }}
    >
      <div className="flex items-center gap-3">
        <Zap className={`w-6 h-6 ${activeTheme.text}`} />
        <h1 className="font-bold text-xl tracking-tight hidden sm:block">{settings.userName}</h1>
        <h1 className="font-bold text-xl tracking-tight sm:hidden">{settings.userName.split(' ')[0]}</h1>
      </div>
      <div className="flex items-center gap-4">
        
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick} 
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`p-2 text-[10px] font-black uppercase tracking-widest ${activeTheme.border} border rounded-lg hover:bg-white/5 transition-all flex items-center justify-center ${activeTheme.text}`}>
              <MonitorDown className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Install</span>
          </button>
        )}

        <button 
          id="tour-settings"
          onClick={() => setIsSettingsModalOpen(true)} 
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`p-2 text-slate-400 hover:${activeTheme.text} transition-all hover:bg-slate-800/50 rounded-lg`}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Setting</span>
        </button>
        
        <div className="h-8 w-px bg-slate-800/50 mx-1"></div>

        <button 
          onClick={onOpenTutorialSelection} 
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-2 text-slate-400 hover:text-blue-400 transition-all hover:bg-slate-800/50 rounded-lg">
            <HelpCircle className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Tutorial</span>
        </button>

        <button 
          id="tour-backup"
          onClick={handleExport} 
          className="flex flex-col items-center gap-1 group"
          title="Save Backup to Device"
        >
          <div className={`p-2 text-slate-400 hover:${activeTheme.text} transition-all hover:bg-slate-800/50 rounded-lg`}>
            <Download className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Backup</span>
        </button>

        <button 
          onClick={() => setIsLoggedIn(false)} 
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-slate-800/50 rounded-lg">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Back</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
