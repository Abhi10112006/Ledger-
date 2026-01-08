
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ArrowUpRight } from 'lucide-react';
import { InterestType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    friendName: string;
    friendPhone?: string;
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
  }) => void;
  activeTheme: any;
  currency: string;
  initialName?: string;
}

const DealModal: React.FC<Props> = ({ isOpen, onClose, onSave, activeTheme, currency, initialName = '' }) => {
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<InterestType>('none');

  useEffect(() => {
    if (isOpen) {
        setFriendName(initialName);
        setFriendPhone(''); // Reset phone on new open
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !amount) return;
    
    onSave({
      friendName,
      friendPhone,
      amount: parseFloat(amount),
      startDate,
      returnDate: returnDate || new Date(Date.now() + 604800000).toISOString(),
      notes,
      interestRate: parseFloat(interestRate) || 0,
      interestType
    });
    
    // Reset and close
    setFriendName('');
    setFriendPhone('');
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
          <h2 className="text-2xl font-black flex items-center gap-3">
             <div className="bg-rose-500/10 p-2 rounded-full"><ArrowUpRight className="text-rose-500 w-6 h-6" /></div>
             You Gave
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">To (Client Name)</label>
              <input 
                 required 
                 autoFocus 
                 placeholder="Name" 
                 value={friendName} 
                 onChange={e => setFriendName(e.target.value)} 
                 readOnly={!!initialName}
                 className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700 ${initialName ? 'opacity-70 cursor-not-allowed' : ''}`} 
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Amount ({currency})</label>
              <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Mobile (Optional)</label>
              <input 
                type="tel" 
                placeholder="For SMS Reminders"
                value={friendPhone} 
                onChange={e => setFriendPhone(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 ml-1">Note / Reason</label>
             <input placeholder="e.g. Recharge, Dinner, Cash" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Start Date</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-1">Due Date (Optional)</label>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
            </div>
          </div>

          {/* Collapsible/Advanced section could go here, but for now we keep interest fields accessible */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
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
          
          <button className={`w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-900/20 active:scale-[0.98] transition-transform`}>
             Confirm Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default DealModal;
