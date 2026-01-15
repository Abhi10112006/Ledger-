
import React, { useState } from 'react';
import { Zap, MonitorDown, Settings, HelpCircle, Download, LogOut, AlertTriangle, Menu, X, Type, Pencil, Save } from 'lucide-react';
import { AppSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { resetDB } from '../utils/db';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

interface Props {
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
  setTourStep: (step: number) => void;
  onOpenTutorialSelection: () => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  handleExport: () => void;
  onLogout: () => void;
  deferredPrompt: any;
  handleInstallClick: () => void;
  onOpenTypographyModal: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  updateSetting: (key: keyof AppSettings, value: any) => void;
}

const Navbar: React.FC<Props> = ({
  settings,
  activeTheme,
  tourStep,
  setTourStep,
  onOpenTutorialSelection,
  setIsSettingsModalOpen,
  handleExport,
  onLogout,
  deferredPrompt,
  handleInstallClick,
  onOpenTypographyModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  updateSetting
}) => {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.userName);
  
  const kbName = useVirtualKeyboard('text', setTempName);

  const handleFactoryReset = async () => {
    await resetDB();
    localStorage.clear();
    window.location.reload();
  };

  const saveName = () => {
      if(tempName.trim()) {
          updateSetting('userName', tempName);
      }
      setIsEditingName(false);
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
    <motion.button
      id={id}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-colors ${danger ? 'hover:bg-rose-950/30' : 'hover:bg-slate-800/50'} w-full md:w-auto`}
      title={label}
    >
      <Icon className={`w-6 h-6 ${color || 'text-slate-400'} ${danger ? 'group-hover:text-rose-500' : `group-hover:${activeTheme.text}`}`} />
      <span className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 hidden md:block ${danger ? 'text-rose-500' : 'text-slate-400'}`}>
        {label}
      </span>
    </motion.button>
  );

  // Animation Variants
  const menuVariants = {
    closed: { x: "100%", opacity: 0 },
    open: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.07, delayChildren: 0.2 }
    },
    exit: { 
      x: "100%", 
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.05, staggerDirection: -1 }
    }
  };

  const itemVariants = {
    closed: { x: 20, opacity: 0 },
    open: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  };

  return (
    <>
      {/* --- MOBILE TOP HEADER WITH HAMBURGER --- */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-slate-800/50 z-40 flex items-center justify-between px-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button 
            onClick={() => { setTempName(settings.userName); setIsEditingName(true); }}
            className="flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className={`p-2 rounded-xl bg-slate-900/50 border border-slate-800 ${activeTheme.text}`}>
             <Zap className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
             <h1 className="font-bold text-lg tracking-tight text-slate-200">{settings.userName}</h1>
             <div className="p-1 rounded-full bg-slate-800/50 text-slate-500">
                <Pencil className="w-3 h-3" />
             </div>
          </div>
        </button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-800/50"
        >
           <Menu className="w-6 h-6" />
        </motion.button>
      </header>

      {/* --- MOBILE FULL SCREEN MENU OVERLAY --- */}
      <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div 
          initial="closed"
          animate="open"
          exit="exit"
          variants={menuVariants}
          className="md:hidden fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col"
        >
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <Zap className={`w-6 h-6 ${activeTheme.text}`} />
                    <span className="font-bold text-xl text-white">Menu</span>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-slate-800 text-slate-400"
                >
                   <X className="w-6 h-6" />
                </motion.button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
               {deferredPrompt && (
                 <motion.button variants={itemVariants} onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }} className={`p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 ${activeTheme.text}`}>
                    <MonitorDown className="w-8 h-8" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Install App</span>
                 </motion.button>
               )}

               <motion.button variants={itemVariants} id="tour-settings" onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-slate-400 hover:bg-slate-800 transition-colors">
                  <Settings className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Settings</span>
               </motion.button>

               <motion.button variants={itemVariants} id="tour-typography" onClick={() => { onOpenTypographyModal(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-indigo-400 hover:bg-slate-800 transition-colors">
                  <Type className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Fonts</span>
               </motion.button>

               <motion.button variants={itemVariants} onClick={() => { onOpenTutorialSelection(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-blue-400 hover:bg-slate-800 transition-colors">
                  <HelpCircle className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Help</span>
               </motion.button>

               <motion.button variants={itemVariants} id="tour-backup" onClick={() => { handleExport(); setIsMobileMenuOpen(false); }} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-3 text-amber-400 hover:bg-slate-800 transition-colors">
                  <Download className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Save Backup</span>
               </motion.button>

               <motion.button variants={itemVariants} onClick={() => { setIsMobileMenuOpen(false); setShowResetConfirm(true); }} className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex flex-col items-center gap-3 text-rose-500 hover:bg-rose-900/30 transition-colors col-span-2">
                  <AlertTriangle className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Reset App</span>
               </motion.button>

               <motion.button variants={itemVariants} onClick={onLogout} className="mt-8 p-4 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest col-span-2">
                   <LogOut className="w-5 h-5" /> Log Out
               </motion.button>
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* --- DESKTOP LEFT NAVIGATION RAIL --- */}
      <nav className={`
        hidden md:flex fixed z-50 glass border-slate-800/50 transition-all duration-500
        top-0 left-0 h-screen w-24 border-r py-6 flex-col justify-between
      `}>
        
        {/* Desktop Logo Area & User Name */}
        <div className="flex flex-col items-center gap-3 mb-2 w-full px-1">
           <motion.button 
             onClick={() => { setTempName(settings.userName); setIsEditingName(true); }}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl ${activeTheme.text} relative group`}
           >
              <Zap className="w-7 h-7" />
              <div className={`absolute inset-0 ${activeTheme.bg} blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              
              {/* Edit Indicator */}
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-2.5 h-2.5" />
              </div>
           </motion.button>
           
           <button 
             onClick={() => { setTempName(settings.userName); setIsEditingName(true); }}
             className="text-center group w-full px-1"
           >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2 break-words leading-snug">
                {settings.userName}
              </p>
           </button>
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
           <motion.button 
             whileHover={{ x: 5 }}
             onClick={onLogout} 
             className="p-3 rounded-xl text-slate-600 hover:text-white hover:bg-slate-800 transition-all"
             title="Log Out"
           >
             <LogOut className="w-6 h-6" />
           </motion.button>
        </div>

      </nav>

      {/* --- RESET CONFIRMATION OVERLAY --- */}
      <AnimatePresence>
      {showResetConfirm && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setShowResetConfirm(false)}
             className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
           />
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="glass relative w-full max-w-sm rounded-[2.5rem] p-8 text-center border border-rose-500/30"
           >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-500/30">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">Delete Everything?</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                  This will delete all your friends and loans from this app. You cannot get it back.
              </p>
              <div className="space-y-3">
                 <motion.button 
                   whileTap={{ scale: 0.98 }}
                   onClick={handleFactoryReset} 
                   className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 uppercase tracking-widest text-xs"
                 >
                   Yes, Delete All
                 </motion.button>
                 <motion.button 
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setShowResetConfirm(false)} 
                   className="w-full py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs"
                 >
                   Cancel
                 </motion.button>
              </div>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* --- EDIT NAME MODAL --- */}
      <AnimatePresence>
        {isEditingName && (
            <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsEditingName(false)}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass w-full max-w-sm rounded-[2.5rem] p-6 relative z-10"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-white">Change Name</h2>
                        <button onClick={() => setIsEditingName(false)} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Your Name</label>
                            <input 
                                {...kbName}
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                                autoFocus
                            />
                        </div>
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={saveName}
                            className={`w-full py-4 ${activeTheme.bg} text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2`}
                        >
                            <Save className="w-4 h-4" /> Save
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
