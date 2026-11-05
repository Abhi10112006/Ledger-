import React from 'react';
import { X, Check } from 'lucide-react';
import { LANGUAGES } from '../utils/languages';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (code: string) => void;
  activeTheme: any;
}

const LanguageModal: React.FC<Props> = ({ isOpen, onClose, currentLanguage, onSelect }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center">
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
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
          className="sm:rounded-b-[28px] sm:border-b sm:border-white/10"
        >
          {/* Grabber */}
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
              flexShrink: 0,
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
              Select Language
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

          {/* Grouped language list */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '0.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
            }}
            className="scrollbar-hide"
          >
            {LANGUAGES.map((lang, idx) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelect(lang.code);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    border: 'none',
                    borderBottom: idx < LANGUAGES.length - 1 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                    background: isSelected ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#FFFFFF' : 'rgba(235, 235, 245, 0.9)',
                      }}
                    >
                      {lang.native}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(235, 235, 245, 0.45)',
                        marginTop: 2,
                      }}
                    >
                      {lang.label}
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        background: '#0A84FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                      }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LanguageModal;
