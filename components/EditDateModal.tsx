import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, Clock } from 'lucide-react';
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

const EditDateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialAmount,
  title = "Edit Transaction"
}) => {
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const kbAmount = useVirtualKeyboard('number', setNewAmount);

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
      } catch (e) {
        setNewDueDate('');
        setNewDueTime('');
      }
    }
  }, [initialDate, initialAmount, isOpen]);

  const handleSubmit = () => {
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
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: '#1C1C1E',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTop: '0.5px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.7)',
              padding: '12px 20px 24px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
            }}
            className="sm:rounded-b-[28px] sm:border-b sm:border-white/10"
          >
            {/* Grabber handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 5,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.25)',
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.6)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Amount input */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '12px 16px',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'rgba(235, 235, 245, 0.5)',
                    marginBottom: 6,
                  }}
                >
                  <Hash size={12} /> Amount
                </span>
                <input
                  {...kbAmount}
                  type="number"
                  inputMode="decimal"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                />
              </div>

              {/* Date and Time row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '10px 14px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'rgba(235, 235, 245, 0.5)',
                      marginBottom: 6,
                    }}
                  >
                    <Calendar size={12} /> Date
                  </span>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#FFFFFF',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '10px 14px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'rgba(235, 235, 245, 0.5)',
                      marginBottom: 6,
                    }}
                  >
                    <Clock size={12} /> Time
                  </span>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#FFFFFF',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                style={{
                  marginTop: 6,
                  height: 52,
                  borderRadius: 16,
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                }}
              >
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditDateModal;
