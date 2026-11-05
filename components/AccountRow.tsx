import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AppSettings } from '../types';
import { motion } from 'framer-motion';

interface Props {
  account: any;
  settings: AppSettings;
  activeTheme: any;
  onClick: () => void;
  index?: number;
}

// Deterministic avatar background color based on name
const avatarColors = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE',
  '#FF2D55', '#A2845E',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const AccountRow: React.FC<Props> = ({ account, settings, activeTheme, onClick, index = 0 }) => {
  const isOverdue = account.transactions.some((t: any) => !t.isCompleted && new Date() > new Date(t.returnDate));
  const avatarColor = getAvatarColor(account.name);
  const isSettled = account.totalExposure <= 0;

  return (
    <motion.div
      id={index === 0 ? 'tour-account-row' : undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ opacity: 0.75 }}
      onClick={onClick}
      style={{
        background: 'var(--app-card-bg, #1C1C1E)',
        borderRadius: 'var(--app-radius, 16px)',
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--app-row-py, 12px) var(--app-row-px, 16px)',
        gap: 14,
        cursor: 'pointer',
        border: `0.5px solid ${isOverdue ? 'rgba(255,59,48,0.3)' : 'var(--app-card-border, rgba(255,255,255,0.05))'}`,
        boxShadow: isOverdue ? '0 0 0 1px rgba(255,59,48,0.08) inset' : 'var(--app-card-shadow, none)',
        backdropFilter: 'blur(var(--app-glass-blur, 16px))',
        WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 'var(--app-radius-sm, 12px)',
          background: avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
          fontWeight: 700, fontSize: 18, color: '#fff',
          boxShadow: `0 2px 8px ${avatarColor}33`,
        }}>
          {account.name.charAt(0).toUpperCase()}
        </div>
        {/* Overdue indicator dot */}
        {isOverdue && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 12, height: 12, borderRadius: '50%',
            background: '#FF3B30',
            border: '2px solid #1C1C1E',
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {account.name}
        </h3>
        <p style={{
          fontSize: 12, fontWeight: 400,
          color: isOverdue ? 'rgba(255,99,88,0.8)' : 'rgba(235,235,245,0.4)',
          letterSpacing: '-0.01em',
        }}>
          {isOverdue
            ? 'Overdue payment'
            : account.transactions.length > 0
              ? `${account.transactions.length} transaction${account.transactions.length !== 1 ? 's' : ''}`
              : 'No transactions'
          }
        </p>
      </div>

      {/* Right: amount + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          {isSettled ? (
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#30D158',
              background: 'rgba(48,209,88,0.12)',
              padding: '3px 9px', borderRadius: 100,
              letterSpacing: '-0.01em',
            }}>
              Settled
            </span>
          ) : (
            <>
              <p style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '-0.01em',
                color: 'rgba(235,235,245,0.35)', marginBottom: 2,
              }}>
                to collect
              </p>
              <p style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
                color: isOverdue ? '#FF453A' : 'rgba(235,235,245,0.9)',
              }}>
                {settings.currency}{Math.round(account.totalExposure).toLocaleString('en-IN')}
              </p>
            </>
          )}
        </div>
        <ChevronRight size={16} style={{ color: 'rgba(235,235,245,0.2)' }} />
      </div>
    </motion.div>
  );
};

export default AccountRow;
