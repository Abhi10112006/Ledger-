import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Phone, Check, RefreshCw, UserPlus, Sparkles, Hash } from 'lucide-react';
import { fetchDeviceContactsList, DeviceContact } from '../utils/contacts';
import { triggerHaptic } from '../hooks/useHaptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: { name: string; phone: string }) => void;
  existingAccounts?: Array<{ id: string; name: string }>;
  activeTheme?: any;
}

// Modern fintech gradient avatars
const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-blue-500 to-indigo-700',
  'from-violet-500 to-purple-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-blue-700',
  'from-fuchsia-500 to-rose-700',
  'from-teal-500 to-emerald-700'
];

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || '??').toUpperCase();
};

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

/**
 * Intelligently separates an input query into name and phone number.
 * - If input is purely or predominantly phone digits (e.g. "9876543210", "+91 98765-43210"), sets phone and leaves name blank.
 * - If input contains both name and phone (e.g. "Rohan 9876543210"), parses both out.
 * - If input is letters/text, sets name and leaves phone blank.
 */
export const parseCustomContactInput = (input: string): { name: string; phone: string; isPhoneOnly: boolean } => {
  const raw = input.trim();
  if (!raw) return { name: '', phone: '', isPhoneOnly: false };

  // 1. Check for combined Name + Phone number (e.g., "Rohan 9876543210" or "+919876543210 Rahul")
  const phoneRegex = /(\+?[0-9][0-9\s\-()]{6,}[0-9])/;
  const match = raw.match(phoneRegex);

  if (match) {
    const detectedPhone = match[0].trim();
    const remainingText = raw
      .replace(detectedPhone, '')
      .replace(/^[-–—:,/]+|[-–—:,/]+$/g, '')
      .trim();

    if (remainingText.length > 0) {
      return { name: remainingText, phone: detectedPhone, isPhoneOnly: false };
    }
    // Only phone was present in the match
    return { name: '', phone: detectedPhone, isPhoneOnly: true };
  }

  // 2. Check if the string is purely digits and phone formatting symbols (+, -, space, parens)
  const digitsOnly = raw.replace(/\D/g, '');
  const nonPhoneChars = raw.replace(/[0-9\s+\-()]/g, '');

  if (digitsOnly.length >= 6 && nonPhoneChars.length === 0) {
    return { name: '', phone: raw, isPhoneOnly: true };
  }

  // 3. Otherwise treat as a Name
  return { name: raw, phone: '', isPhoneOnly: false };
};

export const ContactPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelect,
  existingAccounts = [],
  activeTheme
}) => {
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const themeHex = activeTheme?.hex || '#10b981';

  const loadContacts = async (force = false) => {
    setLoading(true);
    try {
      const list = await fetchDeviceContactsList(force);
      setContacts(list);
    } catch (e) {
      console.error('Failed to load contacts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedId(null);
      loadContacts(false);
      // Auto-focus search input with small delay for smooth mount transition
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const existingNameSet = useMemo(() => {
    const s = new Set<string>();
    existingAccounts.forEach(a => s.add(a.name.toLowerCase().trim()));
    return s;
  }, [existingAccounts]);

  // Robust Search: Matches Name, Phone raw string, and Normalized Digit string
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;

    const qDigits = searchQuery.replace(/\D/g, '');

    return contacts.filter(c => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const phoneDigits = (c.phone || '').replace(/\D/g, '');

      // 1. Name substring match
      if (name.includes(q)) return true;

      // 2. Raw phone string match
      if (phone.includes(q)) return true;

      // 3. Normalized digits match (e.g. typing "987654" matches "+91 (987) 654-3210")
      if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) return true;

      return false;
    });
  }, [contacts, searchQuery]);

  const parsedCustom = useMemo(() => {
    return parseCustomContactInput(searchQuery);
  }, [searchQuery]);

  const handleSelectContact = (contact: DeviceContact) => {
    triggerHaptic('medium');
    setSelectedId(contact.id);
    setTimeout(() => {
      onSelect({ name: contact.name, phone: contact.phone });
      onClose();
    }, 180);
  };

  const handleAddCustom = () => {
    if (!searchQuery.trim()) return;
    triggerHaptic('light');

    const parsed = parseCustomContactInput(searchQuery);
    onSelect({
      name: parsed.name,
      phone: parsed.phone
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3600] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          }}
          className="relative w-full max-w-lg h-[88vh] sm:h-[680px] bg-[#121214] border border-white/10 rounded-t-[30px] sm:rounded-[30px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
        >
          {/* Top Drag Handle for Mobile */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Top Bar Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Choose Contact</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {contacts.length} Available
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Select from your phone or type to add</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { triggerHaptic('light'); loadContacts(true); }}
                disabled={loading}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                title="Refresh contacts from phone"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
              </button>

              <button
                onClick={() => { triggerHaptic('light'); onClose(); }}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="p-3.5 px-4 border-b border-white/5 bg-zinc-900/60">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or phone number..."
                className="w-full bg-black/40 border border-white/10 text-white placeholder-zinc-500 rounded-xl pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white active:scale-90 z-10"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Contact List with Generous Bottom Padding */}
          <div
            className="flex-1 overflow-y-auto px-3.5 py-2 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-zinc-800"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 84px)',
            }}
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400 py-20">
                <RefreshCw size={28} className="animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Syncing contacts from phone...</span>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact, idx) => {
                const isSelected = selectedId === contact.id;
                const isInLedger = existingNameSet.has((contact.name || '').toLowerCase().trim());
                const gradient = getGradientForName(contact.name || 'Unknown');

                return (
                  <motion.div
                    key={contact.id || `${contact.name}_${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.2) }}
                    onClick={() => handleSelectContact(contact)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.985] ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 border border-white/15`}>
                        {getInitials(contact.name)}
                      </div>

                      {/* Contact Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate tracking-tight">
                            {contact.name}
                          </h4>
                          {isInLedger && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              IN LEDGER
                            </span>
                          )}
                        </div>

                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                            <Phone size={11} className="text-zinc-500 shrink-0" />
                            <span className="font-mono truncate">{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div className="pl-3 shrink-0">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white">
                          <UserPlus size={13} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 py-14">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 mb-3 shadow-lg">
                  {parsedCustom.isPhoneOnly ? <Phone size={24} /> : <User size={24} />}
                </div>
                <h4 className="text-base font-bold text-white mb-1">No contacts match</h4>
                <p className="text-xs text-zinc-400 max-w-xs mb-5">
                  {searchQuery
                    ? `No contacts found for "${searchQuery}". Tap below to use it directly in your deal.`
                    : 'No device contacts could be found.'}
                </p>

                {searchQuery.trim() && (
                  <button
                    onClick={handleAddCustom}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition"
                  >
                    <Sparkles size={14} />
                    <span>
                      {parsedCustom.name && parsedCustom.phone
                        ? `Use Name "${parsedCustom.name}" & Phone "${parsedCustom.phone}"`
                        : parsedCustom.isPhoneOnly
                        ? `Use "${parsedCustom.phone}" as Phone Number`
                        : `Use "${parsedCustom.name}" as Contact Name`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Custom Bar at Bottom (Intelligent Name/Phone Separator) */}
          {searchQuery.trim() && filteredContacts.length > 0 && (
            <div className="p-3 px-4 bg-[#18181B] border-t border-white/10 flex items-center justify-between gap-3 shadow-xl z-10">
              <div className="min-w-0">
                <span className="text-xs text-zinc-400 block truncate">
                  Don't see who you want?
                </span>
                <span className="text-[11px] text-zinc-500 block truncate">
                  {parsedCustom.isPhoneOnly
                    ? `Detected phone: ${parsedCustom.phone}`
                    : parsedCustom.name && parsedCustom.phone
                    ? `Name: ${parsedCustom.name} • Phone: ${parsedCustom.phone}`
                    : `Detected name: ${parsedCustom.name}`}
                </span>
              </div>

              <button
                onClick={handleAddCustom}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 active:scale-95 transition shrink-0"
              >
                {parsedCustom.isPhoneOnly ? <Phone size={12} /> : <UserPlus size={12} />}
                <span>
                  {parsedCustom.isPhoneOnly
                    ? 'Use as Phone'
                    : parsedCustom.name && parsedCustom.phone
                    ? 'Use Name & Phone'
                    : 'Use as Name'}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
