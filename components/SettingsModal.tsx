
import React from 'react';
import { Settings, X, Type, Palette, Layout, CheckCircle2 } from 'lucide-react';
import { AppSettings, ThemeColor } from '../types';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-[2.5rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <h2 className="text-xl font-black flex items-center gap-3"><Settings className={`${activeTheme.text} w-5 h-5`} /> Personalization</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
          
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Type className="w-3 h-3" /> Identity
            </div>
            <div className="space-y-3">
              <label className="text-xs text-slate-400 font-medium">Ledger Name</label>
              <input 
                type="text" 
                value={settings.userName}
                onChange={(e) => updateSetting('userName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
              />
            </div>
             <div className="space-y-3">
              <label className="text-xs text-slate-400 font-medium">Global Currency</label>
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

          {/* Background Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Layout className="w-3 h-3" /> Visual Environment
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => updateSetting('background', 'solid')}
                className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'solid' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
              >
                <div className="w-full h-12 bg-slate-950 rounded-lg mb-2 border border-slate-700"></div>
                <div className="text-xs font-bold text-slate-200">Deep Space</div>
                <div className="text-[10px] text-slate-500">Minimalist Solid</div>
              </button>

              <button 
                onClick={() => updateSetting('background', 'nebula')}
                className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'nebula' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
              >
                <div className={`w-full h-12 rounded-lg mb-2 border border-slate-700 overflow-hidden relative`}>
                   <div className={`absolute top-0 left-0 w-full h-full bg-slate-950`}></div>
                   <div className={`absolute top-0 left-0 w-full h-full ${activeTheme.bg}/40 blur-xl`}></div>
                </div>
                <div className="text-xs font-bold text-slate-200">Nebula</div>
                <div className="text-[10px] text-slate-500">Ambient Gradient</div>
              </button>

              <button 
                onClick={() => updateSetting('background', 'grid')}
                className={`p-3 rounded-xl border transition-all text-left ${settings.background === 'grid' ? `${activeTheme.border} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
              >
                 <div className="w-full h-12 bg-[linear-gradient(to_right,#80808050_1px,transparent_1px),linear-gradient(to_bottom,#80808050_1px,transparent_1px)] bg-[size:10px_10px] bg-slate-950 rounded-lg mb-2 border border-slate-700"></div>
                <div className="text-xs font-bold text-slate-200">Cyber Grid</div>
                <div className="text-[10px] text-slate-500">Tech Pattern</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
