
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Zap, Clock } from 'lucide-react';
import { AdContent } from '../data/sponsoredContent';
import { getYoutubeId } from '../utils/common';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ad: AdContent | null;
  activeTheme: any;
  onBackup?: () => void;
}

const SponsorModal: React.FC<Props> = ({ isOpen, onClose, ad, activeTheme, onBackup }) => {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && ad) {
      setCanClose(false);
      setCountdown(5); // 5 Second forced view
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, ad]);

  if (!ad) return null;

  const youtubeId = ad.video ? getYoutubeId(ad.video) : null;
  const hasVideo = !!ad.video;
  const hasImage = !!ad.image && !hasVideo;

  return (
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl pointer-events-auto"
        />

        {/* Ad Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`pointer-events-auto w-full max-w-lg glass border ${activeTheme.border} shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden relative flex flex-col`}
        >
          {/* Top Progress Bar for Timer */}
          {!canClose && (
             <motion.div 
               initial={{ width: "100%" }} 
               animate={{ width: "0%" }} 
               transition={{ duration: 5, ease: "linear" }}
               className={`h-1 ${activeTheme.bg} absolute top-0 left-0 z-50`}
             />
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-slate-900/40 relative z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Zap className="w-3.5 h-3.5 fill-slate-400" /> Sponsored
              </span>
            </div>
            
            <button 
              onClick={canClose ? onClose : undefined}
              disabled={!canClose}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                canClose 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              {!canClose ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{countdown}s</span>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin"></div>
                </>
              ) : (
                <>
                   <span className="text-[10px] font-bold uppercase tracking-wider">Skip</span>
                   <X className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-0 relative">
              {/* Media Container */}
              {(hasVideo || hasImage) && (
                <div className="w-full aspect-video bg-slate-950 relative group">
                   {hasVideo && youtubeId ? (
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
                   ) : hasVideo ? (
                     <video 
                       src={ad.video} 
                       autoPlay 
                       muted 
                       loop 
                       playsInline 
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <img src={ad.image} alt="Ad" className="w-full h-full object-cover" />
                   )}
                   {/* Gradient Overlay for Text readability */}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Text Content */}
              <div className="p-8 relative z-10 -mt-12">
                  <h3 className="text-3xl font-black text-white leading-tight mb-3 tracking-tight drop-shadow-lg">
                    {ad.title}
                  </h3>
                  
                  <p className="text-sm text-slate-300 font-medium leading-relaxed mb-8 max-w-sm drop-shadow-md">
                    {ad.message}
                  </p>

                  <div className="space-y-4">
                    <motion.a 
                      href={ad.link}
                      target={ad.id === 'feature_highlight_backup' ? "_self" : "_blank"}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                          if (ad.id === 'feature_highlight_backup' && onBackup) {
                              e.preventDefault();
                              onBackup();
                          }
                          onClose();
                      }}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl ${activeTheme.bg} text-slate-950 font-black uppercase tracking-widest text-xs shadow-xl transition-all group relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative z-10 flex items-center gap-2">
                         {ad.buttonText} <ExternalLink className="w-4 h-4" />
                      </span>
                    </motion.a>
                    
                    {canClose && (
                        <button 
                            onClick={onClose} 
                            className="w-full py-2 text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                        >
                            No Thanks
                        </button>
                    )}
                  </div>
              </div>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default SponsorModal;
