import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { AdContent } from '../data/sponsoredContent';
import { useImageCache } from '../hooks/useImageCache';
import { getYoutubeId } from '../utils/common';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ad: AdContent | null;
  activeTheme: any;
  onBackup?: () => void;
}

const SponsorModal: React.FC<Props> = ({ isOpen, onClose, ad, onBackup }) => {
  const { src: cachedImage } = useImageCache(ad?.image);
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && ad) {
      setCanClose(false);
      setCountdown(5);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, ad]);

  if (!ad) return null;

  const youtubeId = ad.video ? getYoutubeId(ad.video) : null;
  const hasVideo = !!ad.video;
  const hasImage = !!ad.image && !hasVideo;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={canClose ? onClose : undefined}
          />

          {/* Ad Card */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              background: '#1C1C1E',
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 28,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(255, 255, 255, 0.08)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(235, 235, 245, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkles size={12} /> Spotlight
              </span>

              <button
                type="button"
                onClick={canClose ? onClose : undefined}
                disabled={!canClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 9999,
                  background: canClose ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: canClose ? '#FFFFFF' : 'rgba(235, 235, 245, 0.4)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: canClose ? 'pointer' : 'not-allowed',
                }}
              >
                {!canClose ? <span>Skip in {countdown}s</span> : <><span>Skip</span><X size={14} /></>}
              </button>
            </div>

            {/* Media */}
            {(hasVideo || hasImage) && (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#000000', position: 'relative' }}>
                {hasVideo && youtubeId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&controls=0&loop=1&playlist=${youtubeId}`}
                    title="Featured"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />
                ) : hasVideo ? (
                  <video
                    src={ad.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={cachedImage || ad.image}
                    alt="Featured"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            )}

            {/* Body */}
            <div style={{ padding: '20px 24px 24px 24px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}
              >
                {ad.title}
              </h3>

              <p
                style={{
                  margin: '8px 0 20px 0',
                  fontSize: 14,
                  color: 'rgba(235, 235, 245, 0.65)',
                  lineHeight: 1.45,
                }}
              >
                {ad.message}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.a
                  href={ad.link}
                  target={ad.id === 'feature_highlight_backup' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (ad.id === 'feature_highlight_backup' && onBackup) {
                      e.preventDefault();
                      onBackup();
                    }
                    onClose();
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    height: 50,
                    borderRadius: 16,
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span>{ad.buttonText}</span>
                  <ExternalLink size={16} />
                </motion.a>

                {canClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(235, 235, 245, 0.45)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 6,
                    }}
                  >
                    No thanks
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SponsorModal;
