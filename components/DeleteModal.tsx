
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
              textAlign: 'center',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '4px auto 20px' }} />

            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'rgba(255,59,48,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <AlertTriangle size={26} style={{ color: '#FF453A' }} />
            </div>

            <h2 style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
              fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8,
            }}>
              Delete Record?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(235,235,245,0.5)', lineHeight: 1.5, marginBottom: 24 }}>
              This action is permanent and cannot be undone.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                style={{
                  width: '100%', height: 52, borderRadius: 14,
                  background: '#FF3B30', color: '#fff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                  fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Delete
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{
                  width: '100%', height: 52, borderRadius: 14,
                  background: 'rgba(120,120,128,0.2)', color: 'rgba(235,235,245,0.8)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                  fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteModal;
