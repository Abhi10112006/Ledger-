
import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, ChevronDown, ShieldCheck } from 'lucide-react';
import { ContactPickerModal } from './ContactPickerModal';
import { InterestType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { useKeyboard } from '../contexts/KeyboardContext';
import { useBackHandler } from '../utils/backHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    friendName: string;
    profileId?: string;
    friendPhone?: string;
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
    interestFreeIfPaidByDueDate: boolean;
  }) => void;
  activeTheme: any;
  currency: string;
  initialName?: string;
  initialProfileId?: string;
  existingAccounts?: { id: string; name: string }[];
}

// ─── Shared field-label style ───
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500,
  color: 'rgba(235,235,245,0.45)',
  display: 'block', marginBottom: 6,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
};

// ─── iOS-style input ───
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: 'rgba(120,120,128,0.18)',
  border: '0.5px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '0 14px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  letterSpacing: '-0.01em',
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const DealModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  activeTheme,
  currency,
  initialName = '',
  initialProfileId,
  existingAccounts = []
}) => {
  const [friendName, setFriendName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [friendPhone, setFriendPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<InterestType>('none');
  const [interestFree, setInterestFree] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  useBackHandler(isContactPickerOpen, () => {
    setIsContactPickerOpen(false);
  });

  // Keyboard Hooks
  const kbName = useVirtualKeyboard('text', (val) => {
    if (!initialName) { setFriendName(val); setSelectedProfileId(null); }
  });
  const kbAmount = useVirtualKeyboard('number', setAmount);
  const kbPhone = useVirtualKeyboard('number', setFriendPhone);
  const kbNotes = useVirtualKeyboard('text', setNotes);
  const kbInterest = useVirtualKeyboard('number', setInterestRate);
  const { isVisible: isKeyboardVisible } = useKeyboard();

  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFriendName(initialName);
      setSelectedProfileId(initialProfileId || null);
      setFriendPhone('');
      setStartTime('');
      setInterestFree(false);
      setSearchResults([]);
      setAmount('');
      setShowAdvanced(false);
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialName, initialProfileId]);

  useEffect(() => {
    if (!friendName || selectedProfileId || initialName) { setSearchResults([]); return; }
    const results = existingAccounts
      .filter(acc => acc.name.toLowerCase().includes(friendName.toLowerCase()))
      .slice(0, 3);
    setSearchResults(results);
  }, [friendName, selectedProfileId, initialName, existingAccounts]);

  const selectExisting = (profile: any) => {
    setFriendName(profile.name);
    setSelectedProfileId(profile.id);
    setSearchResults([]);
  };

  /**
   * BUG FIX: Contacts permission + sync
   * 1. Always request permission explicitly before opening the picker.
   * 2. Handle the case where Contacts.requestPermissions isn't supported gracefully.
   * 3. Don't swallow non-cancel errors silently.
   */
  const pickContact = () => {
    setIsContactPickerOpen(true);
  };

  const handleSubmit = () => {
    if (!friendName || !amount) return;
    let finalStartDate = startDate;
    if (startTime) finalStartDate = `${startDate}T${startTime}`;

    onSave({
      friendName,
      profileId: selectedProfileId || undefined,
      friendPhone,
      amount: parseFloat(amount),
      startDate: finalStartDate,
      returnDate: returnDate || new Date(Date.now() + 604800000).toISOString(),
      notes,
      interestRate: parseFloat(interestRate) || 0,
      interestType,
      interestFreeIfPaidByDueDate: interestFree
    });

    setFriendName(''); setSelectedProfileId(null); setFriendPhone(''); setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]); setStartTime('');
    setReturnDate(''); setNotes(''); setInterestRate('0');
    setInterestType('none'); setInterestFree(false); setShowAdvanced(false);
    onClose();
  };

  const isValid = friendName.trim() !== '' && amount !== '' && parseFloat(amount) > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 520,
              background: '#1C1C1E',
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              border: '0.5px solid rgba(255,255,255,0.08)',
              maxHeight: '92vh',
              display: 'flex', flexDirection: 'column',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
              <h2 style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#fff',
              }}>
                New Loan
              </h2>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 100,
                  background: 'rgba(120,120,128,0.2)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} style={{ color: 'rgba(235,235,245,0.7)' }} />
              </motion.button>
            </div>

            {/* Form content */}
            <div
              style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 4 }}
              className="scrollbar-hide"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') handleSubmit();
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Contact name field */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Contact Name</label>
                    {!initialName && (
                      <button
                        type="button"
                        onClick={pickContact}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                          color: activeTheme.hex,
                        }}
                      >
                        <UserPlus size={12} /> From Contacts
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      {...kbName}
                      placeholder="Enter name"
                      value={friendName}
                      onChange={e => {
                        if (!initialName) { setFriendName(e.target.value); setSelectedProfileId(null); }
                      }}
                      onBlur={(e) => {
                        if (kbName.onBlur) kbName.onBlur(e);
                        setTimeout(() => setSearchResults([]), 200);
                      }}
                      style={{
                        ...inputStyle,
                        paddingLeft: selectedProfileId ? 38 : 14,
                        opacity: initialName ? 0.7 : 1,
                        borderColor: selectedProfileId ? `${activeTheme.hex}40` : 'rgba(255,255,255,0.06)',
                      }}
                    />
                    {selectedProfileId && (
                      <Check size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: activeTheme.hex }} />
                    )}
                  </div>
                  {/* Existing contact suggestions */}
                  {searchResults.length > 0 && !initialName && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                      background: '#2C2C2E', borderRadius: 12,
                      border: '0.5px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      zIndex: 20, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 600, color: 'rgba(235,235,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Existing Contacts
                      </div>
                      {searchResults.map((res, i) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => selectExisting(res)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                            borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{res.name}</span>
                          <span style={{ fontSize: 10, color: 'rgba(235,235,245,0.3)', fontFamily: 'monospace' }}>#{res.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label style={labelStyle}>Amount ({currency})</label>
                  <input
                    {...kbAmount}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Reason (optional)</label>
                  <input
                    {...kbNotes}
                    placeholder="e.g. Lunch, Bus ticket, Cash"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Date row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Date Sent</label>
                    <input autoComplete="off" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Due Date</label>
                    <input autoComplete="off" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone (optional)</label>
                  <input
                    {...kbPhone}
                    placeholder="+91 00000 00000"
                    value={friendPhone}
                    onChange={e => setFriendPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(120,120,128,0.1)',
                    borderRadius: 12,
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  <span style={{ fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: 'rgba(235,235,245,0.7)' }}>
                    Interest & Advanced
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: 'rgba(235,235,245,0.4)',
                      transform: showAdvanced ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {/* Advanced section */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                        {/* Interest row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={labelStyle}>Interest (%)</label>
                            <input {...kbInterest} value={interestRate} onChange={e => setInterestRate(e.target.value)} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Cycle</label>
                            <select
                              value={interestType}
                              onChange={e => setInterestType(e.target.value as InterestType)}
                              style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
                            >
                              <option value="none">Fixed (One Time)</option>
                              <option value="daily">Daily</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                        </div>

                        {/* Time */}
                        <div>
                          <label style={labelStyle}>Time (optional)</label>
                          <input autoComplete="off" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                        </div>

                        {/* Interest free toggle */}
                        <div
                          onClick={() => setInterestFree(!interestFree)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                            background: interestFree ? `${activeTheme.hex}18` : 'rgba(120,120,128,0.1)',
                            border: `0.5px solid ${interestFree ? `${activeTheme.hex}35` : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${interestFree ? activeTheme.hex : 'rgba(235,235,245,0.3)'}`,
                            background: interestFree ? activeTheme.hex : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {interestFree && <ShieldCheck size={13} style={{ color: '#000' }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 500, color: interestFree ? activeTheme.hex : 'rgba(235,235,245,0.8)' }}>
                              No interest if paid on time
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Keyboard spacer */}
            <div style={{ height: isKeyboardVisible ? 280 : 0, transition: 'height 0.3s ease', flexShrink: 0 }} />

            {/* Submit button */}
            <div style={{ padding: '12px 20px' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                style={{
                  width: '100%', height: 54, borderRadius: 16,
                  background: isValid ? activeTheme.hex : 'rgba(120,120,128,0.2)',
                  color: isValid ? '#000' : 'rgba(235,235,245,0.3)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
                  fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
                  border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                Confirm Loan
              </motion.button>
            </div>
          </motion.div>

          {/* Premium Animated In-App Contact Picker */}
          <ContactPickerModal
            isOpen={isContactPickerOpen}
            onClose={() => setIsContactPickerOpen(false)}
            onSelect={(contact) => {
              setFriendName(contact.name);
              if (contact.phone) setFriendPhone(contact.phone);
              setSelectedProfileId(null);
            }}
            existingAccounts={existingAccounts}
            activeTheme={activeTheme}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default DealModal;
