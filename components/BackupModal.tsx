import React, { useState, useRef } from 'react';
import {
  X, ShieldCheck, HardDriveDownload, FileSpreadsheet, Lock,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, FileCheck,
  FolderUp, Sparkles, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, AppSettings } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { exportEncryptedBackup, importBackupFile } from '../utils/cryptoBackup';
import { exportExcelDossier } from '../utils/excelGenerator';
import { formatAppTitle } from '../utils/branding';

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
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const haptic = useHaptics();

  const isOled = settings.baseColor === 'oled';
  const sheetBg = isOled ? '#000000' : '#141416';
  const cardBg = isOled ? 'rgba(255, 255, 255, 0.05)' : '#1C1C1E';
  const cardBorder = isOled
    ? '0.5px solid rgba(255, 255, 255, 0.1)'
    : '0.5px solid rgba(255, 255, 255, 0.07)';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(
      new CustomEvent('abhi-ledger-toast', { detail: { message, type } })
    );
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ─── OPTION A: SAVE ENCRYPTED BACKUP ───
  const handleSaveEncryptedBackup = async () => {
    haptic('medium');
    setIsExportingBak(true);
    try {
      const result = await exportEncryptedBackup(transactions, settings);
      if (result.success) {
        haptic('success');
        showToast(`Encrypted backup saved: ${result.fileName}`);
      } else {
        haptic('error');
        showToast(result.error || 'Failed to create encrypted backup.', 'error');
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
    haptic('light');
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
      showToast(`Restored ${restoredTx.length} transaction records successfully!`);
      onRestoreSuccess(restoredTx, restoredSettings);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      haptic('error');
      showToast(err?.message || 'Failed to decrypt or restore backup file.', 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── OPTION C: DOWNLOAD PRINT-READY EXCEL ───
  const handleExportExcel = async () => {
    haptic('medium');
    setIsExportingXlsx(true);
    try {
      const result = await exportExcelDossier(transactions, settings);
      if (result.success) {
        haptic('success');
        showToast(`Print-ready Excel dossier exported!`);
      } else {
        haptic('error');
        showToast(result.error || 'Failed to export Excel dossier.', 'error');
      }
    } catch (err: any) {
      haptic('error');
      showToast(err?.message || 'Error generating Excel.', 'error');
    } finally {
      setIsExportingXlsx(false);
    }
  };

  if (!isOpen) return null;

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
          onClick={() => {
            if (!isExportingBak && !isRestoring && !isExportingXlsx) {
              onClose();
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />

        {/* Sheet / Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            maxHeight: '94vh',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            background: sheetBg,
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
          className="scrollbar-hide"
        >
          {/* Top ambient color glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: 160,
              background: `radial-gradient(ellipse at top center, ${activeTheme.hex}22 0%, transparent 75%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Grab Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 6, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 38, height: 4.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.22)' }} />
          </div>

          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 24px 8px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#FFFFFF',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  }}
                >
                  Backup & Export Vault
                </h2>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '0.5px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Lock size={10} />
                  Native Safe
                </div>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  color: 'rgba(235, 235, 245, 0.55)',
                  letterSpacing: '-0.01em',
                }}
              >
                Secure your ledger data with native encryption or audit reports
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(235, 235, 245, 0.7)',
                flexShrink: 0,
              }}
            >
              <X size={17} />
            </motion.button>
          </div>

          {/* Feedback Banner if active */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                margin: '12px 24px 4px',
                padding: '10px 14px',
                borderRadius: 14,
                background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `0.5px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
              )}
              <span style={{ flex: 1 }}>{feedback.message}</span>
            </motion.div>
          )}

          {/* Hidden File Input for Restore */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".ledgerbak,.json"
            style={{ display: 'none' }}
          />

          {/* 3 Main Action Cards */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* ─── CARD A: SAVE ENCRYPTED BACKUP ─── */}
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={!isExportingBak ? handleSaveEncryptedBackup : undefined}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 20,
                padding: '18px 18px',
                cursor: isExportingBak ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '0.5px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Save Encrypted Backup
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399',
                        }}
                      >
                        .LEDGERBAK
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      AES-256-GCM Native Encryption
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(235, 235, 245, 0.6)',
                  }}
                >
                  {isExportingBak ? (
                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: 'rgba(235, 235, 245, 0.65)',
                }}
              >
                Encrypts all {transactions.length} active counterparties, loans, installments, and settings.
                The encrypted payload is sealed with native Android hardware algorithms so only this Ledger app can decipher it.
              </p>

              {/* Action Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.16)',
                    border: '0.5px solid rgba(16, 185, 129, 0.35)',
                    color: '#34D399',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Lock size={12} />
                  <span>Generate Encrypted Vault File</span>
                </div>
              </div>
            </motion.div>

            {/* ─── CARD B: RESTORE BACKUP ─── */}
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={!isRestoring ? handleTriggerFileSelect : undefined}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 20,
                padding: '18px 18px',
                cursor: isRestoring ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '0.5px solid rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#A78BFA',
                      flexShrink: 0,
                    }}
                  >
                    <FolderUp size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Restore From Backup
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#C4B5FD',
                        }}
                      >
                        IMPORT & DECRYPT
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      Supports .ledgerbak & Legacy JSON
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(235, 235, 245, 0.6)',
                  }}
                >
                  {isRestoring ? (
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: 'rgba(235, 235, 245, 0.65)',
                }}
              >
                Seamlessly restore your ledger database on this device or when switching phones.
                The app automatically identifies, authenticates, and decrypts the backup in memory.
              </p>

              {/* Action Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(139, 92, 246, 0.16)',
                    border: '0.5px solid rgba(139, 92, 246, 0.35)',
                    color: '#C4B5FD',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <HardDriveDownload size={12} />
                  <span>Select Backup File to Restore</span>
                </div>
              </div>
            </motion.div>

            {/* ─── CARD C: DOWNLOAD PRINT-READY EXCEL DOSSIER ─── */}
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={!isExportingXlsx ? handleExportExcel : undefined}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 20,
                padding: '18px 18px',
                cursor: isExportingXlsx ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '0.5px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F59E0B',
                      flexShrink: 0,
                    }}
                  >
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Print-Ready Excel Dossier
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#FBBF24',
                        }}
                      >
                        .XLSX WORKBOOK
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      Executive KPI Summary & Full Ledger
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(235, 235, 245, 0.6)',
                  }}
                >
                  {isExportingXlsx ? (
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: 'rgba(235, 235, 245, 0.65)',
                }}
              >
                Comprehensive financial workbook containing the official app logo, executive KPI cards,
                counterparty totals, and an audit-level detailed ledger. Pre-formatted with A4 landscape page setup for crisp physical printouts.
              </p>

              {/* Action Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.16)',
                    border: '0.5px solid rgba(245, 158, 11, 0.35)',
                    color: '#FBBF24',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Printer size={12} />
                  <span>Download Print-Ready .XLSX</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '4px 24px 8px',
              textAlign: 'center',
              fontSize: 11.5,
              color: 'rgba(235, 235, 245, 0.4)',
              letterSpacing: '-0.01em',
            }}
          >
            All operations run 100% offline on your device with zero cloud tracking.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
