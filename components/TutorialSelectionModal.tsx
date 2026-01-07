
import React from 'react';
import { X, PlayCircle, MousePointer2, MonitorPlay } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: () => void;
  onSelectInteractive: () => void;
  activeTheme: any;
}

const TutorialSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelectVideo, onSelectInteractive, activeTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="glass w-full max-w-md rounded-[2rem] p-6 animate-in zoom-in-95 duration-200 border border-white/5 relative overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative BG */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 ${activeTheme.bg} blur-[60px] opacity-20 pointer-events-none`}></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <MonitorPlay className={`w-5 h-5 ${activeTheme.text}`} />
            <h2 className="text-xl font-black text-white tracking-tight">TRAINING MODULE</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 relative z-10">
            {/* Video Option */}
            <button 
              onClick={onSelectVideo}
              className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all text-left overflow-hidden"
            >
              <div className={`absolute inset-0 ${activeTheme.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-slate-800 group-hover:${activeTheme.bg} transition-colors duration-300`}>
                   <PlayCircle className={`w-6 h-6 ${activeTheme.text} group-hover:text-slate-950`} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-100 group-hover:text-white mb-1">Visual Feed</h3>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed">Watch a high-speed system overview video.</p>
                </div>
              </div>
            </button>

            {/* Interactive Option */}
            <button 
              onClick={onSelectInteractive}
              className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all text-left overflow-hidden"
            >
              <div className={`absolute inset-0 ${activeTheme.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-slate-800 group-hover:${activeTheme.bg} transition-colors duration-300`}>
                   <MousePointer2 className={`w-6 h-6 ${activeTheme.text} group-hover:text-slate-950`} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-100 group-hover:text-white mb-1">Neural Link</h3>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed">Initiate the interactive step-by-step guided tour.</p>
                </div>
              </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialSelectionModal;
