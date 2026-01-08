
import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Type, Palette, Layout, CheckCircle2, Sliders, Smartphone, Eye, Grid, Terminal, Mail, Copy, Cpu, Code } from 'lucide-react';
import { AppSettings, ThemeColor, FontStyle, Density, CornerRadius, BaseColor } from '../types';

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
  
  // Developer Tab State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isCopied, setIsCopied] = useState(false);
  const [displayName, setDisplayName] = useState('ABHINAV YADUVANSHI');

  // Auto-switch tab during tour (Indices shifted due to Search step)
  useEffect(() => {
    if (tourStep && tourStep >= 9 && tourStep <= 11) {
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

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Identity', icon: <Settings className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Engine', icon: <Eye className="w-4 h-4" /> },
    { id: 'interface', label: 'Interface Tuner', icon: <Sliders className="w-4 h-4" /> },
    { id: 'contact', label: 'Developer', icon: <Terminal className="w-4 h-4" /> },
  ];

  // 3D Card Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max rotation degrees
    const max = 15;
    
    setTilt({
      x: ((x - centerX) / centerX) * max,
      y: ((y - centerY) / centerY) * -max 
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('abhiyaduvanshi@zohomail.in');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="glass w-full max-w-2xl rounded-[2rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderRadius: 'var(--app-radius)' }}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 shrink-0">
          <h2 className="text-xl font-black flex items-center gap-3"><Settings className={`${activeTheme.text} w-5 h-5`} /> System Config</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-slate-800 overflow-x-auto shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={tab.id === 'visual' ? 'tour-visual-tab' : undefined}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? `${activeTheme.border} ${activeTheme.text} bg-slate-900` : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* Identity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Type className="w-3 h-3" /> Ledger Identity
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">Owner Alias</label>
                    <input 
                      type="text" 
                      value={settings.userName}
                      onChange={(e) => updateSetting('userName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">Unit of Account</label>
                    <div className="flex gap-2">
                      {currencies.map(c => (
                        <button
                          key={c}
                          onClick={() => updateSetting('currency', c)}
                          className={`w-10 h-10 rounded-lg font-mono font-bold flex items-center justify-center transition-all ${settings.currency === c ? `${activeTheme.bg} text-slate-950` : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Palette className="w-3 h-3" /> System Accent
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(themes) as ThemeColor[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSetting('themeColor', t)}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all border-2 ${settings.themeColor === t ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                      style={{ backgroundColor: themes[t].hex }}
                      title={themes[t].name}
                    >
                      {settings.themeColor === t && <CheckCircle2 className="w-5 h-5 text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISUAL ENGINE TAB */}
          {activeTab === 'visual' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* Background Base */}
              <div className="space-y-4" id="tour-visual-base">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Layout className="w-3 h-3" /> Base Atmosphere
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => updateSetting('baseColor', 'slate')}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.baseColor === 'slate' ? `${activeTheme.border} bg-slate-800/50` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                  >
                    <div className="font-bold text-sm">Deep Slate</div>
                    <div className="text-[10px] text-slate-500">Soft, professional dark mode</div>
                  </button>
                  <button 
                    onClick={() => updateSetting('baseColor', 'oled')}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.baseColor === 'oled' ? `${activeTheme.border} bg-black` : 'border-slate-800 bg-slate-950 hover:bg-black'}`}
                  >
                    <div className="font-bold text-sm">OLED Black</div>
                    <div className="text-[10px] text-slate-500">Pure #000000. Battery saver.</div>
                  </button>
                </div>
              </div>

               {/* Background Texture */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Grid className="w-3 h-3" /> Texture Overlay
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {['solid', 'nebula', 'grid'].map((bg) => (
                      <button 
                        key={bg}
                        onClick={() => updateSetting('background', bg)}
                        className={`p-3 rounded-xl border transition-all text-center capitalize text-xs font-bold ${settings.background === bg ? `${activeTheme.bg} text-slate-950` : 'border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {bg}
                      </button>
                   ))}
                </div>
              </div>

              {/* Glass Material Tuner */}
              <div className="space-y-6 p-5 rounded-2xl bg-slate-900/30 border border-slate-800" id="tour-visual-glass">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <Eye className="w-3 h-3" /> Glass Material
                    </div>
                    <div className="flex items-center gap-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Film Grain</label>
                       <button 
                         onClick={() => updateSetting('enableGrain', !settings.enableGrain)}
                         className={`w-10 h-5 rounded-full relative transition-colors ${settings.enableGrain ? activeTheme.bg : 'bg-slate-700'}`}
                       >
                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.enableGrain ? 'left-6' : 'left-1'}`}></div>
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
                         className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
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
                         className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
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
                         className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                       />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* INTERFACE TUNER TAB */}
          {activeTab === 'interface' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               
               {/* Density */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Layout className="w-3 h-3" /> Layout Density
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => updateSetting('density', 'comfortable')}
                      className={`p-4 rounded-xl border text-left transition-all ${settings.density === 'comfortable' ? `${activeTheme.border} bg-slate-800/50` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                    >
                      <div className="font-bold text-sm mb-1">Comfortable</div>
                      <div className="w-full h-2 bg-slate-700 rounded-full mb-2"></div>
                      <div className="w-2/3 h-2 bg-slate-700 rounded-full"></div>
                    </button>
                    <button 
                      onClick={() => updateSetting('density', 'compact')}
                      className={`p-4 rounded-xl border text-left transition-all ${settings.density === 'compact' ? `${activeTheme.border} bg-slate-800/50` : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/30'}`}
                    >
                      <div className="font-bold text-sm mb-1">Information Dense</div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full mb-1.5"></div>
                      <div className="w-2/3 h-1.5 bg-slate-700 rounded-full"></div>
                    </button>
                  </div>
               </div>

               {/* Corner Radius */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Smartphone className="w-3 h-3" /> Geometry
                  </div>
                  <div className="flex gap-4">
                     {(['sharp', 'round', 'pill'] as CornerRadius[]).map(r => (
                        <button
                          key={r}
                          onClick={() => updateSetting('cornerRadius', r)}
                          className={`flex-1 h-16 border transition-all ${settings.cornerRadius === r ? `${activeTheme.bg} text-slate-950 border-transparent` : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                          style={{ 
                              borderRadius: r === 'sharp' ? '0px' : r === 'round' ? '8px' : '24px' 
                          }}
                        >
                          <span className="text-xs font-bold uppercase">{r}</span>
                        </button>
                     ))}
                  </div>
               </div>

                {/* Typography */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Type className="w-3 h-3" /> Typography
                  </div>
                  <div className="flex flex-col gap-2">
                     <button
                        onClick={() => updateSetting('fontStyle', 'mono')}
                        className={`p-3 px-4 rounded-xl border flex justify-between items-center transition-all ${settings.fontStyle === 'mono' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                     >
                       <span className="font-mono text-sm">Tech Mono (JetBrains)</span>
                       {settings.fontStyle === 'mono' && <CheckCircle2 className={`w-4 h-4 ${activeTheme.text}`} />}
                     </button>
                     <button
                        onClick={() => updateSetting('fontStyle', 'sans')}
                        className={`p-3 px-4 rounded-xl border flex justify-between items-center transition-all ${settings.fontStyle === 'sans' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                     >
                       <span className="font-sans text-sm">Modern Sans (Inter)</span>
                       {settings.fontStyle === 'sans' && <CheckCircle2 className={`w-4 h-4 ${activeTheme.text}`} />}
                     </button>
                     <button
                        onClick={() => updateSetting('fontStyle', 'system')}
                        className={`p-3 px-4 rounded-xl border flex justify-between items-center transition-all ${settings.fontStyle === 'system' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                     >
                       <span className="font-sans text-sm" style={{fontFamily: 'system-ui'}}>System Native</span>
                       {settings.fontStyle === 'system' && <CheckCircle2 className={`w-4 h-4 ${activeTheme.text}`} />}
                     </button>
                  </div>
               </div>

             </div>
          )}
          
          {/* DEVELOPER CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-in slide-in-from-right-4 duration-500 perspective-1000">
                
                {/* 3D Interactive Card */}
                <div 
                  className="relative group w-full max-w-sm cursor-default"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ perspective: '1000px' }}
                >
                  <div 
                     className="relative w-full aspect-[1.58/1] rounded-2xl bg-slate-950 border border-slate-700/50 shadow-2xl transition-transform duration-100 ease-out overflow-hidden"
                     style={{ 
                       transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                       transformStyle: 'preserve-3d',
                       boxShadow: `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 0 1px ${activeTheme.hex}30`
                     }}
                  >
                     {/* Dynamic Backgrounds */}
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 z-0"></div>
                     <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,${activeTheme.hex},transparent_70%)] group-hover:opacity-30 transition-opacity duration-500`}></div>
                     <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[size:100%_4px] pointer-events-none opacity-10"></div>

                     {/* Content Layer (Floating) */}
                     <div className="absolute inset-0 p-6 flex flex-col justify-between z-10" style={{ transform: 'translateZ(30px)' }}>
                        
                        {/* Header */}
                        <div className="flex justify-between items-start">
                           <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 ${activeTheme.text}`}>
                              <Code className="w-6 h-6" />
                           </div>
                           <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-right leading-tight">
                              ID: DEV_001<br/>
                              LOC: GRID_NODE_7<br/>
                              <span className={activeTheme.text}>STATUS: ONLINE</span>
                           </div>
                        </div>

                        {/* Identity Block */}
                        <div className="space-y-2 mt-2">
                           <div className="flex items-center gap-2">
                              <span className={`h-px w-8 ${activeTheme.bg}`}></span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Architect</span>
                           </div>
                           <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words" style={{ textShadow: `0 0 20px ${activeTheme.hex}40` }}>
                              {displayName}
                           </h3>
                        </div>

                        {/* Footer / Contact Action */}
                        <div className="flex items-center gap-3 mt-2">
                           <button 
                              onClick={copyEmail}
                              className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 transition-all group/btn"
                              title="Copy Email Address"
                           >
                              <div className="flex items-center gap-3 overflow-hidden">
                                 <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                 <span className="text-[10px] sm:text-xs font-mono text-slate-300 truncate">abhiyaduvanshi@zohomail.in</span>
                              </div>
                              {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Copy className="w-4 h-4 text-slate-500 group-hover/btn:text-white shrink-0" />}
                           </button>
                        </div>
                     </div>
                     
                     {/* Holographic Border Shine */}
                     <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none"></div>
                     {/* Corner Accents */}
                     <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${activeTheme.border} rounded-tl-2xl opacity-50`}></div>
                     <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${activeTheme.border} rounded-br-2xl opacity-50`}></div>
                  </div>
                </div>

                <div className="mt-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                   <p className="text-xs text-slate-500 font-mono">
                      &lt; SPONSORSHIP_CHANNELS_OPEN /&gt;
                   </p>
                   <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                      Interested in sponsoring this project or hiring the architect? Direct channels are now open.
                   </p>
                   <a 
                      href="mailto:abhiyaduvanshi@zohomail.in?subject=Sponsorship%20Inquiry%20:%20Abhi's%20Ledger" 
                      className={`inline-block mt-4 text-xs font-bold ${activeTheme.text} hover:underline uppercase tracking-widest decoration-2 underline-offset-4 cursor-pointer`}
                   >
                      Initiate Direct Transmission
                   </a>
                </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
