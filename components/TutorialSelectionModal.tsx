import React from 'react';
import { X, PlayCircle, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: () => void;
  onSelectInteractive: () => void;
  activeTheme: any;
}

const TutorialSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelectVideo, onSelectInteractive }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center">
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
            maxWidth: 440,
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
              Tutorial & Help
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Video Option */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onSelectVideo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px',
                borderRadius: 18,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '0.5px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'rgba(10, 132, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A84FF',
                  flexShrink: 0,
                }}
              >
                <PlayCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Video Walkthrough
                </div>
                <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.55)', marginTop: 2 }}>
                  Watch a quick overview of how Ledger works
                </div>
              </div>
            </motion.button>

            {/* Interactive Tour */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onSelectInteractive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px',
                borderRadius: 18,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '0.5px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'rgba(48, 209, 88, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#30D158',
                  flexShrink: 0,
                }}
              >
                <Compass size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Interactive Tour
                </div>
                <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.55)', marginTop: 2 }}>
                  Step-by-step interactive guidance on key features
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TutorialSelectionModal;
