import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastEventDetail {
  message: string;
  type: ToastType;
  duration?: number;
}

const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      const { message, type, duration = 3000 } = customEvent.detail;
      const id = Date.now();

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    window.addEventListener('abhi-ledger-toast', handleToast);
    return () => window.removeEventListener('abhi-ledger-toast', handleToast);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#30D158] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#FF453A] shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#0A84FF] shrink-0" />;
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none p-4 gap-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 16px) + 12px)' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            layout
            className="pointer-events-auto w-full max-w-sm"
          >
            <div
              style={{
                background: 'rgba(28, 28, 30, 0.92)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '0.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 20,
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#FFFFFF',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
              }}
            >
              {getIcon(toast.type)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: '19px',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: '#FFFFFF',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.6)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
