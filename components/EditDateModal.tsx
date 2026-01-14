
import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string) => void;
  initialDate: string;
  initialAmount: number;
  title?: string;
}

const EditDateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialDate, initialAmount, title = "Edit Transaction" }) => {
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const kbNum = useVirtualKeyboard('number');

  useEffect(() => {
    if (isOpen) {
        setNewAmount(initialAmount ? initialAmount.toString() : '');
        try {
             const d = new Date(initialDate);
             const pad = (n: number) => n.toString().padStart(2, '0');
             const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
             const localTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
             
             setNewDueDate(localDate);
             setNewDueTime(localTime);

        } catch(e) {
            setNewDueDate('');
            setNewDueTime('');
        }
    }
  }, [initialDate, initialAmount, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate || !newAmount) return;
    
    let finalDate = newDueDate;
    if (newDueTime) {
      finalDate = `${newDueDate}T${newDueTime}`;
    }
    
    onSave(parseFloat(newAmount), finalDate);
    setNewDueDate('');
    setNewDueTime('');
    setNewAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass w-full max-w-sm rounded-[2.5rem] p-8"
          >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-100">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase ml-1">
                    <Hash className="w-3 h-3" /> Amount
                 </div>
                 <input 
                   {...kbNum}
                   required 
                   type="text" 
                   inputMode="none"
                   value={newAmount} 
                   onChange={e => setNewAmount(e.target.value)} 
                   className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-2xl font-mono font-bold text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase ml-1">
                      <Calendar className="w-3 h-3" /> Date
                   </div>
                   <input required type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-4 text-sm font-mono font-bold text-slate-300 text-center focus:outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase ml-1">
                      Time
                   </div>
                   <input type="time" value={newDueTime} onChange={e => setNewDueTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-4 text-sm font-mono font-bold text-slate-300 text-center focus:outline-none focus:border-blue-500" />
                 </div>
              </div>
              
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditDateModal;
