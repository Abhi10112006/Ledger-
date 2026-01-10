
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ArrowUpRight, ShieldCheck, Check, Search } from 'lucide-react';
import { InterestType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    friendName: string;
    profileId?: string; // ID for linking
    friendPhone?: string;
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
    interestFreeIfPaidByDueDate: boolean;
  }) => void;
  activeTheme: any;
  currency: string;
  initialName?: string;
  initialProfileId?: string;
}

const DealModal: React.FC<Props> = ({ isOpen, onClose, onSave, activeTheme, currency, initialName = '', initialProfileId }) => {
  const [friendName, setFriendName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [friendPhone, setFriendPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<InterestType>('none');
  const [interestFree, setInterestFree] = useState(false);

  // Search Logic
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  useEffect(() => {
    if (isOpen) {
        setFriendName(initialName);
        setSelectedProfileId(initialProfileId || null);
        setFriendPhone('');
        setStartTime('');
        setInterestFree(false);
        setSearchResults([]);
        // Reset amounts and dates but keep name if provided
        setAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialName, initialProfileId]);

  // Autocomplete Effect
  useEffect(() => {
    if (!friendName || selectedProfileId || initialName) {
        setSearchResults([]);
        return;
    }
    try {
        const saved = localStorage.getItem('abhi_ledger_session');
        if (saved) {
            const txs = JSON.parse(saved);
            const uniqueProfiles = new Map();
            txs.forEach((t: any) => {
                const pid = t.profileId || 'LEGACY'; 
                if (!uniqueProfiles.has(pid)) {
                    uniqueProfiles.set(pid, { id: pid, name: t.friendName });
                }
            });
            const results = Array.from(uniqueProfiles.values())
                .filter((p: any) => p.name.toLowerCase().includes(friendName.toLowerCase()))
                .slice(0, 3);
            setSearchResults(results);
        }
    } catch(e) {}
  }, [friendName, selectedProfileId, initialName]);

  const selectExisting = (profile: any) => {
      setFriendName(profile.name);
      setSelectedProfileId(profile.id);
      setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !amount) return;
    
    let finalStartDate = startDate;
    if (startTime) {
      finalStartDate = `${startDate}T${startTime}`;
    }

    onSave({
      friendName,
      profileId: selectedProfileId || undefined,
      friendPhone,
      amount: parseFloat(amount),
      startDate: finalStartDate,
      returnDate: returnDate || new Date(Date.now() + 604800000).toISOString(),
      notes,
      interestRate: parseFloat(interestRate) || 0,
      interestType,
      interestFreeIfPaidByDueDate: interestFree
    });
    
    // Reset and close
    setFriendName('');
    setSelectedProfileId(null);
    setFriendPhone('');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartTime('');
    setReturnDate('');
    setNotes('');
    setInterestRate('0');
    setInterestType('none');
    setInterestFree(false);
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
          className="glass w-full max-w-lg rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto relative z-10"
        >
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
            <h2 className="text-2xl font-black flex items-center gap-3">
               <div className="bg-rose-500/10 p-2 rounded-full"><ArrowUpRight className="text-rose-500 w-6 h-6" /></div>
               Give Money
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-500 ml-1">Friend Name</label>
                <div className="relative">
                    <input 
                      required 
                      autoFocus 
                      placeholder="Who are you paying?" 
                      value={friendName} 
                      onChange={e => {
                          // Only allow editing name if not locked by initialName
                          if (!initialName) {
                              setFriendName(e.target.value);
                              setSelectedProfileId(null);
                          }
                      }}
                      onBlur={() => setTimeout(() => setSearchResults([]), 200)}
                      // Lock input if coming from Profile
                      readOnly={!!initialName}
                      className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700 ${initialName ? 'opacity-70 cursor-not-allowed font-bold' : ''} ${selectedProfileId ? 'border-emerald-500/50 pl-10' : ''}`} 
                    />
                    {selectedProfileId && (
                        <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    )}
                </div>

                {searchResults.length > 0 && !initialName && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                        <div className="px-3 py-2 text-[9px] font-black uppercase text-slate-500 bg-slate-950/50">Found Existing Contacts</div>
                        {searchResults.map(res => (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => selectExisting(res)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between group transition-colors"
                            >
                                <span className="text-sm font-bold text-slate-200">{res.name}</span>
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 group-hover:border-slate-600">#{res.id}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 ml-1">Amount ({currency})</label>
                <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-bold text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 ml-1">Phone (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="For Reminders"
                  value={friendPhone} 
                  onChange={e => setFriendPhone(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 ml-1">For what?</label>
               <input placeholder="e.g. Lunch, Bus ticket, Cash" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-700" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 ml-1">Date Given</label>
                <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
              </div>
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 ml-1">Time (Optional)</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 ml-1">Due Date (When will they pay back?)</label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 font-mono" />
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800/50">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Interest (%)</label>
                  <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 ml-1">Cycle</label>
                  <select value={interestType} onChange={e => setInterestType(e.target.value as InterestType)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 appearance-none">
                      <option value="none">Fixed (One Time)</option><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
                  </select>
                  </div>
              </div>

              <div className={`p-4 rounded-xl border transition-colors cursor-pointer flex items-center gap-4 ${interestFree ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`} onClick={() => setInterestFree(!interestFree)}>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${interestFree ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800'}`}>
                      {interestFree && <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />}
                  </div>
                  <div>
                      <div className={`text-sm font-bold ${interestFree ? 'text-emerald-400' : 'text-slate-300'}`}>No Extra Cost if Paid on Time</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">If they pay by the due date, you won't charge interest.</div>
                  </div>
              </div>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className={`w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-900/20`}
            >
               Confirm Loan
            </motion.button>
          </form>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default DealModal;
