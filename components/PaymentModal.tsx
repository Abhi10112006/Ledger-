
import React, { useState } from 'react';
import { X } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;
    
    onSave(parseFloat(paymentAmount), paymentDate);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Log Payment</h2><button onClick={onClose} className="text-slate-400"><X /></button></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative"><span className={`absolute left-5 top-1/2 -translate-y-1/2 ${activeTheme.text} font-bold text-2xl`}>{currency}</span><input required autoFocus type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={`w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-5 py-5 text-3xl font-mono font-bold ${activeTheme.text} text-center`} /></div>
          <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 text-center font-mono" />
          <button className={`w-full py-5 ${activeTheme.bg} text-slate-950 rounded-2xl font-black shadow-lg`}>Save Payment</button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
