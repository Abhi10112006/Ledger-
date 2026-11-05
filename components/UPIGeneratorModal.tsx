import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Share2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { useNetwork } from '../hooks/useNetwork';
import { generateUPIQrCard } from '../utils/imageGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount: number;
  settings: AppSettings;
  onUpdateSettings: (key: keyof AppSettings, value: string) => void;
  activeTheme: any;
}

const UPIGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultAmount,
  settings,
  onUpdateSettings,
}) => {
  const [amount, setAmount] = useState('');
  const [vpa, setVpa] = useState('');
  const [name, setName] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Virtual Keyboard hooks
  const kbAmount = useVirtualKeyboard('number', setAmount);
  const kbVpa = useVirtualKeyboard('email', setVpa);
  const kbName = useVirtualKeyboard('text', setName);

  const { isOnline } = useNetwork();

  useEffect(() => {
    if (isOpen) {
      setAmount(Math.round(defaultAmount).toString());
      setVpa(settings.upiId || '');
      setName(settings.upiName || '');
      setQrUrl(null);
    }
  }, [isOpen, defaultAmount, settings.upiId, settings.upiName]);

  const generateQR = () => {
    if (!vpa || !name) return;

    if (!isOnline) {
      window.dispatchEvent(
        new CustomEvent('abhi-ledger-toast', {
          detail: { message: 'Internet required to generate QR code', type: 'error' },
        })
      );
      return;
    }

    onUpdateSettings('upiId', vpa);
    onUpdateSettings('upiName', name);

    const safeAmount = amount || '0';
    const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${safeAmount}&cu=INR`;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

    setQrUrl(apiUrl);
  };

  const copyVPA = () => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!qrUrl) return;
    setIsSharing(true);

    try {
      const file = await generateUPIQrCard(qrUrl, settings.userName || 'User', amount, vpa);

      if (file) {
        const { downloadOrShare } = await import('../utils/androidFileHandler');
        const blob = new Blob([file], { type: file.type });

        await downloadOrShare(file.name, blob, file.type, 'Payment QR', '');
      }
    } catch (e) {
      console.error('Sharing failed', e);
      window.dispatchEvent(
        new CustomEvent('abhi-ledger-toast', {
          detail: { message: 'Sharing failed. Try again.', type: 'error' },
        })
      );
    } finally {
      setIsSharing(false);
    }
  };

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
              maxWidth: 480,
              background: '#1C1C1E',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTop: '0.5px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.7)',
              padding: '12px 20px 24px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
              maxHeight: '90vh',
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
                marginBottom: 20,
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                Receive via UPI
              </h2>
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

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }} className="scrollbar-hide">
              {!qrUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Banking Name */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: '10px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginBottom: 4,
                      }}
                    >
                      Banking Name
                    </span>
                    <input
                      {...kbName}
                      type="text"
                      placeholder="e.g. Abhinav"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#FFFFFF',
                      }}
                    />
                  </div>

                  {/* UPI ID */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: '10px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginBottom: 4,
                      }}
                    >
                      UPI ID (VPA)
                    </span>
                    <input
                      {...kbVpa}
                      type="text"
                      placeholder="username@bank"
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#FFFFFF',
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'rgba(235, 235, 245, 0.5)',
                        marginBottom: 4,
                      }}
                    >
                      Amount (₹)
                    </span>
                    <input
                      {...kbAmount}
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: '#30D158',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      }}
                    />
                  </div>

                  {!isOnline && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: 'rgba(255, 159, 10, 0.12)',
                        border: '0.5px solid rgba(255, 159, 10, 0.25)',
                      }}
                    >
                      <WifiOff size={18} color="#FF9F0A" />
                      <span style={{ fontSize: 13, color: '#FFD60A' }}>
                        Internet connection required to generate QR code.
                      </span>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={generateQR}
                    disabled={!isOnline || !vpa || !name}
                    style={{
                      marginTop: 6,
                      height: 52,
                      borderRadius: 16,
                      background: !isOnline || !vpa || !name ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF',
                      color: !isOnline || !vpa || !name ? 'rgba(235, 235, 245, 0.3)' : '#000000',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: !isOnline || !vpa || !name ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <QrCode size={18} />
                    <span>Generate QR Code</span>
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Clean White QR Container */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: 18,
                      borderRadius: 24,
                      boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      style={{ width: 200, height: 200, display: 'block', borderRadius: 12 }}
                    />
                  </div>

                  {/* Amount display */}
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#FFFFFF',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      }}
                    >
                      ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.6)', marginTop: 2 }}>
                      Pay to {name}
                    </div>
                  </div>

                  {/* UPI ID Row */}
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        UPI ID
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 2 }}>
                        {vpa}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyVPA}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: 10,
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: copied ? '#30D158' : 'rgba(235, 235, 245, 0.8)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShare}
                      disabled={isSharing}
                      style={{
                        flex: 1,
                        height: 50,
                        borderRadius: 16,
                        background: '#FFFFFF',
                        color: '#000000',
                        border: 'none',
                        fontSize: 15,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: isSharing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSharing ? (
                        <div style={{ width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Share2 size={16} />
                      )}
                      <span>Share QR</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setQrUrl(null)}
                      style={{
                        height: 50,
                        padding: '0 20px',
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'rgba(235, 235, 245, 0.85)',
                        border: 'none',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UPIGeneratorModal;
