
import React, { useState } from 'react';
import { ShieldAlert, Download, Globe, Save } from 'lucide-react';
import AndroidInstallModal from './AndroidInstallModal';

interface Props {
  onBackup?: () => void;
}

const AndroidBlocker: React.FC<Props> = ({ onBackup }) => {
  const [showInstall, setShowInstall] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-red-500 font-mono flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Matrix/Grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06)_1px,transparent_1px),linear-gradient(rgba(255,0,0,0.06)_1px,transparent_1px)] bg-[length:100%_2px,20px_20px,20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="w-24 h-24 mb-6 relative">
           <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
           <ShieldAlert className="w-full h-full relative z-10" />
        </div>

        <h1 className="text-4xl font-black mb-2 tracking-tighter animate-pulse">SYSTEM HALTED</h1>
        <div className="w-full h-px bg-red-900/50 my-4"></div>
        <p className="text-sm font-bold tracking-widest text-red-400 mb-8">
          ANDROID WEB PROTOCOLS <br/> HAVE BEEN TERMINATED
        </p>

        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl mb-8 backdrop-blur-sm">
           <p className="text-xs leading-relaxed text-red-300">
             Security Policy 404: Web access restricted. <br/>
             You must initialize the native application to access the Ledger Mainframe.
           </p>
        </div>

        <button 
          onClick={() => setShowInstall(true)}
          className="w-full py-4 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-widest rounded-xl mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
           <Download className="w-5 h-5" /> Download App (APK)
        </button>

        {onBackup && (
          <button 
            onClick={onBackup}
            className="w-full py-4 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 hover:border-red-500/50 rounded-xl mb-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
             <Save className="w-4 h-4" /> Rescue Data (Backup)
          </button>
        )}

        <a 
          href="https://abhis-ledger.vercel.app/"
          className="w-full py-4 rounded-xl border-2 border-red-900/60 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 font-black text-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
        >
           <Globe className="w-6 h-6" /> Official Website
        </a>
      </div>

      <div className="absolute bottom-6 text-[10px] text-red-900">
         ID: ANDROID_WEB_REVOKED // SECURE_BOOT_REQUIRED
      </div>

      <AndroidInstallModal isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  );
};

export default AndroidBlocker;
