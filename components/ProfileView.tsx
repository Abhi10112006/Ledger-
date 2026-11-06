
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle, QrCode } from 'lucide-react';
import { Transaction, AppSettings } from '../types';
import { generateStatementPDF } from '../utils/pdfGenerator';
import { generateShareCard, generateReceiptCard, generateLoanCard } from '../utils/imageGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useHaptics } from '../hooks/useHaptics';
import { useBackHandler } from '../utils/backHandler';

// Subcomponents
import ProfileHeader from './profile/ProfileHeader';
import ProfileStats from './profile/ProfileStats';
import HistoryItem from './profile/HistoryItem';
import UPIGeneratorModal from './UPIGeneratorModal';

interface Props {
  account: {
    id: string; // Ledger ID
    name: string;
    transactions: Transaction[];
    totalExposure: number;
    trustScore: number;
  };
  settings: AppSettings;
  activeTheme: any;
  onBack: () => void;
  onGive: () => void;
  onReceive: (txId: string | null) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteRepayment: (txId: string, repId: string) => void;
  onDeleteProfile: () => void;
  onUpdateDueDate: (txId: string) => void;
  onEditRepayment: (txId: string, repId: string) => void;
  onUpdateSettings: (key: keyof AppSettings, value: string) => void;
}

const ProfileView: React.FC<Props> = ({
  account,
  settings,
  activeTheme,
  onBack,
  onGive,
  onReceive,
  onDeleteTransaction,
  onDeleteRepayment,
  onDeleteProfile,
  onUpdateDueDate,
  onEditRepayment,
  onUpdateSettings
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'PROFILE' | 'TRANSACTION' | 'REPAYMENT';
    txId?: string;
    repId?: string;
  } | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);

  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const haptic = useHaptics();

  useBackHandler(isUPIModalOpen, () => {
    setIsUPIModalOpen(false);
  });

  useBackHandler(!!deleteConfirm, () => {
    setDeleteConfirm(null);
  });

  // 1. Flatten History: Combine Loans (Starts) and Repayments into one timeline
  const historyItems = account.transactions.flatMap(tx => {
    const items = [];
    items.push({
      id: tx.id,
      date: new Date(tx.startDate),
      type: 'LOAN',
      amount: tx.principalAmount,
      note: tx.notes || 'Loan Given',
      isCompleted: tx.isCompleted,
      rawTx: tx,
      repId: null
    });
    tx.repayments.forEach(rep => {
      items.push({
        id: tx.id,
        date: new Date(rep.date),
        type: 'PAYMENT',
        amount: rep.amount,
        note: 'Payment Received',
        isCompleted: true,
        rawTx: tx,
        repId: rep.id
      });
    });
    return items;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // 2. Find Next Collection Date
  const activeLoans = account.transactions.filter(t => !t.isCompleted);
  const nextDueTx = activeLoans.length > 0
    ? activeLoans.sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime())[0]
    : null;

  // --- ACTIONS ---

  const handleShareMessage = async (platform: 'sms' | 'whatsapp') => {
    const phoneNumber = account.transactions.find(t => t.friendPhone)?.friendPhone;
    const amountStr = `${settings.currency}${Math.round(account.totalExposure)}`;

    let message = `Hi ${account.name}, please pay your due of ${amountStr}.`;
    let isOverdue = false;
    let diffDays = 0;
    let dueDate: Date | null = null;

    if (nextDueTx) {
      dueDate = new Date(nextDueTx.returnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueCmp = new Date(nextDueTx.returnDate);
      dueCmp.setHours(0, 0, 0, 0);
      const diffTime = dueCmp.getTime() - today.getTime();
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      if (diffDays < 0) {
        isOverdue = true;
        diffDays = Math.abs(diffDays);
        message = `URGENT: Hi ${account.name}, your payment is overdue by ${diffDays} days! Please clear your outstanding balance of ${amountStr}. It was due on ${dateStr}.`;
      } else if (diffDays === 0) {
        message = `Hi ${account.name}, friendly reminder that your payment of ${amountStr} is due TODAY (${dateStr}).`;
      } else {
        message = `Hi ${account.name}, just a friendly reminder. You have ${diffDays} days left to pay your balance of ${amountStr}. Due Date: ${dateStr}.`;
      }
    }

    // 1. WhatsApp: Share IMAGE CARD ONLY (No Text)
    if (platform === 'whatsapp') {
      setIsSharing(true);
      try {
        const imageFile = await generateShareCard(
          settings.userName,
          account.name,
          account.id,
          account.totalExposure,
          settings.currency,
          dueDate,
          isOverdue,
          diffDays,
          message
        );

        if (imageFile) {
          const { downloadOrShare } = await import('../utils/androidFileHandler');
          await downloadOrShare(
            `payment_request_${Date.now()}.png`,
            imageFile,
            'image/png',
            'Payment Request',
            undefined // Pass undefined so no text is attached
          );
        }
      } catch (e) {
        console.error("Image generation failed", e);
      } finally {
        setIsSharing(false);
      }
      return;
    }

    // 2. SMS: Share TEXT ONLY (Direct Intent)
    if (platform === 'sms') {
      const link = phoneNumber
        ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
        : `sms:?body=${encodeURIComponent(message)}`;
      window.location.href = link;
    }
  };

  const handleShareReceipt = async (item: any) => {
    setSharingId(item.repId);

    try {
      const tx = item.rawTx;
      const paymentDate = new Date(item.date);
      const dueDate = new Date(tx.returnDate);

      const p = new Date(paymentDate); p.setHours(0, 0, 0, 0);
      const d = new Date(dueDate); d.setHours(0, 0, 0, 0);

      let timeliness: 'early' | 'ontime' | 'late' = 'ontime';
      let message = "Thanks for the payment!";

      if (p < d) {
        timeliness = 'early';
        message = "Thanks for the early payment! You're amazing. 🌟";
      } else if (p > d) {
        timeliness = 'late';
        const sarcasms = [
          "Finally! I was about to file a missing person report. Thanks.",
          "Look at you, eventually paying up! I'm weeping with joy. 👏",
          "My wallet missed you. Better late than never, I suppose? 💅",
          "I was just about to send the goons. Thanks for saving me the trouble.",
          "Wow, distinct lack of speed. Thanks for finally paying.",
          "It's been 84 years... but thanks."
        ];
        message = sarcasms[Math.floor(Math.random() * sarcasms.length)];
      } else {
        timeliness = 'ontime';
        message = "Received right on time. Thanks! 👍";
      }

      const remaining = Number(account.totalExposure) || 0;

      const imageFile = await generateReceiptCard(
        settings.userName,
        account.name,
        account.id,
        item.amount,
        settings.currency,
        timeliness,
        remaining,
        message
      );

      if (imageFile) {
        const { downloadOrShare } = await import('../utils/androidFileHandler');
        await downloadOrShare(
          `receipt_${Date.now()}.png`,
          imageFile,
          'image/png',
          'Payment Receipt',
          message
        );
      }
    } catch (e) {
      console.error("Receipt generation failed", e);
    } finally {
      setSharingId(null);
    }
  };

  const handleShareLoan = async (item: any) => {
    setSharingId(item.id);

    try {
      const tx = item.rawTx;
      const imageFile = await generateLoanCard(
        settings.userName,
        account.name,
        account.id,
        tx.principalAmount,
        settings.currency,
        tx.startDate,
        tx.returnDate,
        tx.interestRate,
        tx.interestType,
        tx.interestFreeIfPaidByDueDate || false,
        tx.notes || ""
      );

      if (imageFile) {
        const { downloadOrShare } = await import('../utils/androidFileHandler');
        await downloadOrShare(
          `loan_${Date.now()}.png`,
          imageFile,
          'image/png',
          'Loan Agreement',
          `Loan Agreement with ${account.name}`
        );
      }
    } catch (e) {
      console.error("Loan card generation failed", e);
    } finally {
      setSharingId(null);
    }
  };

  const handleSetReminder = async () => {
    if (!nextDueTx) return;

    // Local Notification only — Google Calendar is handled by the date button in ProfileStats
    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        const scheduleDate = new Date(nextDueTx.returnDate);
        scheduleDate.setHours(9, 0, 0, 0); // Schedule for 9:00 AM on due date

        // If date is already past, schedule for 1 minute from now
        const now = new Date();
        if (scheduleDate < now) {
          scheduleDate.setTime(now.getTime() + 60 * 1000);
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Payment Due Today! 💰",
              body: `Collect ${settings.currency}${Math.round(account.totalExposure)} from ${account.name}`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: scheduleDate },
              smallIcon: 'ic_stat_icon_config_sample',
              actionTypeId: "",
              extra: null
            }
          ]
        });

        haptic('success');
        window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
          detail: { message: "Payment reminder scheduled for due date", type: 'success' }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
          detail: { message: "Notification permission denied", type: 'error' }
        }));
      }
    } catch (e) {
      console.error("Notification schedule failed", e);
      window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
        detail: { message: "Failed to set reminder", type: 'error' }
      }));
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    haptic('heavy');
    if (deleteConfirm.type === 'PROFILE' && onDeleteProfile) {
      onDeleteProfile();
    } else if (deleteConfirm.type === 'TRANSACTION' && deleteConfirm.txId && onDeleteTransaction) {
      onDeleteTransaction(deleteConfirm.txId);
    } else if (deleteConfirm.type === 'REPAYMENT' && deleteConfirm.txId && deleteConfirm.repId && onDeleteRepayment) {
      onDeleteRepayment(deleteConfirm.txId, deleteConfirm.repId);
    }
    setDeleteConfirm(null);
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--app-bg, #000)', display: 'flex', flexDirection: 'column' }}>
      {/* Background Textures */}
      {settings.background === 'nebula' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-10%', right: '-10%', width: '70vw', height: '70vw', maxWidth: 400, maxHeight: 400,
            borderRadius: '50%', background: `radial-gradient(circle, ${activeTheme.hex} 0%, transparent 70%)`,
            opacity: (settings.glowIntensity ?? 0.5) * 0.22, filter: 'blur(60px)',
          }} />
        </div>
      )}

      {settings.background === 'grid' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px', opacity: 0.6,
        }} />
      )}

      {settings.enableGrain && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9998,
          opacity: 0.05, mixBlendMode: 'screen',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} />
      )}

      <motion.div
        className="flex-1 flex flex-col w-full max-w-4xl mx-auto relative h-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* HEADER */}
        <motion.div variants={itemVariants}>
          <ProfileHeader
            onBack={onBack}
            onDelete={() => setDeleteConfirm({ type: 'PROFILE' })}
            onShareSMS={() => handleShareMessage('sms')}
            onShareWA={() => handleShareMessage('whatsapp')}
            onGeneratePDF={() => generateStatementPDF(account.id, account.name, account.transactions, settings)}
            isSharing={isSharing}
            activeTheme={activeTheme}
          />
        </motion.div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-32 scrollbar-hide px-6" style={{ overscrollBehavior: 'none' }}>

          {/* STATS */}
          <motion.div variants={itemVariants}>
            <ProfileStats
              account={account}
              settings={settings}
              activeTheme={activeTheme}
              nextDueTx={nextDueTx}
              onSetReminder={handleSetReminder}
              onOpenUPI={() => setIsUPIModalOpen(true)}
            />
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px 0' }}>
            <div style={{ height: 0.5, background: 'rgba(255, 255, 255, 0.08)', flex: 1 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235, 235, 245, 0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Activity History
            </span>
            <div style={{ height: 0.5, background: 'rgba(255, 255, 255, 0.08)', flex: 1 }} />
          </motion.div>

          {/* HISTORY LIST */}
          <motion.div variants={containerVariants} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {historyItems.map((item, idx) => {
                const itemKey = `${item.id}-${item.repId || 'main'}`;
                return (
                  <motion.div key={itemKey} variants={itemVariants} id={idx === 0 ? 'tour-history-item' : undefined}>
                    <HistoryItem
                      item={item}
                      isActive={activeItemKey === itemKey}
                      onToggle={() => setActiveItemKey(activeItemKey === itemKey ? null : itemKey)}
                      settings={settings}
                      sharingId={sharingId}
                      onShareReceipt={handleShareReceipt}
                      onShareLoan={handleShareLoan}
                      onUpdateDueDate={onUpdateDueDate}
                      onEditRepayment={onEditRepayment}
                      onDelete={(type, id, repId) => setDeleteConfirm({ type, txId: id, repId })}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {historyItems.length === 0 && (
            <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(235, 235, 245, 0.35)', fontSize: 14 }}>
              No transactions recorded yet
            </motion.div>
          )}
        </div>

        {/* BOTTOM ACTIONS */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          display: 'flex', gap: 12,
          background: 'linear-gradient(to top, rgba(0,0,0,0.98) 60%, transparent)',
          zIndex: 30,
        }}>
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptic('light'); onGive(); }}
            style={{
              flex: 1, height: 54, borderRadius: 16,
              background: 'rgba(255,59,48,0.15)',
              border: '0.5px solid rgba(255,59,48,0.25)',
              color: '#FF453A',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
              fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            <ArrowUpRight size={20} /> Give Loan
          </motion.button>

          <motion.button
            id="tour-repayment-button"
            variants={itemVariants}
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptic('medium'); onReceive(null); }}
            disabled={account.totalExposure <= 0}
            style={{
              flex: 1, height: 54, borderRadius: 16,
              background: account.totalExposure <= 0 ? 'rgba(120,120,128,0.12)' : 'rgba(48,209,88,0.15)',
              border: `0.5px solid ${account.totalExposure <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(48,209,88,0.25)'}`,
              color: account.totalExposure <= 0 ? 'rgba(235,235,245,0.3)' : '#30D158',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
              fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: account.totalExposure <= 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ArrowDownLeft size={20} /> Receive
          </motion.button>
        </div>
      </motion.div>

      {/* UPI Generator Modal */}
      <UPIGeneratorModal
        isOpen={isUPIModalOpen}
        onClose={() => setIsUPIModalOpen(false)}
        defaultAmount={account.totalExposure}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        activeTheme={activeTheme}
      />

      {/* DELETE CONFIRMATION OVERLAY (iOS Action Sheet / Alert) */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#1C1C1E',
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 24,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
              padding: 24,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: 'rgba(255, 69, 58, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF453A',
                marginBottom: 14,
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {deleteConfirm.type === 'PROFILE' ? 'Delete Profile?' : 'Delete Record?'}
            </h3>

            <p style={{ margin: '8px 0 20px 0', fontSize: 13, color: 'rgba(235, 235, 245, 0.6)', lineHeight: 1.4 }}>
              {deleteConfirm.type === 'PROFILE'
                ? "This will permanently delete this contact and all associated loan and payment records."
                : "This transaction record will be removed permanently."}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmDelete}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 14,
                  background: '#FF453A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeleteConfirm(null)}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(235, 235, 245, 0.85)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileView;
