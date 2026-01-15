
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string) => void;
  activeTheme: any;
  currency: string;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, onSave, activeTheme, currency }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState('');

  const kbAmount = useVirtualKeyboard('number', setPaymentAmount);

  const handleSubmit = () => {
    if (!paymentAmount) return;
    
    let finalDate = paymentDate;
    if (paymentTime) {
      finalDate = `${paymentDate}T${paymentTime}`;
    }

    onSave(parseFloat(paymentAmount), finalDate);
    
    // Reset fields
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentTime('');
    onClose();
  };

  return (
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="glass w-full max-w-sm rounded-[2.5rem] p-8 relative z-10"
        >
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Log Payment</h2><button onClick={onClose} className="text-slate-400"><X /></button></div>
          
          <div className="space-y-6" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}>
            <div className="relative">
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 ${activeTheme.text} font-bold text-2xl`}>{currency}</span>
                <input 
                    {...kbAmount}
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    className={`w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-5 py-5 text-3xl font-mono font-bold ${activeTheme.text} text-center`} 
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">Date</label>
                 <input autoComplete="off" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-4 text-slate-100 text-center font-mono text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">Time (Optional)</label>
                 <input autoComplete="off" type="time" value={paymentTime} onChange={e => setPaymentTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-4 text-slate-100 text-center font-mono text-sm" />
               </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className={`w-full py-5 ${activeTheme.bg} text-slate-950 rounded-2xl font-black shadow-lg hover:brightness-110 transition-all`}
            >
              Save Payment
            </motion.button>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default PaymentModal;
