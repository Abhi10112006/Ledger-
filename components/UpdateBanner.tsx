import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { VersionInfo, APP_VERSION } from '../utils/version';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  updateInfo: VersionInfo;
  activeTheme: any;
  onDismiss: () => void;
}

const UpdateBanner: React.FC<Props> = ({ updateInfo, onDismiss }) => {
  const haptic = useHaptics();
  const [isExpanded, setIsExpanded] = useState(false);
  const isForced = !!updateInfo.isForced;

  const handleDownload = () => {
    haptic('success');
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    haptic('light');
    onDismiss();
  };

  const handleToggleChangelog = () => {
    haptic('selection');
    setIsExpanded((p) => !p);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 1 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          padding: '0 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: '0 auto',
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '0.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
            padding: 20,
            color: '#FFFFFF',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: 'rgba(10, 132, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A84FF',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Update Available
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  v{updateInfo.version} — {updateInfo.versionName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                  Current version: v{APP_VERSION}
                </div>
              </div>
            </div>

            {!isForced && (
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.6)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Changelog Toggle */}
          {updateInfo.changelog && updateInfo.changelog.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleToggleChangelog}
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(235, 235, 245, 0.6)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>What's new in this release</span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      margin: '10px 0 0 0',
                      paddingLeft: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {updateInfo.changelog.map((item, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.75)', lineHeight: 1.4 }}>
                        {item}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={16} />
              <span>Update Now</span>
            </motion.button>
            {!isForced && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDismiss}
                style={{
                  padding: '0 18px',
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(235, 235, 245, 0.85)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Later
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateBanner;
