
import React, { useState, useEffect } from 'react';
import { Settings, X, Type, Palette, Layout, CheckCircle2, Sliders, Smartphone, Eye, Grid, Terminal, Mail, Copy, Code, Sparkles } from 'lucide-react';
import { AppSettings, ThemeColor, CornerRadius } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  activeTheme: any;
  themes: Record<string, any>;
  currencies: string[];
  tourStep?: number;
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  updateSetting,
  activeTheme,
  themes,
  currencies,
  tourStep
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'visual' | 'interface' | 'contact'>('general');
  const [displayName, setDisplayName] = useState('ABHINAV YADUVANSHI');

  // Auto-switch tab during tour
  useEffect(() => {
    if (tourStep && tourStep >= 6 && tourStep <= 8) {
      setActiveTab('visual');
    }
  }, [tourStep]);
  
  // Scramble Effect
  useEffect(() => {
    if (activeTab === 'contact') {
      const target = 'ABHINAV YADUVANSHI';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
      let iteration = 0;
      
      const interval = setInterval(() => {
        setDisplayName(
          target.split('').map((letter, index) => {
            if (index < iteration) return target[index];
            if (letter === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        
        if (iteration >= target.length) clearInterval(interval);
        iteration += 1 / 2;
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'general', label: 'My Name', icon: <Settings className="w-4 h-4" /> },
    { id: 'visual', label: 'Look & Feel', icon: <Eye className="w-4 h-4" /> },
    { id: 'interface', label: 'Layout', icon: <Sliders className="w-4 h-4" /> },
    { id: 'contact', label: 'Credits', icon: <Terminal className="w-4 h-4" /> },
  ];

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
  };

  const tabContentVariants = {
    initial: { opacity: 0, x: 20, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="glass w-full max-w-2xl rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] relative z-10"
          style={{ borderRadius: 'var(--app-radius)' }}
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 shrink-0">
            <h2 className="text-xl font-black flex items-center gap-3"><Settings className={`${activeTheme.text} w-5 h-5`} /> Settings</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex border-b border-slate-800 overflow-x-auto shrink-0 px-2 pt-2 bg-slate-900/30">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={tab.id === 'visual' ? 'tour-visual-tab' : undefined}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors z-10 ${activeTab === tab.id ? activeTheme.text : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab.icon} {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 border-b-2 ${activeTheme.border} bg-slate-800/50 rounded-t-lg -z-10`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-6 space-y-8 overflow-y-auto min-h-[300px] scrollbar-hide">
            <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Type className="w-3 h-3" /> My Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">My Name</label>
                      <input 
                        type="text" 
                        value={settings.userName}
                        onChange={(e) => updateSetting('userName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                      />
                    </div>
                     <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Currency Symbol</label>
                      <div className="flex gap-2">
                        {currencies.map(c => (
                          <button
                            key={c}
                            onClick={() => updateSetting('currency', c)}
                            className={`w-10 h-10 rounded-lg font-mono font-bold flex items-center justify-center transition-all ${settings.currency === c ? `${activeTheme.bg} text-slate-950 scale-110 shadow-lg` : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Palette className="w-3 h-3" /> App Color
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {(Object.keys(themes) as ThemeColor[]).map((t) => (
                      <motion.button
                        key={t}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateSetting('themeColor', t)}
                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all border-2 ${settings.themeColor === t ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: themes[t].hex }}
                        title={themes[t].name}
                      >
                        {settings.themeColor === t && <CheckCircle2 className="w-5 h-5 text-slate-950 animate-in zoom-in duration-300" />}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* VISUAL ENGINE TAB */}
            {activeTab === 'visual' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                {/* Background Base */}
                <motion.div variants={itemVariants} className="space-y-4" id="tour-visual-base">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Layout className="w-3 h-3" /> Background Style
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => updateSetting('baseColor', 'slate')}
                      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${settings.baseColor === 'slate' ? `${activeTheme.border} bg-slate-800/50 shadow-lg` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                    >
                      <div className="font-bold text-sm">Dark Grey</div>
                      <div className="text-[10px] text-slate-500">Soft and professional.</div>
                    </button>
                    <button 
                      onClick={() => updateSetting('baseColor', 'oled')}
                      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${settings.baseColor === 'oled' ? `${activeTheme.border} bg-black shadow-lg` : 'border-slate-800 bg-slate-950 hover:bg-black'}`}
                    >
                      <div className="font-bold text-sm">Pitch Black</div>
                      <div className="text-[10px] text-slate-500">Pure black background.</div>
                    </button>
                  </div>
                </motion.div>

                 {/* Background Texture */}
                <motion.div variants={itemVariants} className="space-y-4">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Grid className="w-3 h-3" /> Texture
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {['solid', 'nebula', 'grid'].map((bg) => (
                        <button 
                          key={bg}
                          onClick={() => updateSetting('background', bg)}
                          className={`p-3 rounded-xl border transition-all text-center capitalize text-xs font-bold hover:scale-105 active:scale-95 ${settings.background === bg ? `${activeTheme.bg} text-slate-950 shadow-lg` : 'border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                        >
                          {bg}
                        </button>
                     ))}
                  </div>
                </motion.div>

                {/* Glass Material Tuner */}
                <motion.div variants={itemVariants} className="space-y-6 p-5 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md" id="tour-visual-glass">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <Eye className="w-3 h-3" /> Effects
                      </div>
                      <div className="flex items-center gap-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Film Grain</label>
                         <button 
                           onClick={() => updateSetting('enableGrain', !settings.enableGrain)}
                           className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${settings.enableGrain ? activeTheme.bg : 'bg-slate-700'}`}
                         >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${settings.enableGrain ? 'left-6' : 'left-1'}`}></div>
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Blur Strength</span>
                            <span>{settings.glassBlur}px</span>
                         </div>
                         <input 
                           type="range" min="0" max="40" step="2"
                           value={settings.glassBlur}
                           onChange={(e) => updateSetting('glassBlur', parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-slate-200 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Transparency</span>
                            <span>{Math.round(settings.glassOpacity * 100)}%</span>
                         </div>
                         <input 
                           type="range" min="0.2" max="0.95" step="0.05"
                           value={settings.glassOpacity}
                           onChange={(e) => updateSetting('glassOpacity', parseFloat(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-slate-200 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>System Glow</span>
                            <span>{Math.round(settings.glowIntensity * 100)}%</span>
                         </div>
                         <input 
                           type="range" min="0" max="1" step="0.1"
                           value={settings.glowIntensity}
                           onChange={(e) => updateSetting('glowIntensity', parseFloat(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-slate-200 transition-all"
                         />
                      </div>
                   </div>
                </motion.div>
              </motion.div>
            )}

            {/* INTERFACE TUNER TAB */}
            {activeTab === 'interface' && (
               <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                 
                 {/* Density */}
                 <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <Layout className="w-3 h-3" /> Screen Spacing
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => updateSetting('density', 'comfortable')}
                        className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${settings.density === 'comfortable' ? `${activeTheme.border} bg-slate-800/50 shadow-lg` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                      >
                        <div className="font-bold text-sm mb-1">Comfortable</div>
                        <div className="w-full h-2 bg-slate-700 rounded-full mb-2"></div>
                        <div className="w-2/3 h-2 bg-slate-700 rounded-full"></div>
                      </button>
                      <button 
                        onClick={() => updateSetting('density', 'compact')}
                        className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${settings.density === 'compact' ? `${activeTheme.border} bg-slate-800/50 shadow-lg` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                      >
                        <div className="font-bold text-sm mb-1">Compact</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full mb-1.5"></div>
                        <div className="w-2/3 h-1.5 bg-slate-700 rounded-full"></div>
                      </button>
                    </div>
                 </motion.div>

                 {/* Corner Radius */}
                 <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <Smartphone className="w-3 h-3" /> Button Shape
                    </div>
                    <div className="flex gap-4">
                       {(['sharp', 'round', 'pill'] as CornerRadius[]).map(r => (
                          <button
                            key={r}
                            onClick={() => updateSetting('cornerRadius', r)}
                            className={`flex-1 h-16 border transition-all hover:scale-105 active:scale-95 ${settings.cornerRadius === r ? `${activeTheme.bg} text-slate-950 border-transparent shadow-lg` : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                            style={{ 
                                borderRadius: r === 'sharp' ? '0px' : r === 'round' ? '8px' : '24px' 
                            }}
                          >
                            <span className="text-xs font-bold uppercase">{r}</span>
                          </button>
                       ))}
                    </div>
                 </motion.div>

               </motion.div>
            )}
            
            {/* DEVELOPER CONTACT TAB */}
            {activeTab === 'contact' && (
              <div className="flex flex-col items-center justify-center min-h-[400px] perspective-1000">
                  
                  {/* 3D Interactive Card with Floating & Scan Effects */}
                  <motion.div 
                    initial={{ rotateX: 10, opacity: 0, y: 50 }}
                    animate={{ 
                        rotateX: [5, 10, 5], 
                        rotateY: [-5, 5, -5],
                        y: [0, -15, 0],
                        opacity: 1
                    }}
                    transition={{ 
                        rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5 }
                    }}
                    className="relative group w-full max-w-sm cursor-default preserve-3d"
                  >
                    {/* Floating Particles/Orbs behind */}
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute -top-10 -left-10 w-32 h-32 rounded-full ${activeTheme.bg} blur-[60px] opacity-20 -z-10`}
                    />
                     <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                        className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-slate-700 blur-[60px] opacity-20 -z-10`}
                    />

                    <div 
                       className="relative w-full aspect-[1.58/1] rounded-2xl bg-slate-950 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform-style-3d backdrop-blur-xl"
                    >
                       {/* Animated Scan Line */}
                       <motion.div
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-1/3 pointer-events-none z-20"
                            initial={{ top: '-100%' }}
                            animate={{ top: '200%' }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                       />

                       <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 z-0"></div>
                       <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,${activeTheme.hex},transparent_70%)] group-hover:opacity-30 transition-opacity duration-500`}></div>
                       
                       {/* Subtle Grid overlay */}
                       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0"></div>

                       <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                          <div className="flex justify-between items-start">
                             <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 ${activeTheme.text} shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                                <Code className="w-6 h-6" />
                             </div>
                             <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-right leading-tight">
                                <motion.span 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                >ID: DEV_001<br/></motion.span>
                                <motion.span 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                                >LOC: GRID_NODE_7<br/></motion.span>
                                <motion.span 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
                                    className={activeTheme.text}
                                >STATUS: ONLINE</motion.span>
                             </div>
                          </div>

                          <div className="space-y-2 mt-2">
                             <div className="flex items-center gap-2">
                                <span className={`h-px w-8 ${activeTheme.bg}`}></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Architect</span>
                             </div>
                             <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words drop-shadow-md">
                                {displayName}
                                <motion.span 
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className={`${activeTheme.text}`}
                                >_</motion.span>
                             </h3>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                             <button 
                                onClick={() => navigator.clipboard.writeText('abhiyaduvanshi@zohomail.in')}
                                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 transition-all group/btn hover:bg-slate-800"
                             >
                                <div className="flex items-center gap-3 overflow-hidden">
                                   <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                   <span className="text-[10px] sm:text-xs font-mono text-slate-300 truncate">abhiyaduvanshi@zohomail.in</span>
                                </div>
                                <Copy className="w-4 h-4 text-slate-500 group-hover/btn:text-white shrink-0" />
                             </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 text-center space-y-2 relative"
                  >
                     <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                        <span>&lt;</span>
                        <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: "auto" }}
                            transition={{ duration: 2, delay: 1, ease: "steps(20)" }}
                            className="overflow-hidden whitespace-nowrap inline-block align-bottom"
                        >
                            SYSTEM_HQ_ONLINE
                        </motion.span>
                        <span>/&gt;</span>
                     </p>
                     <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                        For bug reports, feature requests, and sponsorship protocols, establish connection with the mainframe.
                     </p>
                     
                     <div className="pt-4">
                        <a 
                            href="https://abhis-ledger.vercel.app/" 
                             target="_blank" rel="noopener noreferrer"
                            className={`relative inline-flex items-center justify-center px-6 py-3 text-xs font-bold ${activeTheme.text} uppercase tracking-widest border ${activeTheme.border} rounded-xl hover:bg-slate-900 transition-colors group overflow-hidden`}
                        >
                            <span className="relative z-10">Visit Official Frequency</span>
                            <div className={`absolute inset-0 ${activeTheme.bg} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                            <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                        </a>
                     </div>
                  </motion.div>

              </div>
            )}
            </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default SettingsModal;
