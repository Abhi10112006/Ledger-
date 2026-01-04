
import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { InterestType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    friendName: string;
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
  }) => void;
  activeTheme: any;
  currency: string;
}

const DealModal: React.FC<Props> = ({ isOpen, onClose, onSave, activeTheme, currency }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<InterestType>('none');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !amount) return;
    
    onSave({
      friendName,
      amount: parseFloat(amount),
      startDate,
      returnDate: returnDate || new Date(Date.now() + 604800000).toISOString(),
      notes,
      interestRate: parseFloat(interestRate) || 0,
      interestType
    });
    
    // Reset and close
    setFriendName('');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setReturnDate('');
    setNotes('');
    setInterestRate('0');
    setInterestType('none');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-[2.5rem] animate-in zoom-in-95 duration-200 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <h2 className="text-2xl font-black flex items-center gap-3"><PlusCircle className={`${activeTheme.text} w-7 h-7`} /> New Deal</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Client</label>
              <input required autoFocus placeholder="Name" value={friendName} onChange={e => setFriendName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Principal ({currency})</label>
              <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Start</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">End</label>
              <input required type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Interest (%)</label>
              <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Cycle</label>
              <select value={interestType} onChange={e => setInterestType(e.target.value as InterestType)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 appearance-none">
                <option value="none">Fixed</option><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <button className={`w-full py-5 ${activeTheme.bg} text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl ${activeTheme.shadow} active:scale-[0.98] transition-transform`}>Save Deal</button>
        </form>
      </div>
    </div>
  );
};

export default DealModal;
