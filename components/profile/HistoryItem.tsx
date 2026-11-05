import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, Loader2, Image as ImageIcon, ScrollText, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../../types';

interface HistoryItemProps {
  item: any;
  isActive: boolean;
  onToggle: () => void;
  settings: AppSettings;
  sharingId: string | null;
  onShareReceipt: (item: any) => void;
  onShareLoan: (item: any) => void;
  onUpdateDueDate: (id: string) => void;
  onEditRepayment: (txId: string, repId: string) => void;
  onDelete: (type: 'TRANSACTION' | 'REPAYMENT', id: string, repId?: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  isActive,
  onToggle,
  settings,
  sharingId,
  onShareReceipt,
  onShareLoan,
  onUpdateDueDate,
  onEditRepayment,
  onDelete,
}) => {
  const isLoan = item.type === 'LOAN';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      transition={{ layout: { duration: 0.2 }, default: { duration: 0.15 } }}
      style={{
        background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'var(--app-card-bg, rgba(255, 255, 255, 0.04))',
        border: isActive ? '0.5px solid rgba(255, 255, 255, 0.18)' : '0.5px solid var(--app-card-border, rgba(255, 255, 255, 0.06))',
        borderRadius: 'var(--app-radius, 18px)',
        padding: 'var(--app-row-py, 14px) var(--app-row-px, 16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        backdropFilter: 'blur(var(--app-glass-blur, 16px))',
        WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Left: Icon & Description */}
      <motion.div layout="position" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--app-radius-sm, 12px)',
            background: isLoan ? 'rgba(255, 69, 58, 0.15)' : 'rgba(48, 209, 88, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLoan ? '#FF453A' : '#30D158',
            flexShrink: 0,
          }}
        >
          {isLoan ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isLoan ? 'You gave' : 'You received'}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'rgba(235, 235, 245, 0.5)',
              marginTop: 2,
            }}
          >
            <Calendar size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>
              {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
            </span>
            {isLoan && item.rawTx?.hasTime && (
              <span style={{ color: 'rgba(235, 235, 245, 0.4)' }}>
                {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isLoan && item.rawTx?.isCompleted && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(235, 235, 245, 0.7)',
                }}
              >
                Settled
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Right: Amount & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <motion.div layout="position" style={{ textAlign: 'right', marginRight: 10 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: isLoan ? '#FF453A' : '#30D158',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {isLoan ? '-' : '+'}{settings.currency}{item.amount.toLocaleString('en-IN')}
          </div>
          {isLoan && item.note && (
            <div
              style={{
                fontSize: 10,
                color: 'rgba(235, 235, 245, 0.4)',
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}
            >
              {item.note}
            </div>
          )}
        </motion.div>

        {/* Action Drawer */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                paddingLeft: 8,
                borderLeft: '0.5px solid rgba(255, 255, 255, 0.1)',
                marginRight: 6,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!isLoan && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareReceipt(item);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(48, 209, 88, 0.15)',
                      border: 'none',
                      color: '#30D158',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Generate Receipt"
                  >
                    {sharingId === item.repId ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRepayment(item.id, item.repId!);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(10, 132, 255, 0.15)',
                      border: 'none',
                      color: '#0A84FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Edit Payment"
                  >
                    <Edit3 size={15} />
                  </motion.button>
                </>
              )}

              {isLoan && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareLoan(item);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(100, 210, 255, 0.15)',
                      border: 'none',
                      color: '#64D2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Share Contract"
                  >
                    {sharingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <ScrollText size={15} />}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateDueDate(item.id);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(10, 132, 255, 0.15)',
                      border: 'none',
                      color: '#0A84FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Edit Loan"
                  >
                    <Edit3 size={15} />
                  </motion.button>
                </>
              )}

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLoan) {
                    onDelete('TRANSACTION', item.id);
                  } else {
                    onDelete('REPAYMENT', item.id, item.repId!);
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255, 69, 58, 0.15)',
                  border: 'none',
                  color: '#FF453A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Delete"
              >
                <Trash2 size={15} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isActive ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            color: 'rgba(235, 235, 245, 0.3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={18} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HistoryItem;
