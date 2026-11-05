import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, ShieldAlert, ShieldCheck, Award, X, History, Info, TrendingUp, TrendingDown, Skull, Frown, Meh, Smile } from 'lucide-react';
import { getTrustBreakdown } from '../utils/calculations';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  score: number;
  friendName?: string;
  profileId?: string;
  allTransactions?: Transaction[];
  currency: string;
}

const TrustScoreBadge: React.FC<Props> = ({ score, profileId, allTransactions = [], currency }) => {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const safeScore = isNaN(score) ? 60 : Math.round(score);

  const getInfo = () => {
    if (safeScore >= 91) return {
      label: 'Trustworthy',
      color: '#30D158',
      bg: 'rgba(48, 209, 88, 0.12)',
      border: 'rgba(48, 209, 88, 0.25)',
      icon: <Award className="w-3.5 h-3.5" />,
      desc: "Elite Borrower. Always pays on time."
    };
    if (safeScore >= 81) return {
      label: 'Very Good',
      color: '#30D158',
      bg: 'rgba(48, 209, 88, 0.12)',
      border: 'rgba(48, 209, 88, 0.25)',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      desc: "Highly reliable. Rarely misses a date."
    };
    if (safeScore >= 71) return {
      label: 'Good',
      color: '#34C759',
      bg: 'rgba(52, 199, 89, 0.12)',
      border: 'rgba(52, 199, 89, 0.25)',
      icon: <Smile className="w-3.5 h-3.5" />,
      desc: "Generally safe. Good repayment history."
    };
    if (safeScore >= 61) return {
      label: 'Fair',
      color: '#0A84FF',
      bg: 'rgba(10, 132, 255, 0.12)',
      border: 'rgba(10, 132, 255, 0.25)',
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: "Okay to lend. Keep an eye on dates."
    };
    if (safeScore >= 51) return {
      label: 'Okay',
      color: '#FFD60A',
      bg: 'rgba(255, 214, 10, 0.12)',
      border: 'rgba(255, 214, 10, 0.25)',
      icon: <Meh className="w-3.5 h-3.5" />,
      desc: "Borderline. Reminders might be needed."
    };
    if (safeScore >= 41) return {
      label: 'Bad',
      color: '#FF9F0A',
      bg: 'rgba(255, 159, 10, 0.12)',
      border: 'rgba(255, 159, 10, 0.25)',
      icon: <Frown className="w-3.5 h-3.5" />,
      desc: "Risky. Often late or difficult."
    };
    if (safeScore >= 21) return {
      label: 'Very Bad',
      color: '#FF453A',
      bg: 'rgba(255, 69, 58, 0.12)',
      border: 'rgba(255, 69, 58, 0.25)',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      desc: "High Risk. Expect delays and issues."
    };
    return {
      label: 'Worst',
      color: '#FF3B30',
      bg: 'rgba(255, 59, 48, 0.15)',
      border: 'rgba(255, 59, 48, 0.3)',
      icon: <Skull className="w-3.5 h-3.5" />,
      desc: "Critical Risk. Do not lend."
    };
  };

  const info = getInfo();

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowModal(false);
  };

  const renderModalContent = () => {
    if (!profileId) return null;

    let breakdown = null;
    try {
      breakdown = getTrustBreakdown(profileId, allTransactions, currency);
    } catch (e) {
      console.error("Truth breakdown calculation failed", e);
      return null;
    }

    return (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        />

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
          onClick={(e) => e.stopPropagation()}
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
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                Trust Score Analysis
              </h2>
              <span style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)' }}>
                Ledger ID: {profileId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
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

          {/* Scrollable Body */}
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }} className="scrollbar-hide">
            {/* Score Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '0.5px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: info.color,
                  lineHeight: 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {breakdown.score}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: info.bg,
                  border: `0.5px solid ${info.border}`,
                  color: info.color,
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 10,
                  marginBottom: 8,
                }}
              >
                {info.icon}
                <span>{info.label}</span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.65)',
                  margin: 0,
                  maxWidth: 260,
                }}
              >
                {info.desc}
              </p>
            </div>

            {/* Factors */}
            {breakdown.factors.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'rgba(235, 235, 245, 0.45)',
                    marginBottom: 8,
                    paddingLeft: 4,
                  }}
                >
                  <Info size={12} /> Key Factors
                </span>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}
                >
                  {breakdown.factors.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: i < breakdown.factors.length - 1 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 14, color: 'rgba(235, 235, 245, 0.85)', fontWeight: 500 }}>
                        {f.label}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          color: f.impact === 'positive' ? '#30D158' : f.impact === 'negative' ? '#FF453A' : 'rgba(235, 235, 245, 0.6)',
                        }}
                      >
                        {f.impact === 'positive' && <TrendingUp size={14} />}
                        {f.impact === 'negative' && <TrendingDown size={14} />}
                        <span>{f.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'rgba(235, 235, 245, 0.45)',
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                <History size={12} /> Recent Activity
              </span>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  overflow: 'hidden',
                }}
              >
                {breakdown.history.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < Math.min(breakdown.history.length, 5) - 1 ? '0.5px solid rgba(255, 255, 255, 0.06)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: h.status === 'On-Time' ? '#30D158' : h.status === 'Late' ? '#FF453A' : 'rgba(235, 235, 245, 0.4)',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>{h.event}</div>
                        <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>{h.date}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: h.status === 'On-Time' ? 'rgba(48, 209, 88, 0.12)' : h.status === 'Late' ? 'rgba(255, 69, 58, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: h.status === 'On-Time' ? '#30D158' : h.status === 'Late' ? '#FF453A' : 'rgba(235, 235, 245, 0.6)',
                      }}
                    >
                      {h.status}
                    </span>
                  </div>
                ))}
                {breakdown.history.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'rgba(235, 235, 245, 0.4)' }}>
                    No recorded activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 9999,
          background: info.bg,
          border: `0.5px solid ${info.border}`,
          color: info.color,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          letterSpacing: '-0.01em',
        }}
      >
        {info.icon}
        <span>{safeScore} • {info.label}</span>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {showModal && renderModalContent()}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default TrustScoreBadge;
