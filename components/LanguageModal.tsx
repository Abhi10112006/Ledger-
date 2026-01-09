
import React from 'react';
import { X, Globe } from 'lucide-react';
import { LANGUAGES } from '../utils/languages';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (code: string) => void;
  activeTheme: any;
}

const LanguageModal: React.FC<Props> = ({ isOpen, onClose, currentLanguage, onSelect, activeTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-[2.5rem] p-6 animate-in zoom-in-95 duration-200 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-slate-800 ${activeTheme.text}`}>
                <Globe className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-black text-white">Select Language</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2 scrollbar-hide">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code);
                onClose();
              }}
              className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                currentLanguage === lang.code
                  ? `${activeTheme.bg} text-slate-950 border-transparent shadow-lg`
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                 <span className="font-bold text-sm">{lang.native}</span>
                 {currentLanguage === lang.code && <div className="w-2 h-2 rounded-full bg-slate-950"></div>}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold ${currentLanguage === lang.code ? 'text-slate-800/70' : 'text-slate-600'}`}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
