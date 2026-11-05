
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
    if (paymentTime) finalDate = `${paymentDate}T${paymentTime}`;
    onSave(parseFloat(paymentAmount), finalDate);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentTime('');
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48,
    background: 'rgba(120,120,128,0.18)',
    border: '0.5px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '0 14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
    fontWeight: 400, fontSize: 15,
    color: '#fff', outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 440,
              background: '#1C1C1E',
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              border: '0.5px solid rgba(255,255,255,0.08)',
              padding: '8px 20px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '4px auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#fff',
              }}>
                Record Payment
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} style={{ color: 'rgba(235,235,245,0.5)' }} />
              </button>
            </div>

            {/* Amount input — big */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 22,
                color: activeTheme.hex,
              }}>
                {currency}
              </span>
              <input
                {...kbAmount}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0"
                style={{
                  ...inputStyle,
                  height: 64, paddingLeft: 44,
                  fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em',
                  background: 'rgba(120,120,128,0.15)',
                  color: activeTheme.hex,
                }}
              />
            </div>

            {/* Date + time row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'rgba(235,235,245,0.4)', display: 'block', marginBottom: 6 }}>Date</label>
                <input autoComplete="off" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'rgba(235,235,245,0.4)', display: 'block', marginBottom: 6 }}>Time (optional)</label>
                <input autoComplete="off" type="time" value={paymentTime} onChange={e => setPaymentTime(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              style={{
                width: '100%', height: 54, borderRadius: 16,
                background: paymentAmount ? activeTheme.hex : 'rgba(120,120,128,0.2)',
                color: paymentAmount ? '#000' : 'rgba(235,235,245,0.3)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
                border: 'none', cursor: paymentAmount ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              Save Payment
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
