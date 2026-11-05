import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Phone, Check, RefreshCw, UserPlus, Sparkles } from 'lucide-react';
import { fetchDeviceContactsList, DeviceContact } from '../utils/contacts';
import { triggerHaptic } from '../hooks/useHaptics';
import { useDebounce } from '../hooks/useDebounce';

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
 * Intelligent helper to highlight matching search characters
 */
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmed = query.trim();
  if (!trimmed || !text) return <span>{text}</span>;

  const textLower = text.toLowerCase();
  const queryLower = trimmed.toLowerCase();
  const index = textLower.indexOf(queryLower);

  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <span>
      {before}
      <span className="text-emerald-400 font-bold bg-emerald-500/15 rounded px-0.5">{match}</span>
      {after}
    </span>
  );
};

/**
 * Fast & Error-Free Search & Relevance Ranking Engine
 * Sorts contacts by highest relevance:
 *  1. Exact Name match (1000 pts)
 *  2. Name starts with query prefix (800 pts)
 *  3. Word boundary starts with query (e.g. "Sharma" in "Rahul Sharma") (650 pts)
 *  4. Exact phone digits match (950 pts)
 *  5. Phone ends with digits (dialer suffix search e.g. last 4-6 digits) (750 pts)
 *  6. Phone starts with digits (700 pts)
 *  7. Name substring match (400 pts)
 *  8. Phone substring match (450 pts)
 *  Tie-breaker: Alphabetical order A-Z
 */
export const searchAndSortContacts = (
  contacts: DeviceContact[],
  query: string
): DeviceContact[] => {
  const trimmed = query.trim();
  if (!trimmed) {
    return contacts;
  }

  const qLower = trimmed.toLowerCase();
  const qCleanDigits = trimmed.replace(/\D/g, '');
  const isDigitQuery = qCleanDigits.length > 0;

  const scored: Array<{ contact: DeviceContact; score: number }> = [];

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const name = (c.name || '').trim();
    const nameLower = name.toLowerCase();
    const phone = (c.phone || '').trim();
    const phoneDigits = phone.replace(/\D/g, '');

    let score = 0;

    // 1. Name exact match
    if (nameLower === qLower) {
      score = 1000;
    }
    // 2. Name starts-with match
    else if (nameLower.startsWith(qLower)) {
      score = 800 - Math.min(nameLower.length - qLower.length, 100);
    }
    // 3. Word boundary starts-with (e.g., surname match)
    else {
      const words = nameLower.split(/\s+/);
      let wordMatched = false;
      for (const w of words) {
        if (w.startsWith(qLower)) {
          score = 650 - Math.min(w.length - qLower.length, 100);
          wordMatched = true;
          break;
        }
      }
      // 4. Name substring match
      if (!wordMatched && nameLower.includes(qLower)) {
        score = 400 - Math.min(nameLower.indexOf(qLower), 100);
      }
    }

    // 5. Phone number search
    if (isDigitQuery) {
      if (phoneDigits === qCleanDigits) {
        score = Math.max(score, 950);
      } else if (phoneDigits.endsWith(qCleanDigits)) {
        // High priority dialer suffix search (e.g. typing last digits)
        score = Math.max(score, 750 + Math.min(qCleanDigits.length * 10, 100));
      } else if (phoneDigits.startsWith(qCleanDigits)) {
        score = Math.max(score, 700 + Math.min(qCleanDigits.length * 10, 100));
      } else if (phoneDigits.includes(qCleanDigits)) {
        score = Math.max(score, 450);
      }
    } else if (phone.toLowerCase().includes(qLower)) {
      score = Math.max(score, 400);
    }

    if (score > 0) {
      scored.push({ contact: c, score });
    }
  }

  // Sort by score descending; tie-breaker: alphabetical A-Z
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.contact.name.localeCompare(b.contact.name, undefined, { sensitivity: 'base' });
  });

  return scored.map(s => s.contact);
};

/**
 * Intelligently separates an input query into name and phone number.
 */
export const parseCustomContactInput = (input: string): { name: string; phone: string; isPhoneOnly: boolean } => {
  const raw = input.trim();
  if (!raw) return { name: '', phone: '', isPhoneOnly: false };

  // 1. Combined Name + Phone number (e.g. "Rohan 9876543210")
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
    return { name: '', phone: detectedPhone, isPhoneOnly: true };
  }

  // 2. Pure digits and phone formatting symbols (+, -, space, parens)
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(60);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce the search query for 60ms to keep typing 120 FPS responsive without dropping frames
  const debouncedQuery = useDebounce(searchQuery, 60);

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
      setSelectedKey(null);
      setDisplayLimit(60);
      loadContacts(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 120);
    }
  }, [isOpen]);

  // Reset display limit when query changes so first items render instantaneously
  useEffect(() => {
    setDisplayLimit(60);
  }, [debouncedQuery]);

  const existingNameSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < existingAccounts.length; i++) {
      s.add(existingAccounts[i].name.toLowerCase().trim());
    }
    return s;
  }, [existingAccounts]);

  // Filtered and sorted contacts using relevance ranking
  const filteredContacts = useMemo(() => {
    return searchAndSortContacts(contacts, debouncedQuery);
  }, [contacts, debouncedQuery]);

  // Sliced view for buttery 120 FPS scrolling even with 3000+ contacts
  const visibleContacts = useMemo(() => {
    return filteredContacts.slice(0, displayLimit);
  }, [filteredContacts, displayLimit]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 250) {
      setDisplayLimit(prev => Math.min(prev + 40, filteredContacts.length));
    }
  };

  const parsedCustom = useMemo(() => {
    return parseCustomContactInput(searchQuery);
  }, [searchQuery]);

  const handleSelectContact = (contact: DeviceContact, uniqueKey: string) => {
    triggerHaptic('medium');
    setSelectedKey(uniqueKey);
    setTimeout(() => {
      onSelect({ name: contact.name, phone: contact.phone });
      onClose();
    }, 150);
  };

  const handleAddCustom = () => {
    if (!searchQuery.trim()) return;
    triggerHaptic('medium');

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
                  {filteredContacts.length}{filteredContacts.length !== contacts.length ? ` of ${contacts.length}` : ' contacts'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Instant search by name, dialer digits, or phone</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { triggerHaptic('selection'); loadContacts(true); }}
                disabled={loading}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                title="Refresh contacts from phone"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
              </button>

              <button
                onClick={() => { onClose(); }}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search Input Bar with Elevated Prominent Icon */}
          <div className="p-3.5 px-4 border-b border-white/5 bg-zinc-900/60">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10 flex items-center justify-center">
                <Search size={16} strokeWidth={2.2} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or number (e.g. 'Ankur' or '9876')..."
                className="w-full bg-black/40 border border-white/10 text-white placeholder-zinc-500 rounded-xl pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white active:scale-90 z-10 flex items-center justify-center bg-white/10"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Contact List (High-Performance Virtual-like DOM) */}
          <div
            onScroll={handleScroll}
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
            ) : visibleContacts.length > 0 ? (
              visibleContacts.map((contact, idx) => {
                const uniqueKey = `${contact.id || 'c'}_${contact.phone}_${idx}`;
                const isSelected = selectedKey === uniqueKey;
                const isInLedger = existingNameSet.has((contact.name || '').toLowerCase().trim());
                const gradient = getGradientForName(contact.name || 'Unknown');

                return (
                  <div
                    key={uniqueKey}
                    onClick={() => handleSelectContact(contact, uniqueKey)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors active:scale-[0.985] ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40'
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
                            <HighlightMatch text={contact.name} query={debouncedQuery} />
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
                            <span className="font-mono truncate">
                              <HighlightMatch text={contact.phone} query={debouncedQuery} />
                            </span>
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
                  </div>
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
