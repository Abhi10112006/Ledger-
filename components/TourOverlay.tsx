
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp, PlusCircle, CreditCard, UserCheck, CalendarDays, FileText, Download, ArrowRight, Target, Settings, Eye, Search } from 'lucide-react';

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
      title: "System Online", 
      desc: "Welcome to your personal debt intelligence vault. I'll walk you through the 8 core modules of the system.", 
      icon: <Sparkles className="text-cyan-400" />,
      targetId: null 
    },
    { 
      id: 'tour-stats',
      title: "1. Exposure Monitor", 
      desc: "Real-time capital tracking. 'Pending' is money in the field; 'Returned' is capital secured. Watch the 'Active' count closely.", 
      icon: <TrendingUp className={activeTheme.text} />,
      targetId: 'tour-stats'
    },
    { 
      id: 'tour-new-deal',
      title: "2. New Contract", 
      desc: "Initiate a new debt record here. Define the Principal, Interest Protocol, and Return Date. The engine handles the math.", 
      icon: <PlusCircle className="text-blue-400" />,
      targetId: 'tour-new-deal'
    },
    { 
      id: 'tour-entry',
      title: "3. Log Transaction", 
      desc: "When capital flows back, click 'Entry' on the specific card. Partial payments automatically reduce the interest burden.", 
      icon: <CreditCard className="text-purple-400" />,
      targetId: 'tour-entry'
    },
    { 
      id: 'tour-trust',
      title: "4. Neural Trust Score", 
      desc: "The algorithm rates every borrower (0-100). Click the badge to view the 'Trust Briefing'—a breakdown of their reliability habits.", 
      icon: <UserCheck className="text-emerald-500" />,
      targetId: 'tour-trust'
    },
    { 
      id: 'tour-date',
      title: "5. Flex Deadlines", 
      desc: "Negotiations happen. Click the date on any card to extend the deadline. The system logs this event for the audit trail.", 
      icon: <CalendarDays className="text-blue-400" />,
      targetId: 'tour-date'
    },
    { 
      id: 'tour-pdf',
      title: "6. Classified Dossier", 
      desc: "Generate a 'Top Secret' agency-style PDF report containing the full ledger history and redacted trust analysis.", 
      icon: <FileText className="text-rose-400" />,
      targetId: 'tour-pdf'
    },
    { 
      id: 'tour-search',
      title: "7. Global Search", 
      desc: "Instantly filter your database. Search by name, amount, or notes to retrieve specific contracts.", 
      icon: <Search className="text-violet-400" />,
      targetId: 'tour-search' 
    },
    { 
      id: 'tour-settings',
      title: "8. System Config", 
      desc: "Access the main control panel here. This is where you configure your identity, currency, and visual preferences.", 
      icon: <Settings className="text-slate-400" />,
      targetId: 'tour-settings' 
    },
    { 
      id: 'tour-visual-tab',
      title: "9. Visual Engine", 
      desc: "Inside Settings, switch to the 'Visual Engine' tab to customize the application's atmosphere and materials.", 
      icon: <Eye className="text-teal-400" />,
      targetId: 'tour-visual-tab' 
    },
    { 
      id: 'tour-visual-base',
      title: "10. Atmosphere", 
      desc: "Toggle between Deep Slate (Professional) and OLED Black (Battery Saver). Apply texture overlays like Nebula or Grid lines.", 
      icon: <Sparkles className="text-purple-400" />,
      targetId: 'tour-visual-base' 
    },
    { 
      id: 'tour-visual-glass',
      title: "11. Glass & Physics", 
      desc: "Fine-tune the UI materials. Adjust glass blur intensity, transparency, and enable cinematic film grain.", 
      icon: <Settings className="text-indigo-400" />,
      targetId: 'tour-visual-glass' 
    },
    { 
      id: 'tour-backup',
      title: "12. Secure Data", 
      desc: "The system is offline-first. Use the Download icon to save an encrypted backup JSON file to your local device.", 
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
          // Retry mechanism for modals that animate in
          if (attempts < 10) {
            attempts++;
            setTimeout(findTarget, 100);
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
                     <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.text} mb-1`}>Initialising</div>
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
