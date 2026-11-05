import React from 'react';
import { X, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { getTotalPayable } from '../utils/calculations';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: string;
  activeTheme: any;
  onSelectDeal?: (profileId: string) => void;
}

const ActiveDealsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  currency,
  onSelectDeal
}) => {
  const activeDeals = transactions
    .filter((t) => !t.isCompleted)
    .sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime());

  const now = new Date();

  return (
    <AnimatePresence>
      {isOpen && (
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
              maxWidth: 500,
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
                marginBottom: 16,
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
                  Active Deals
                </h2>
                <span style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.45)' }}>
                  {activeDeals.length} {activeDeals.length === 1 ? 'deal' : 'deals'} pending
                </span>
              </div>
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

            {/* List */}
            <div
              style={{
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingRight: 2,
              }}
              className="scrollbar-hide"
            >
              {activeDeals.length > 0 ? (
                activeDeals.map((deal) => {
                  const total = getTotalPayable(deal);
                  const remaining = total - deal.paidAmount;
                  const isOverdue = now > new Date(deal.returnDate);
                  const dueDateStr = new Date(deal.returnDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <motion.div
                      key={deal.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (onSelectDeal) {
                          onSelectDeal(deal.profileId);
                          onClose();
                        }
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: isOverdue
                          ? '0.5px solid rgba(255, 69, 58, 0.3)'
                          : '0.5px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 18,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: isOverdue ? '#FF453A' : '#FFFFFF',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {deal.friendName}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background: isOverdue
                                ? 'rgba(255, 69, 58, 0.15)'
                                : 'rgba(255, 255, 255, 0.08)',
                              color: isOverdue ? '#FF453A' : 'rgba(235, 235, 245, 0.6)',
                            }}
                          >
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: 'rgba(235, 235, 245, 0.45)',
                            marginTop: 4,
                          }}
                        >
                          <Clock size={12} />
                          <span>Due {dueDateStr}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: '-0.02em',
                              color: isOverdue ? '#FF453A' : '#FFFFFF',
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            }}
                          >
                            {currency}{Math.round(remaining).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.4)' }}>
                            remaining
                          </div>
                        </div>
                        <ChevronRight size={16} color="rgba(235, 235, 245, 0.3)" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(235, 235, 245, 0.4)' }}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No active deals found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActiveDealsModal;
