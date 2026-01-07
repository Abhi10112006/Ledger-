
import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VideoTutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // --- MOCK UP VIDEO CONFIGURATION ---
  const MOCK_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

  // --- YOUTUBE CONFIGURATION (HIDDEN / FUTURE USE) ---
  // const VIDEO_ID = "g_hZm2b8ZO0"; 

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <div className="w-full max-w-4xl relative animate-in zoom-in-95 duration-300 flex flex-col items-center">
          <button 
            onClick={onClose} 
            className="absolute -top-12 right-0 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors p-2"
          >
             Close Feed <X className="w-5 h-5" />
          </button>
          
          <div className="aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
             
             {/* --- ACTIVE MOCK UP VIDEO --- */}
             <video 
               src={MOCK_VIDEO_URL}
               controls
               autoPlay 
               muted 
               loop 
               playsInline 
               className="w-full h-full object-cover"
             />

             {/* --- YOUTUBE EMBED (HIDDEN / FUTURE USE) --- */}
             {/* 
             <iframe 
               width="100%" 
               height="100%" 
               src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&controls=1`} 
               title="System Tutorial" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               allowFullScreen
               className="w-full h-full object-cover"
             ></iframe>
             */}
             
             {/* Simulation Badge */}
             <div className="absolute top-4 left-4 px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded backdrop-blur-sm pointer-events-none">
                System Calibration
             </div>
          </div>
          
          <div className="mt-6 text-center">
             <h3 className="text-2xl font-black text-white tracking-tight">System Capabilities Overview</h3>
             <p className="text-slate-500 mt-2 text-sm font-medium">Visual calibration data for new operators.</p>
          </div>
       </div>
    </div>
  );
};

export default VideoTutorialModal;
