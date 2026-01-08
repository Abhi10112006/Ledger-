
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
      className="sticky top-0 pb-4 flex justify-between items-center glass border-b border-slate-800/30 z-40 transition-all duration-500"
      style={{ 
        paddingLeft: 'var(--app-padding)', 
        paddingRight: 'var(--app-padding)',
        paddingTop: 'calc(1rem + env(safe-area-inset-top))' 
      }}
    >
      <div className="flex items-center gap-3">
        <Zap className={`w-6 h-6 ${activeTheme.text}`} />
        <h1 className="font-bold text-xl tracking-tight hidden sm:block">{settings.userName}</h1>
        <h1 className="font-bold text-xl tracking-tight sm:hidden">{settings.userName.split(' ')[0]}</h1>
      </div>
      <div className="flex items-center gap-3 relative">
        
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick} 
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${activeTheme.border} rounded-lg hover:bg-white/5 transition-all flex items-center gap-2 ${activeTheme.text}`}
          >
            <MonitorDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Install</span>
          </button>
        )}

        <button 
          id="tour-settings"
          onClick={() => setIsSettingsModalOpen(true)} 
          className={`p-2 text-slate-400 hover:${activeTheme.text} transition-all hover:bg-slate-800/50 rounded-lg`}
        >
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <button 
          onClick={onOpenTutorialSelection} 
          className="p-2 text-slate-400 hover:text-blue-400 transition-all hover:bg-slate-800/50 rounded-lg"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button 
          id="tour-backup"
          onClick={handleExport} 
          className={`p-2 text-slate-400 hover:${activeTheme.text} transition-all hover:bg-slate-800/50 rounded-lg`} 
          title="Save Backup to Device"
        >
          <Download className="w-5 h-5" />
        </button>
        <button onClick={() => setIsLoggedIn(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-slate-800/50 rounded-lg"><LogOut className="w-5 h-5" /></button>
      </div>
    </nav>
  );
};

export default Navbar;
