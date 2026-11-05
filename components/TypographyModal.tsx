import React, { useState } from 'react';
import { X, Check, Type, Sparkles } from 'lucide-react';
import { FontStyle } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { registerPlugin, Capacitor } from '@capacitor/core';

interface NativeTypographyInterface {
  applyTextRenderingOptimizations(): Promise<{ optimized: boolean }>;
}
const NativeTypography = registerPlugin<NativeTypographyInterface>('NativeTypography');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFont: FontStyle;
  onSelect: (font: FontStyle) => void;
  activeTheme: any;
  currency?: string;
}

interface FontOption {
  id: FontStyle;
  label: string;
  sublabel: string;
  category: 'SANS' | 'SERIF' | 'MONO' | 'DISPLAY';
  familyClass: string;
  specimen: string;
}

const FONTS: FontOption[] = [
  {
    id: 'system',
    label: 'San Francisco (System)',
    sublabel: 'Default typeface',
    category: 'SANS',
    familyClass: 'font-system-app',
    specimen: '1234567890 • Ledger System',
  },
  {
    id: 'sans',
    label: 'Inter Sans',
    sublabel: 'Modern clean sans-serif',
    category: 'SANS',
    familyClass: 'font-sans-app',
    specimen: '1234567890 • Ultra-legible financial text',
  },
  {
    id: 'outfit',
    label: 'Outfit Display',
    sublabel: 'Contemporary geometric sans',
    category: 'DISPLAY',
    familyClass: 'font-outfit-app',
    specimen: '1234567890 • Sleek geometric curves',
  },
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    sublabel: 'Modern neo-grotesque display',
    category: 'DISPLAY',
    familyClass: 'font-jakarta-app',
    specimen: '1234567890 • Premium fintech aesthetic',
  },
  {
    id: 'mono',
    label: 'JetBrains Mono',
    sublabel: 'Technical monospace',
    category: 'MONO',
    familyClass: 'font-mono-app',
    specimen: '1234567890 • Code & data alignment',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    sublabel: 'Luxury high-fashion serif',
    category: 'SERIF',
    familyClass: 'font-playfair-app',
    specimen: '1234567890 • Editorial elegance',
  },
  {
    id: 'serif',
    label: 'Typewriter Elite',
    sublabel: 'Classic serif editorial',
    category: 'SERIF',
    familyClass: 'font-serif-app',
    specimen: '1234567890 • Vintage ledger records',
  },
  {
    id: 'comic',
    label: 'Casual Sans',
    sublabel: 'Playful and rounded',
    category: 'DISPLAY',
    familyClass: 'font-comic-app',
    specimen: '1234567890 • Friendly hand-drawn feel',
  },
];

export const TypographyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentFont,
  onSelect,
  activeTheme,
  currency = '₹',
}) => {
  const [previewFont, setPreviewFont] = useState<FontStyle>(currentFont);
  const haptic = useHaptics();

  // Keep previewFont in sync if currentFont changes from outside
  React.useEffect(() => {
    setPreviewFont(currentFont);
  }, [currentFont]);

  if (!isOpen) return null;

  const handleSelectFont = async (fontId: FontStyle) => {
    haptic('selection');
    setPreviewFont(fontId);
    onSelect(fontId);
    if (Capacitor.isNativePlatform()) {
      try {
        await NativeTypography.applyTextRenderingOptimizations();
      } catch (e) {
        // Safe ignore
      }
    }
  };

  const activeFontObj = FONTS.find((f) => f.id === previewFont) || FONTS[0];

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3600,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
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
            maxWidth: 520,
            maxHeight: '90vh',
            background: '#141416',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -16px 48px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
          className="scrollbar-hide"
        >
          {/* Top ambient theme glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: 140,
              background: `radial-gradient(ellipse at top center, ${activeTheme.hex}20 0%, transparent 75%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Grab handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 6, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.22)' }} />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 22px 14px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  }}
                >
                  Typography Engine
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: `${activeTheme.hex}22`,
                    color: activeTheme.hex,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Native Text
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(235, 235, 245, 0.5)' }}>
                Select a high-performance typeface for your ledger
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(235, 235, 245, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ─── LIVE FINANCIAL SPECIMEN STAGE ─── */}
          <div style={{ padding: '0 20px 18px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(145deg, rgba(28, 28, 34, 0.95) 0%, rgba(16, 16, 20, 0.98) 100%)',
                border: `1px solid ${activeTheme.hex}35`,
                borderRadius: 22,
                padding: '16px 18px',
                boxShadow: `0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 24px ${activeTheme.hex}15`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Background ambient mesh */}
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${activeTheme.hex}25 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />

              {/* Stage Top Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: activeTheme.hex,
                      boxShadow: `0 0 8px ${activeTheme.hex}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(235, 235, 245, 0.65)',
                    }}
                  >
                    Active Specimen Stage
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: `${activeTheme.hex}18`,
                    border: `0.5px solid ${activeTheme.hex}40`,
                  }}
                >
                  <Sparkles size={11} style={{ color: activeTheme.hex }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: activeTheme.hex }}>
                    {activeFontObj.label}
                  </span>
                </div>
              </div>

              {/* Primary Financial Specimen Display */}
              <div className={activeFontObj.familyClass} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {currency}14,250.00
                  </div>
                  <div
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '0.5px solid rgba(16, 185, 129, 0.35)',
                      color: '#34d399',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    ● DUE IN 12 DAYS
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.75)', fontWeight: 500 }}>
                    Principal Lent to Alex Carter
                  </span>
                  <span style={{ fontSize: 11.5, color: activeTheme.hex, fontWeight: 600 }}>
                    + {currency}1,250 interest (8.5%)
                  </span>
                </div>
              </div>

              {/* Character & Numeral Specimen Strip */}
              <div
                className={activeFontObj.familyClass}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '0.5px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 10,
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'rgba(235, 235, 245, 0.5)',
                  letterSpacing: '0.04em',
                }}
              >
                <span>ABCDEFGHIJK • abcdefghijk</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>0123456789</span>
              </div>
            </div>
          </div>

          {/* ─── FONT SELECTION LIST ─── */}
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
            {FONTS.map((font) => {
              const isSelected = currentFont === font.id;
              const isHovered = previewFont === font.id;

              return (
                <motion.div
                  key={font.id}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    handleSelectFont(font.id);
                  }}
                  onMouseEnter={() => setPreviewFont(font.id)}
                  style={{
                    background: isSelected
                      ? `${activeTheme.hex}18`
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected
                      ? `1.5px solid ${activeTheme.hex}80`
                      : '0.5px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 16,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: isSelected ? `0 4px 18px ${activeTheme.hex}20` : 'none',
                    transition: 'border 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={font.familyClass}
                        style={{
                          fontSize: 15,
                          fontWeight: isSelected ? 700 : 600,
                          color: '#FFFFFF',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {font.label}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 5,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(235, 235, 245, 0.6)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {font.category}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)', marginTop: 2 }}>
                      {font.sublabel}
                    </div>

                    <div
                      className={font.familyClass}
                      style={{
                        fontSize: 11,
                        color: isSelected ? activeTheme.hex : 'rgba(235, 235, 245, 0.3)',
                        marginTop: 4,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {font.specimen}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: isSelected ? activeTheme.hex : 'rgba(255, 255, 255, 0.08)',
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000000',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TypographyModal;
