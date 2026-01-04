
import React from 'react';
import { Sparkles, TrendingUp, PlusCircle, CreditCard, UserCheck, CalendarDays, FileText, Download, ArrowRight, Target } from 'lucide-react';

interface Props {
  tourStep: number;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  activeTheme: any;
}

const TourOverlay: React.FC<Props> = ({ tourStep, setTourStep, completeTour, activeTheme }) => {
    const tourSteps = [
        { 
          title: "Welcome aboard!", 
          desc: "This ledger is your personal vault. I'll show you how to master your cash flow in 8 easy steps. Ready?", 
          icon: <Sparkles className="text-cyan-400" />,
          pos: 'center'
        },
        { 
          title: "1. Monitor Exposure", 
          desc: "The Dashboard tracks your money real-time. 'Pending' is the capital currently in the wild. 'Returned' is what's safely back in your pocket.", 
          icon: <TrendingUp className={activeTheme.text} />,
          pos: 'bottom'
        },
        { 
          title: "2. Issue a Loan", 
          desc: "Hit this '+' button to start a new record. Add the person, interest rate, and a return date. Everything is calculated automatically.", 
          icon: <PlusCircle className="text-blue-400" />,
          pos: 'top'
        },
        { 
          title: "3. Log Installments", 
          desc: "When they pay you back partially, use the 'Log Payment' button on the card. It's the large button we're highlighting now!", 
          icon: <CreditCard className="text-purple-400" />,
          pos: 'top' 
        },
        { 
          title: "4. Neural Trust Score", 
          desc: "The Score tracks reliability from 0 to 100. Click the score to see a full breakdown of factors like on-time payments and late penalties.", 
          icon: <UserCheck className="text-emerald-500" />,
          pos: 'bottom' 
        },
        { 
          title: "5. Flex Deadlines", 
          desc: "Plans change. Click the 'Due Date' on any card to extend the return window. The system will log this as a term adjustment.", 
          icon: <CalendarDays className="text-blue-400" />,
          pos: 'top' 
        },
        { 
          title: "6. Detailed PDF Dossier", 
          desc: "Click the File icon (the red one highlighted) next to the Total Liability to generate a professional PDF statement including the new nuanced Trust breakdown.", 
          icon: <FileText className="text-rose-400" />,
          pos: 'top'
        },
        { 
          title: "7. Save Your Data", 
          desc: "Final step: Since this is offline, click the Download icon at the top to save a backup to your device. Look for the blinking icon!", 
          icon: <Download className="text-amber-400" />,
          pos: 'bottom'
        }
      ];

  const currentStep = tourStep >= 0 ? tourSteps[tourStep] : null;
  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 100 }}>
      <div className="absolute inset-0 bg-slate-950/80 pointer-events-auto" style={{ zIndex: 50 }} onClick={completeTour}></div>
      
      <div className={`relative w-full max-w-sm transition-all duration-500 pointer-events-auto ${
        currentStep.pos === 'top' ? 'mb-auto mt-4' : 
        currentStep.pos === 'bottom' ? 'mt-auto mb-20' : 
        'm-auto'
      }`} style={{ zIndex: 70 }}>
        <div className={`glass rounded-[2.5rem] overflow-hidden border ${activeTheme.border} shadow-[0_40px_100px_rgba(0,0,0,1)] flex flex-col`}>
          <div className="p-8 space-y-6 bg-slate-900/95 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                {currentStep.icon}
              </div>
              <div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.text} mb-1`}>Briefing {tourStep + 1}/8</div>
                <h3 className="text-xl font-black leading-tight text-white">{currentStep.title}</h3>
              </div>
            </div>
            
            <p className="text-slate-100 text-sm leading-relaxed font-semibold">{currentStep.desc}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button onClick={completeTour} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-400 transition-colors">Skip Tour</button>
              <button 
                onClick={() => tourStep < tourSteps.length - 1 ? setTourStep(tourStep + 1) : completeTour()}
                className={`px-6 py-3 ${activeTheme.bg} text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 group shadow-2xl ${activeTheme.shadow}`}
              >
                {tourStep < tourSteps.length - 1 ? 'Next Phase' : 'Activate Ledger'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {tourStep === 7 && (
          <div className="fixed top-24 right-10 animate-bounce pointer-events-none" style={{ zIndex: 80 }}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-1 bg-gradient-to-t ${activeTheme.gradient} to-transparent h-12`}></div>
              <Target className={`w-10 h-10 ${activeTheme.text} drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourOverlay;
