
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
  initialDate: string;
}

const EditDateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialDate }) => {
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');

  useEffect(() => {
    if (initialDate && isOpen) {
        try {
             // Convert ISO string (UTC) to Local Date/Time for inputs
             const d = new Date(initialDate);
             
             const pad = (n: number) => n.toString().padStart(2, '0');
             const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
             const localTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
             
             setNewDueDate(localDate);
             
             // Check if the original string actually had time components or implies midnight
             // A heuristic: if ISO ends in T00:00:00.000Z it might have been date-only, 
             // but 'd' is already converted to local. 
             // We'll just pre-fill time if it's not 00:00 or if the user explicitly wants to edit.
             // For simplicity, we fill it. If the user clears it, handle that? 
             // Input type='time' doesn't easily allow "clearing" to null in UI without a clear button,
             // but we can just default to showing it.
             
             // Only set time if the date object actually has non-zero time or if we want to show it.
             // To match "optional", maybe we don't set it unless it looks like a specific time was set?
             // But 'initialDate' is likely normalized. 
             // Let's just set it so user sees current state.
             setNewDueTime(localTime);

        } catch(e) {
            setNewDueDate('');
            setNewDueTime('');
        }
    }
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate) return;
    
    let finalDate = newDueDate;
    if (newDueTime) {
      finalDate = `${newDueDate}T${newDueTime}`;
    }
    
    onSave(finalDate);
    setNewDueDate('');
    setNewDueTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Extend Return</h2><button onClick={onClose} className="text-slate-400"><X /></button></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">New Date</label>
               <input required autoFocus type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-5 text-lg font-mono font-bold text-blue-400 text-center" />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">Time</label>
               <input type="time" value={newDueTime} onChange={e => setNewDueTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-5 text-lg font-mono font-bold text-blue-400 text-center" />
             </div>
          </div>
          
          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20">Update Deadline</button>
        </form>
      </div>
    </div>
  );
};

export default EditDateModal;
