import React from 'react';
import { X, Type, CheckCircle2 } from 'lucide-react';
import { FontStyle } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFont: FontStyle;
  onSelect: (font: FontStyle) => void;
  activeTheme: any;
}

const TypographyModal: React.FC<Props> = ({ isOpen, onClose, currentFont, onSelect, activeTheme }) => {
  if (!isOpen) return null;

  const fonts: { id: FontStyle; label: string; familyClass: string }[] = [
    { id: 'mono', label: 'Tech Mono (JetBrains)', familyClass: 'font-mono' },
    { id: 'sans', label: 'Modern Sans (Inter)', familyClass: 'font-sans' },
    { id: 'system', label: 'System Native', familyClass: 'font-sans' },
    { id: 'serif', label: 'Typewriter (Elite)', familyClass: 'font-serif-app' },
    { id: 'comic', label: 'Comic Sans (Casual)', familyClass: 'font-comic-app' },
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-[2.5rem] p-6 animate-in zoom-in-95 duration-200 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-slate-800 ${activeTheme.text}`}>
                <Type className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-black text-white">Typography</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto grid grid-cols-1 gap-3 pr-2 scrollbar-hide">
          {fonts.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                onSelect(font.id);
                onClose();
              }}
              className={`p-4 rounded-xl border flex justify-between items-center transition-all active:scale-[0.98] ${
                currentFont === font.id
                  ? `${activeTheme.bg} text-slate-950 border-transparent shadow-lg`
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                 <span className={`text-sm ${font.id === 'system' ? '' : font.familyClass}`} style={font.id === 'system' ? { fontFamily: 'system-ui' } : {}}>
                    {font.label}
                 </span>
              </div>
              {currentFont === font.id && <CheckCircle2 className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypographyModal;