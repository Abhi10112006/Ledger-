import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Phone, Check, RefreshCw, UserPlus, Sparkles } from 'lucide-react';
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
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
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
    }
  }, [isOpen]);

  const existingNameSet = useMemo(() => {
    const s = new Set<string>();
    existingAccounts.forEach(a => s.add(a.name.toLowerCase().trim()));
    return s;
  }, [existingAccounts]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;

    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = (contact: DeviceContact) => {
    triggerHaptic('medium');
    setSelectedId(contact.id);
    setTimeout(() => {
      onSelect({ name: contact.name, phone: contact.phone });
      onClose();
    }, 220);
  };

  const handleAddCustomName = () => {
    if (!searchQuery.trim()) return;
    triggerHaptic('light');
    onSelect({ name: searchQuery.trim(), phone: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg h-[86vh] sm:h-[680px] bg-zinc-950/95 border border-white/10 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Header Drag Handle for Mobile */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full" />
          </div>

          {/* Top Bar */}
          <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Choose Contact</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {contacts.length} Available
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Select a contact to link or create a ledger record</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { triggerHaptic('light'); loadContacts(true); }}
                disabled={loading}
                className="p-2.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95"
                title="Refresh contacts"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
              </button>

              <button
                onClick={() => { triggerHaptic('light'); onClose(); }}
                className="p-2.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-white/5 bg-zinc-900/40">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by contact name or phone number..."
                className="w-full bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 rounded-2xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-zinc-800">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400 py-16">
                <RefreshCw size={28} className="animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Syncing contacts from phone...</span>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact, idx) => {
                const isSelected = selectedId === contact.id;
                const isInLedger = existingNameSet.has(contact.name.toLowerCase().trim());
                const gradient = getGradientForName(contact.name);

                return (
                  <motion.div
                    key={contact.id || `${contact.name}_${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                    onClick={() => handleSelectContact(contact)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 border border-white/15`}>
                        {getInitials(contact.name)}
                      </div>

                      {/* Info */}
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
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white">
                          <UserPlus size={13} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 py-14">
                <div className="w-14 h-14 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 mb-3 shadow-lg">
                  <User size={24} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">No contacts found</h4>
                <p className="text-xs text-zinc-400 max-w-xs mb-5">
                  {searchQuery
                    ? `No contacts match "${searchQuery}". Tap below to create a new profile with this name.`
                    : 'No device contacts could be read. Make sure contacts permission is allowed.'}
                </p>

                {searchQuery.trim() && (
                  <button
                    onClick={handleAddCustomName}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition"
                  >
                    <Sparkles size={14} />
                    <span>Use "{searchQuery.trim()}" as Name</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Custom Footer */}
          {searchQuery.trim() && filteredContacts.length > 0 && (
            <div className="p-3 px-4 bg-zinc-900/80 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-400 truncate">
                Don't see who you want?
              </span>
              <button
                onClick={handleAddCustomName}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition"
              >
                <UserPlus size={12} />
                <span>Use "{searchQuery.slice(0, 15)}"</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
