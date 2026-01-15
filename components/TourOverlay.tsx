
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp, PlusCircle, CreditCard, UserCheck, CalendarDays, FileText, Download, ArrowRight, Target, Settings, Eye, Search, Type, Keyboard, QrCode } from 'lucide-react';

interface Props {
  tourStep: number;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  activeTheme: any;
}

const TourOverlay: React.FC<Props> = ({ tourStep, setTourStep, completeTour, activeTheme }) => {
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: '50%',
    left: '50%',
    width: 0,
    height: 0
  });
  
  // Track if we found the target for current step
  const [hasTarget, setHasTarget] = useState(false);

  // Configuration for each step
  const steps = [
    { 
      id: 'tour-intro',
      title: "Welcome!", 
      desc: "This app helps you keep track of money you lend to friends. Let's take a quick look around.", 
      icon: <Sparkles className="text-cyan-400" />,
      targetId: null 
    },
    { 
      id: 'tour-stats',
      title: "1. Money Tracker", 
      desc: "'To Collect' means money your friends still owe you. 'Collected' means money you already got back.", 
      icon: <TrendingUp className={activeTheme.text} />,
      targetId: 'tour-stats'
    },
    { 
      id: 'tour-search',
      title: "2. Search Friends", 
      desc: "Type a name here to quickly find a friend's profile.", 
      icon: <Search className="text-violet-400" />,
      targetId: 'tour-search' 
    },
    { 
      id: 'tour-add-profile',
      title: "3. Give Money", 
      desc: "Click this Plus button to add a new friend or record a new loan.", 
      icon: <PlusCircle className="text-blue-400" />,
      targetId: 'tour-add-profile'
    },
    { 
      id: 'tour-settings',
      title: "4. Settings", 
      desc: "Change your name, currency symbol, and other options here.", 
      icon: <Settings className="text-slate-400" />,
      targetId: 'tour-settings' 
    },
    { 
      id: 'tour-typography',
      title: "5. Fonts", 
      desc: "Don't like this text? You can change the font style here.", 
      icon: <Type className="text-indigo-400" />,
      targetId: 'tour-typography' 
    },
    { 
      id: 'tour-visual-tab',
      title: "6. Look & Feel", 
      desc: "Inside Settings, use this tab to change colors and cool effects.", 
      icon: <Eye className="text-teal-400" />,
      targetId: 'tour-visual-tab' 
    },
    { 
      id: 'tour-visual-base',
      title: "7. Colors", 
      desc: "Switch between Dark Grey or Pitch Black backgrounds.", 
      icon: <Sparkles className="text-purple-400" />,
      targetId: 'tour-visual-base' 
    },
    { 
      id: 'tour-visual-glass',
      title: "8. Cool Effects", 
      desc: "Make the boxes see-through or add a grainy film effect.", 
      icon: <Settings className="text-indigo-400" />,
      targetId: 'tour-visual-glass' 
    },
    { 
      id: 'tour-keyboard-toggle',
      title: "9. Input Method", 
      desc: "Prefer a number pad? Or the system keyboard? You can toggle the custom keyboard here.", 
      icon: <Keyboard className="text-emerald-400" />,
      targetId: 'tour-keyboard-toggle' 
    },
    { 
      id: 'tour-upi-button',
      title: "10. UPI Payments", 
      desc: "Inside a friend's profile, click this QR icon to generate a payment request instantly.", 
      icon: <QrCode className="text-rose-400" />,
      targetId: 'tour-upi-button' 
    },
    { 
      id: 'tour-backup',
      title: "11. Save Data", 
      desc: "Your data is only on this phone. Click here to download a backup file so you don't lose it.", 
      icon: <Download className="text-amber-400" />,
      targetId: 'tour-backup'
    }
  ];

  const currentStep = tourStep >= 0 && tourStep < steps.length ? steps[tourStep] : null;

  useEffect(() => {
    if (!currentStep) return;

    if (currentStep.targetId) {
      let attempts = 0;
      
      const findTarget = () => {
        const targetEl = document.getElementById(currentStep.targetId!);
        
        if (targetEl) {
          // Scroll target into view smoothly
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          
          const rect = targetEl.getBoundingClientRect();
          const padding = 8;
          setSpotlightStyle({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + (padding * 2),
            height: rect.height + (padding * 2),
            opacity: 1,
            borderRadius: window.getComputedStyle(targetEl).borderRadius || '1rem'
          });
          setHasTarget(true);
        } else {
          // Retry mechanism for modals that animate in or complex DOM updates
          if (attempts < 20) {
            attempts++;
            setTimeout(findTarget, 50);
          } else {
            setSpotlightStyle(prev => ({ ...prev, opacity: 0 }));
            setHasTarget(false);
          }
        }
      };

      findTarget();

    } else {
      // Center modal for intro
      setHasTarget(false);
      setSpotlightStyle({
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        opacity: 0
      });
    }
  }, [tourStep, currentStep]);

  if (!currentStep) return null;

  const isTopHalf = (typeof spotlightStyle.top === 'number') && spotlightStyle.top < window.innerHeight / 2;
  
  return (
    // pointer-events-none on ROOT ensures clicks pass through the empty spaces
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      
      {/* 
        THE SPOTLIGHT 
        The shadow creates the dark overlay. The div itself is the "hole".
      */}
      <div 
        className="absolute transition-all duration-500 ease-in-out pointer-events-none border-2 border-white/20 shadow-[0_0_0_9999px_rgba(2,6,23,0.85)]"
        style={{
          ...spotlightStyle,
          display: hasTarget ? 'block' : 'none'
        }}
      >
        {/* Animated Corner Brackets */}
        <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${activeTheme.border.replace('border-', 'border-')}`}></div>
        <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${activeTheme.border.replace('border-', 'border-')}`}></div>
        <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${activeTheme.border.replace('border-', 'border-')}`}></div>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${activeTheme.border.replace('border-', 'border-')}`}></div>
      </div>

      {/* 
        INTRO / NO TARGET MODAL (Centered) 
        Pointer-events-auto re-enables clicking on this specific modal
      */}
      {!hasTarget && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto" onClick={completeTour}>
           <div className={`glass max-w-sm w-full p-8 rounded-[2.5rem] border ${activeTheme.border} shadow-2xl relative overflow-hidden`} onClick={e => e.stopPropagation()}>
             <div className={`absolute -top-20 -right-20 w-40 h-40 ${activeTheme.bg} blur-[80px] opacity-20`}></div>
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                    {currentStep.icon}
                  </div>
                  <div>
                     <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.text} mb-1`}>Start Here</div>
                     <h3 className="text-2xl font-black text-white">{currentStep.title}</h3>
                  </div>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed">{currentStep.desc}</p>
                <div className="pt-4 flex justify-between items-center">
                    <button onClick={completeTour} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">SKIP</button>
                    <button 
                      onClick={() => setTourStep(tourStep + 1)}
                      className={`px-6 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                    >
                      Start Tour
                    </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* 
        TOOLTIP CARD
        Pointer-events-auto re-enables clicking on buttons
      */}
      {hasTarget && (
        <div 
           className="absolute left-0 w-full flex justify-center transition-all duration-500 ease-in-out px-6 pointer-events-none"
           style={{
             top: isTopHalf 
               ? (typeof spotlightStyle.top === 'number' ? spotlightStyle.top + (typeof spotlightStyle.height === 'number' ? spotlightStyle.height : 0) + 24 : 0)
               : (typeof spotlightStyle.top === 'number' ? spotlightStyle.top - 200 : 0)
           }}
        >
          <div className={`glass max-w-sm w-full p-6 rounded-3xl border ${activeTheme.border} bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto`}>
            <div className="flex items-start gap-4">
               <div className="shrink-0 mt-1">
                 {currentStep.icon}
               </div>
               <div className="space-y-2">
                 <h3 className="font-black text-lg text-white">{currentStep.title}</h3>
                 <p className="text-sm text-slate-300 font-medium leading-relaxed">{currentStep.desc}</p>
               </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === tourStep ? activeTheme.bg : 'bg-slate-700'}`}></div>
                  ))}
                </div>
                <div className="flex gap-4 items-center">
                  <button onClick={completeTour} className="text-[10px] font-bold text-slate-500 hover:text-rose-400">END</button>
                  <button 
                    onClick={() => tourStep < steps.length - 1 ? setTourStep(tourStep + 1) : completeTour()}
                    className={`flex items-center gap-2 px-4 py-2 ${activeTheme.bg} text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all`}
                  >
                    {tourStep < steps.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TourOverlay;
