
import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { generateUPIQrCard } from '../utils/imageGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount: number;
  settings: AppSettings;
  onUpdateSettings: (key: keyof AppSettings, value: string) => void;
  activeTheme: any;
}

const UPIGeneratorModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  defaultAmount, 
  settings, 
  onUpdateSettings,
  activeTheme 
}) => {
  const [amount, setAmount] = useState('');
  const [vpa, setVpa] = useState('');
  const [name, setName] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Virtual Keyboard hooks
  const kbAmount = useVirtualKeyboard('number', setAmount);
  const kbVpa = useVirtualKeyboard('email', setVpa); // email layout good for VPA
  const kbName = useVirtualKeyboard('text', setName);

  useEffect(() => {
    if (isOpen) {
      setAmount(Math.round(defaultAmount).toString());
      setVpa(settings.upiId || '');
      setName(settings.upiName || '');
      setQrUrl(null);
    }
    // Only run when modal opens, not when settings update (which happens on generate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpa || !name) return;

    // Save for future
    onUpdateSettings('upiId', vpa);
    onUpdateSettings('upiName', name);

    const safeAmount = amount || '0';
    // Format: upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR
    const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${safeAmount}&cu=INR`;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
    
    setQrUrl(apiUrl);
  };

  const copyVPA = () => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!qrUrl) return;
    setIsSharing(true);
    
    try {
      // Generate the custom card image
      const file = await generateUPIQrCard(
          qrUrl, 
          settings.userName || "User", 
          amount,
          vpa
      );

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Payment QR',
          text: `Scan to pay ₹${amount} to ${name}`,
          files: [file]
        });
      } else if (file) {
        // Fallback to download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
         // Deep fallback to raw QR fetch if canvas generation fails
         const response = await fetch(qrUrl);
         const blob = await response.blob();
         const rawFile = new File([blob], "payment_qr.png", { type: "image/png" });
         if (navigator.share) {
             navigator.share({
                 files: [rawFile]
             });
         }
      }
    } catch (e) {
      console.error("Sharing failed", e);
      // Fallback text share
      if (navigator.share) {
          navigator.share({
              title: 'Payment Details',
              text: `Pay ₹${amount} to UPI ID: ${vpa} (${name})`
          });
      } else {
          alert("Sharing not supported on this device.");
      }
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="glass w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5 bg-slate-900/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl bg-slate-800 ${activeTheme.text}`}>
                      <QrCode className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black text-white">Receive Money (UPI)</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-hide">
              {!qrUrl ? (
                <form onSubmit={generateQR} className="space-y-5">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Your Banking Name</label>
                     <input 
                       {...kbName}
                       type="text" 
                       placeholder="e.g. Abhinav Y" 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       required
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-bold placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                     />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Your UPI ID (VPA)</label>
                     <input 
                       {...kbVpa}
                       type="text" 
                       placeholder="username@bank" 
                       value={vpa} 
                       onChange={e => setVpa(e.target.value)}
                       required 
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Amount to Receive (₹)</label>
                     <input 
                       {...kbAmount}
                       type="text" 
                       value={amount} 
                       onChange={e => setAmount(e.target.value)} 
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-emerald-400 placeholder-slate-800 focus:outline-none focus:border-emerald-500/50 transition-colors"
                     />
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className={`w-full py-4 mt-2 ${activeTheme.bg} text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    <QrCode className="w-5 h-5" /> Generate QR
                  </motion.button>
                  
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed px-4">
                    Your details will be saved securely on this device for next time.
                  </p>
                </form>
              ) : (
                <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-300">
                   <div className="bg-white p-4 rounded-3xl shadow-xl">
                      <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 mix-blend-multiply" />
                   </div>
                   
                   <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan to Pay</p>
                      <h3 className="text-3xl font-black text-emerald-400 font-mono">₹{parseFloat(amount || '0').toLocaleString('en-IN')}</h3>
                      <p className="text-xs font-bold text-slate-400">{name}</p>
                   </div>

                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono text-slate-300">{vpa}</span>
                      <button onClick={copyVPA} className="p-1 hover:text-white text-slate-500 transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                   </div>

                   <div className="flex w-full gap-3">
                       <button 
                         onClick={handleShare}
                         className={`flex-1 py-3 ${activeTheme.bg} text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg`}
                         disabled={isSharing}
                       >
                         {isSharing ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <Share2 className="w-4 h-4" />}
                         Share QR
                       </button>
                       
                       <button 
                         onClick={() => setQrUrl(null)}
                         className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-colors"
                       >
                         Edit
                       </button>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UPIGeneratorModal;
