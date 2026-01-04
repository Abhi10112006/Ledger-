
import React, { useState } from 'react';
import { Settings, X, Type, Palette, Layout, CheckCircle2, Sliders, Smartphone, Eye, Grid } from 'lucide-react';
import { AppSettings, ThemeColor, FontStyle, Density, CornerRadius, BaseColor } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  activeTheme: any;
  themes: Record<string, any>;
  currencies: string[];
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  updateSetting,
  activeTheme,
  themes,
  currencies
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'visual' | 'interface'>('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Identity', icon: <Settings className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Engine', icon: <Eye className="w-4 h-4" /> },
    { id: 'interface', label: 'Interface Tuner', icon: <Sliders className="w-4 h-4" /> },
  ];

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
              <div className="space-y-4">
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
              <div className="space-y-6 p-5 rounded-2xl bg-slate-900/30 border border-slate-800">
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

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
