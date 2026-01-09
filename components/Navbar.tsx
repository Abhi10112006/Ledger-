
import React, { useState } from 'react';
import { Zap, MonitorDown, Settings, HelpCircle, Download, LogOut, AlertTriangle, Menu, X, Type } from 'lucide-react';
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
  onOpenTypographyModal: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
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
  handleInstallClick,
  onOpenTypographyModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleFactoryReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    color,
    id,
    danger = false
  }: { 
    icon: any, 
    label: string, 
    onClick: () => void, 
    color?: string,
    id?: string,
    danger?: boolean
  }) => (
    <button
      id={id}
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${danger ? 'hover:bg-rose-950/30' : 'hover:bg-slate-800/50'} active:scale-95 w-full md:w-auto`}
      title={label}
    >
      <Icon className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${color || 'text-slate-400'} ${danger ? 'group-hover:text-rose-500' : `group-hover:${activeTheme.text}`}`} />
      <span className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 hidden md:block ${danger ? 'text-rose-500' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* --- MOBILE TOP HEADER WITH HAMBURGER --- */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-slate-800/50 z-40 flex items-center justify-between px-6 transition-all duration-500"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-slate-900/50 border border-slate-800 ${activeTheme.text}`}>
             <Zap className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-200">{settings.userName}</h1>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-800/50 active:scale-95 transition-all"
        >
           <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* --- MOBILE FULL SCREEN MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <Zap className={`w-6 h-6 ${activeTheme.text}`} />
                    <span className="font-bold text-xl text-white">Menu</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-slate-800 text-slate-400"
                >
                   <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
               {deferredPrompt && (
                 <button onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }} className={`p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 ${activeTheme.text}`}>
                    <MonitorDown className="w-8 h-8" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Install App</span>
                 </button>
               )}

               <button id="tour-settings" onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-slate-400 hover:bg-slate-800 transition-colors">
                  <Settings className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Settings</span>
               </button>

               <button id="tour-typography" onClick={() => { onOpenTypographyModal(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-indigo-400 hover:bg-slate-800 transition-colors">
                  <Type className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Fonts</span>
               </button>

               <button onClick={() => { onOpenTutorialSelection(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-blue-400 hover:bg-slate-800 transition-colors">
                  <HelpCircle className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Help</span>
               </button>

               <button id="tour-backup" onClick={() => { handleExport(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-amber-400 hover:bg-slate-800 transition-colors">
                  <Download className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Save Backup</span>
               </button>

               <button onClick={() => { setIsMobileMenuOpen(false); setShowResetConfirm(true); }} className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex flex-col items-center gap-3 text-rose-500 hover:bg-rose-900/30 transition-colors col-span-2">
                  <AlertTriangle className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Reset App</span>
               </button>

               <button onClick={() => setIsLoggedIn(false)} className="mt-8 p-4 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest col-span-2">
                   <LogOut className="w-5 h-5" /> Log Out
               </button>
            </div>
        </div>
      )}

      {/* --- DESKTOP LEFT NAVIGATION RAIL --- */}
      <nav className={`
        hidden md:flex fixed z-50 glass border-slate-800/50 transition-all duration-500
        top-0 left-0 h-screen w-24 border-r py-8 flex-col justify-between
      `}>
        
        {/* Desktop Logo Area */}
        <div className="flex flex-col items-center gap-4 mb-4">
           <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl ${activeTheme.text} relative group cursor-default`}>
              <Zap className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <div className={`absolute inset-0 ${activeTheme.bg} blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
           </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-4 w-full justify-start">
           
           {deferredPrompt && (
             <NavItem icon={MonitorDown} label="Install" onClick={handleInstallClick} color={activeTheme.text} />
           )}

           <NavItem 
             id="tour-settings"
             icon={Settings} 
             label="Settings" 
             onClick={() => setIsSettingsModalOpen(true)} 
           />
           
           <NavItem 
             id="tour-typography"
             icon={Type} 
             label="Fonts" 
             onClick={onOpenTypographyModal} 
             color="text-indigo-400"
           />

           <NavItem 
             icon={HelpCircle} 
             label="Help" 
             onClick={onOpenTutorialSelection} 
             color="text-blue-400"
           />

           <NavItem 
             id="tour-backup"
             icon={Download} 
             label="Backup" 
             onClick={handleExport} 
             color="text-amber-400"
           />

           <div className="w-px h-8 bg-slate-800 my-2"></div>

           <NavItem 
             icon={AlertTriangle} 
             label="Reset" 
             onClick={() => setShowResetConfirm(true)} 
             color="text-rose-500"
             danger
           />
        </div>

        {/* Desktop Footer Actions */}
        <div className="flex flex-col gap-4 items-center">
           <button 
             onClick={() => setIsLoggedIn(false)} 
             className="p-3 rounded-xl text-slate-600 hover:text-white hover:bg-slate-800 transition-all"
             title="Log Out"
           >
             <LogOut className="w-6 h-6" />
           </button>
        </div>

      </nav>

      {/* --- RESET CONFIRMATION OVERLAY --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-in zoom-in-90 duration-300 border border-rose-500/30">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-500/30">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">Delete Everything?</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                  This will delete all your friends and loans from this app. You cannot get it back.
              </p>
              <div className="space-y-3">
                 <button 
                   onClick={handleFactoryReset} 
                   className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform uppercase tracking-widest text-xs"
                 >
                   Yes, Delete All
                 </button>
                 <button 
                   onClick={() => setShowResetConfirm(false)} 
                   className="w-full py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-2xl font-black transition-colors uppercase tracking-widest text-xs"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
