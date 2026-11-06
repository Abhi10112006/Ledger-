import React, { useState, useRef, useEffect } from 'react';
import {
  X, ShieldCheck, FileSpreadsheet, Lock,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, FolderUp,
  Download, Clock, Check, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, AppSettings } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { exportEncryptedBackup, importBackupFile } from '../utils/cryptoBackup';
import { exportExcelDossier } from '../utils/excelGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: AppSettings;
  activeTheme: any;
  onRestoreSuccess: (transactions: Transaction[], restoredSettings?: AppSettings) => void;
}

export const BackupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  settings,
  activeTheme,
  onRestoreSuccess,
}) => {
  const [isExportingBak, setIsExportingBak] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const haptic = useHaptics();

  // Load last backup timestamp from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ledger_last_backup_time');
      if (stored) setLastBackupTime(stored);
    } catch {
      // Ignore storage errors
    }
  }, [isOpen]);

  const isOled = settings.baseColor === 'oled';
  const sheetBg = isOled ? '#000000' : '#141416';
  const cardBg = isOled ? 'rgba(255, 255, 255, 0.04)' : '#1C1C1E';
  const cardBorder = isOled
    ? '0.5px solid rgba(255, 255, 255, 0.09)'
    : '0.5px solid rgba(255, 255, 255, 0.07)';

  const cardRadius = settings.cornerRadius === 'sharp' ? 10 : settings.cornerRadius === 'round' ? 18 : 24;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(
      new CustomEvent('abhi-ledger-toast', { detail: { message, type } })
    );
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3800);
  };

  // Format the last backup time for user-friendly display
  const formatFriendlyTime = (iso: string | null) => {
    if (!iso) return 'Not backed up yet';
    try {
      const date = new Date(iso);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return 'Recently';
    }
  };

  // ─── OPTION A: SAVE SECURE BACKUP ───
  const handleSaveEncryptedBackup = async () => {
    if (isExportingBak || isRestoring || isExportingXlsx) return;
    haptic('medium');
    setIsExportingBak(true);
    try {
      const result = await exportEncryptedBackup(transactions, settings);
      if (result.success) {
        haptic('success');
        const nowIso = new Date().toISOString();
        try {
          localStorage.setItem('ledger_last_backup_time', nowIso);
          setLastBackupTime(nowIso);
        } catch {}
        showToast('Backup saved securely to your device!');
      } else {
        haptic('error');
        showToast(result.error || 'Failed to create backup.', 'error');
      }
    } catch (err: any) {
      haptic('error');
      showToast(err?.message || 'Error creating backup.', 'error');
    } finally {
      setIsExportingBak(false);
    }
  };

  // ─── OPTION B: RESTORE FROM BACKUP ───
  const handleTriggerFileSelect = () => {
    if (isExportingBak || isRestoring || isExportingXlsx) return;
    haptic('selection');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    haptic('medium');
    setIsRestoring(true);
    try {
      const { transactions: restoredTx, settings: restoredSettings } = await importBackupFile(file);
      haptic('success');
      showToast(`Restored ${restoredTx.length} records successfully!`);
      onRestoreSuccess(restoredTx, restoredSettings);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      haptic('error');
      showToast(err?.message || 'Could not restore backup. Please verify the file.', 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── OPTION C: DOWNLOAD PRINT-READY EXCEL ───
  const handleExportExcel = async () => {
    if (isExportingBak || isRestoring || isExportingXlsx) return;
    haptic('medium');
    setIsExportingXlsx(true);
    try {
      const result = await exportExcelDossier(transactions, settings);
      if (result.success) {
        haptic('success');
        showToast('Spreadsheet exported successfully!');
      } else {
        haptic('error');
        showToast(result.error || 'Failed to export spreadsheet.', 'error');
      }
    } catch (err: any) {
      haptic('error');
      showToast(err?.message || 'Error generating spreadsheet.', 'error');
    } finally {
      setIsExportingXlsx(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = isExportingBak || isRestoring || isExportingXlsx;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3500,
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
          transition={{ duration: 0.25 }}
          onClick={() => {
            if (!isBusy) onClose();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Sheet / Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            maxHeight: '92vh',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            background: sheetBg,
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -16px 50px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", -apple-system-subheadline, Inter, sans-serif',
          }}
          className="scrollbar-hide"
        >
          {/* Subtle top ambient glow from theme */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: 180,
              background: `radial-gradient(ellipse at top center, ${activeTheme.hex}25 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Grab Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 6, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.25)' }} />
          </div>

          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 24px 14px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                }}
              >
                Vault & Backups
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.55)',
                  letterSpacing: '-0.01em',
                }}
              >
                Protect, restore, or export your financial records
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (!isBusy) {
                  haptic('light');
                  onClose();
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(235, 235, 245, 0.75)',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Feedback Banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                style={{
                  margin: '0 20px 14px',
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                  border: `0.5px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}50`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 500,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                )}
                <span style={{ flex: 1, lineHeight: 1.35 }}>{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden File Input for Restore */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="*/*,.ledgerbak,.json,.bak,.abhibak,application/json,application/octet-stream"
            style={{ display: 'none' }}
          />

          <div
            style={{
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* ─── HERO VAULT STATUS CARD ─── */}
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: cardRadius,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Vault Shield Emblem */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${activeTheme.hex}30 0%, ${activeTheme.hex}10 100%)`,
                  border: `1px solid ${activeTheme.hex}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTheme.hex,
                  flexShrink: 0,
                  boxShadow: `0 8px 20px -4px ${activeTheme.hex}30`,
                }}
              >
                <ShieldCheck size={28} />
              </div>

              {/* Status Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#10B981',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Encrypted & Private
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    marginTop: 3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {transactions.length} Active {transactions.length === 1 ? 'Record' : 'Records'}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(235, 235, 245, 0.45)',
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Clock size={11} style={{ opacity: 0.7 }} />
                  <span>Last backup: {formatFriendlyTime(lastBackupTime)}</span>
                </div>
              </div>
            </div>

            {/* ─── ACTION 1: CREATE SECURE BACKUP ─── */}
            <motion.div
              whileTap={{ scale: 0.985 }}
              onClick={handleSaveEncryptedBackup}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: cardRadius,
                padding: '16px 18px',
                cursor: isBusy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Apple-style squircle icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.12) 100%)',
                  border: '0.5px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399',
                  flexShrink: 0,
                }}
              >
                <Download size={22} />
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Back Up Now
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(235, 235, 245, 0.55)',
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  Save a protected copy of all accounts & settings
                </div>
              </div>

              {/* Action Pill / Spinner */}
              <div
                style={{
                  padding: '7px 14px',
                  borderRadius: 100,
                  background: isExportingBak
                    ? 'rgba(16, 185, 129, 0.12)'
                    : `linear-gradient(135deg, ${activeTheme.hex} 0%, ${activeTheme.hex}EE 100%)`,
                  color: isExportingBak ? '#34D399' : '#000000',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  boxShadow: isExportingBak ? 'none' : `0 4px 14px -3px ${activeTheme.hex}60`,
                }}
              >
                {isExportingBak ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-emerald-400" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Back Up</span>
                )}
              </div>
            </motion.div>

            {/* ─── ACTION 2: RESTORE FROM BACKUP ─── */}
            <motion.div
              whileTap={{ scale: 0.985 }}
              onClick={handleTriggerFileSelect}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: cardRadius,
                padding: '16px 18px',
                cursor: isBusy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Apple-style squircle icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.12) 100%)',
                  border: '0.5px solid rgba(139, 92, 246, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#A78BFA',
                  flexShrink: 0,
                }}
              >
                <FolderUp size={22} />
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Restore from Backup
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(235, 235, 245, 0.55)',
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  Import saved records from this phone or a new device
                </div>
              </div>

              {/* Action Pill / Spinner */}
              <div
                style={{
                  padding: '7px 14px',
                  borderRadius: 100,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '0.5px solid rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                {isRestoring ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-purple-400" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <span>Choose File</span>
                    <ChevronRight size={14} style={{ opacity: 0.6 }} />
                  </>
                )}
              </div>
            </motion.div>

            {/* ─── ACTION 3: EXPORT EXCEL SPREADSHEET ─── */}
            <motion.div
              whileTap={{ scale: 0.985 }}
              onClick={handleExportExcel}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: cardRadius,
                padding: '16px 18px',
                cursor: isBusy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Apple-style squircle icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)',
                  border: '0.5px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24',
                  flexShrink: 0,
                }}
              >
                <FileSpreadsheet size={22} />
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Export to Excel
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(235, 235, 245, 0.55)',
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  Generate a clean, printable ledger spreadsheet (.xlsx)
                </div>
              </div>

              {/* Action Pill / Spinner */}
              <div
                style={{
                  padding: '7px 14px',
                  borderRadius: 100,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '0.5px solid rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                {isExportingXlsx ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <span>Export</span>
                )}
              </div>
            </motion.div>

            {/* ─── REASSURING PRIVACY & SECURITY NOTE ─── */}
            <div
              style={{
                marginTop: 6,
                padding: '12px 16px',
                borderRadius: cardRadius - 4,
                background: 'rgba(255, 255, 255, 0.025)',
                border: '0.5px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.65)',
                  flexShrink: 0,
                }}
              >
                <Lock size={14} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  color: 'rgba(235, 235, 245, 0.45)',
                  letterSpacing: '-0.01em',
                }}
              >
                <strong style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>100% On-Device Privacy:</strong> All your financial data is encrypted and saved directly to your phone. Nothing is ever sent to any remote server or cloud.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
