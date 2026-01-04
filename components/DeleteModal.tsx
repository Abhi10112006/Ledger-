
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-in zoom-in-90 duration-300">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-2 text-white">Confirm Deletion</h2>
        <p className="text-slate-400 mb-8">This action is permanent and will purge this deal from your ledger.</p>
        <div className="space-y-3">
          <button onClick={onConfirm} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform">Purge Record</button>
          <button onClick={onClose} className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
