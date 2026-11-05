import React from 'react';
import { BellRing, QrCode, CalendarDays } from 'lucide-react';
import { Transaction, AppSettings } from '../../types';
import TrustScoreBadge from '../TrustScoreBadge';
import { motion } from 'framer-motion';

interface Props {
  account: {
    id: string;
    name: string;
    trustScore: number;
    totalExposure: number;
    transactions: Transaction[];
  };
  settings: AppSettings;
  activeTheme: any;
  nextDueTx: Transaction | null;
  onSetReminder: () => void;
  onOpenUPI?: () => void;
}

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

const ProfileStats: React.FC<Props> = ({ account, settings, activeTheme, nextDueTx, onSetReminder, onOpenUPI }) => {
  const avatarColor = getAvatarColor(account.name);
  const isOverdue = nextDueTx ? new Date() > new Date(nextDueTx.returnDate) : false;
  const isSettled = account.totalExposure <= 0;

  const getDueDateColor = () => {
    if (!nextDueTx) return 'rgba(235,235,245,0.45)';
    const today = new Date();
    const due = new Date(nextDueTx.returnDate);
    if (today > due) return '#FF453A';
    const diffTime = Math.abs(due.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return '#FF9F0A';
    return '#0A84FF';
  };

  const handleOpenCalendar = () => {
    if (!nextDueTx) return;
    const dateObj = new Date(nextDueTx.returnDate);
    const isoDate = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 8);
    const title = `Collect ${settings.currency}${Math.round(account.totalExposure)} from ${account.name}`;
    const details = `Ledger Reminder: Collection due.\nNotes: ${nextDueTx.notes}`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${isoDate}/${isoDate}&ctz=Asia/Kolkata`;
    window.open(calendarUrl, '_blank');
  };

  return (
    <div style={{ paddingTop: 8, paddingBottom: 20 }}>
      {/* Avatar + Name */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
          fontWeight: 700, fontSize: 32, color: '#fff',
          boxShadow: `0 4px 20px ${avatarColor}44`,
          margin: '0 auto 14px',
        }}>
          {account.name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
          fontWeight: 700, fontSize: 24, letterSpacing: '-0.03em',
          color: '#fff', marginBottom: 6,
        }}>
          {account.name}
        </h2>
        <div style={{
          display: 'inline-block',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          fontSize: 11, fontWeight: 500,
          color: 'rgba(235,235,245,0.4)',
          background: 'rgba(120,120,128,0.15)',
          padding: '3px 10px', borderRadius: 100,
          letterSpacing: '-0.01em', marginBottom: 8,
        }}>
          ID: {account.id}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TrustScoreBadge
            score={account.trustScore}
            friendName={account.name}
            profileId={account.id}
            allTransactions={account.transactions}
            currency={settings.currency}
          />
        </div>
      </div>

      {/* Balance + UPI row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '0 4px' }}>
        {/* Main balance card */}
        <div style={{
          flex: 1,
          background: 'var(--app-card-bg, #1C1C1E)',
          borderRadius: 'var(--app-radius, 16px)',
          padding: '14px 16px',
          border: '0.5px solid var(--app-card-border, rgba(255,255,255,0.06))',
          backdropFilter: 'blur(var(--app-glass-blur, 16px))',
          WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(235,235,245,0.4)', marginBottom: 6 }}>
            To Collect
          </p>
          <p style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
            fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em',
            color: isSettled ? '#30D158' : 'rgba(235,235,245,0.9)',
          }}>
            {isSettled
              ? 'Settled'
              : `${settings.currency}${Math.round(account.totalExposure).toLocaleString('en-IN')}`}
          </p>
        </div>

        {/* UPI button (INR only) */}
        {settings.currency === '₹' && onOpenUPI && (
          <motion.button
            id="tour-upi-button"
            whileTap={{ scale: 0.92 }}
            onClick={onOpenUPI}
            style={{
              width: 72, flexShrink: 0,
              background: 'var(--app-card-bg, #1C1C1E)',
              borderRadius: 'var(--app-radius, 16px)',
              border: `0.5px solid ${activeTheme.hex}30`,
              backdropFilter: 'blur(var(--app-glass-blur, 16px))',
              WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <QrCode size={22} style={{ color: activeTheme.hex }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(235,235,245,0.5)' }}>UPI</span>
          </motion.button>
        )}
      </div>

      {/* Next due date card */}
      {nextDueTx && (
        <div style={{
          display: 'flex',
          background: 'var(--app-card-bg, #1C1C1E)',
          borderRadius: 'var(--app-radius-sm, 14px)',
          border: `0.5px solid ${isOverdue ? 'rgba(255,59,48,0.2)' : 'var(--app-card-border, rgba(255,255,255,0.06))'}`,
          backdropFilter: 'blur(var(--app-glass-blur, 16px))',
          WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
          overflow: 'hidden',
          margin: '0 4px',
        }}>
          {/* Calendar zone */}
          <button
            onClick={handleOpenCalendar}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <CalendarDays size={18} style={{ color: getDueDateColor(), flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(235,235,245,0.4)', marginBottom: 2 }}>
                Due Date
              </p>
              <p style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em',
                color: getDueDateColor(),
              }}>
                {new Date(nextDueTx.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {isOverdue && ' · Overdue'}
              </p>
            </div>
          </button>

          {/* Divider */}
          <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

          {/* Reminder bell */}
          <button
            onClick={onSetReminder}
            style={{
              padding: '12px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BellRing size={20} style={{ color: activeTheme.hex }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileStats;
