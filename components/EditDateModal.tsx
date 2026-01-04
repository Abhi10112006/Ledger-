
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

  useEffect(() => {
    if (initialDate) {
        try {
             setNewDueDate(initialDate.split('T')[0]);
        } catch(e) {
            setNewDueDate('');
        }
    }
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate) return;
    onSave(newDueDate);
    setNewDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">Extend Return</h2><button onClick={onClose} className="text-slate-400"><X /></button></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input required autoFocus type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-5 text-xl font-mono font-bold text-blue-400 text-center" />
          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black">Update Deadline</button>
        </form>
      </div>
    </div>
  );
};

export default EditDateModal;
