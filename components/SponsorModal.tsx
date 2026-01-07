
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Zap } from 'lucide-react';
import { AdContent, SPONSORED_CONTENT } from '../data/sponsoredContent';
import { getYoutubeId } from '../utils/common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: any;
}

const SponsorModal: React.FC<Props> = ({ isOpen, onClose, activeTheme }) => {
  const [ad, setAd] = useState<AdContent | null>(null);

  useEffect(() => {
    // 1. Find the first active ad
    const activeAd = SPONSORED_CONTENT.find(a => a.isActive);
    if (activeAd) {
      setAd(activeAd);
    }
  }, []);

  if (!isOpen || !ad) return null;

  // --- AUTOMATIC MEDIA ANALYSIS ---
  // 1. Check if video exists
  // 2. Determine if it is YouTube or Direct File
  const youtubeId = ad.video ? getYoutubeId(ad.video) : null;
  const hasVideo = !!ad.video;
  const hasImage = !!ad.image && !hasVideo; // Video takes precedence

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
      {/* Backdrop (Click to close) */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in pointer-events-auto"
        onClick={onClose}
      ></div>

      {/* Ad Card */}
      <div 
        className={`pointer-events-auto w-full max-w-lg glass border ${activeTheme.border} shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden relative animate-in zoom-in-95 duration-300`}
      >
        {/* Glow Effect */}
        <div className={`absolute -top-32 -right-32 w-64 h-64 ${activeTheme.bg} opacity-20 blur-[80px] pointer-events-none`}></div>

        {/* Header / "Sponsored" Badge */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Zap className="w-3.5 h-3.5 fill-slate-400" /> Sponsored
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pt-6">
            
            {/* --- DYNAMIC MEDIA RENDERING ENGINE --- */}
            {hasVideo && (
              <div className="mb-6 rounded-2xl overflow-hidden aspect-video w-full bg-slate-950 border border-white/5 relative shadow-inner group">
                 {youtubeId ? (
                   /* YOUTUBE PLAYER */
                   <iframe 
                     width="100%" 
                     height="100%" 
                     src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&controls=0&loop=1&playlist=${youtubeId}`} 
                     title="Sponsored Content" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                     className="w-full h-full object-cover pointer-events-none" 
                   ></iframe>
                 ) : (
                   /* DIRECT HTML5 VIDEO PLAYER */
                   <>
                     <video 
                       src={ad.video} 
                       autoPlay 
                       muted 
                       loop 
                       playsInline 
                       className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                   </>
                 )}
              </div>
            )}

            {hasImage && (
              <div className="mb-6 rounded-2xl overflow-hidden h-48 w-full bg-slate-800 border border-white/5 relative shadow-inner">
                 <img src={ad.image} alt="Ad Visual" className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" />
              </div>
            )}

            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4 tracking-tight">
              {ad.title}
            </h3>
            
            <p className="text-base text-slate-300 font-medium leading-relaxed mb-8">
              {ad.message}
            </p>

            <a 
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={`flex items-center justify-center gap-3 w-full py-5 rounded-2xl ${activeTheme.bg} text-slate-950 font-black uppercase tracking-widest text-sm shadow-xl hover:brightness-110 active:scale-[0.98] transition-all group`}
            >
              {ad.buttonText} <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <div className="mt-5 flex justify-center">
                 <button onClick={onClose} className="text-[11px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-wider p-2">
                    Dismiss Transmission
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorModal;
