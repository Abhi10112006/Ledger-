
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, AppSettings, Repayment, InterestType, SummaryStats } from '../types';
import { generateId, generateProfileId } from '../utils/common';
import { calculateTrustScore, getTotalPayable, getSummaryStats } from '../utils/calculations';
import { 
  getAllTransactions, 
  saveTransaction, 
  bulkSaveTransactions, 
  deleteTxFromDB, 
  getSettings, 
  saveSettingsToDB,
  migrateLegacyData
} from '../utils/db';

// Legacy keys for one-time migration only
const STORAGE_KEY_LEGACY = 'abhi_ledger_session';
const SETTINGS_KEY_LEGACY = 'abhi_ledger_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  userName: "Abhi's Ledger",
  themeColor: 'emerald',
  background: 'solid',
  currency: '₹',
  language: 'en',
  upiId: '',
  upiName: '',
  baseColor: 'slate',
  glowIntensity: 0.5,
  glassBlur: 16,
  glassOpacity: 0.5,
  enableGrain: false,
  density: 'comfortable',
  cornerRadius: 'pill',
  fontStyle: 'sans',
  useVirtualKeyboard: false, // Default to System Keyboard
  keyboardScale: 1.0,
  keyboardTheme: 'dark'
};

export type SortOption = 'name' | 'exposure' | 'trust' | 'recent';

// Helper to clean data structure
const sanitizeTransactions = (rawList: any[]): Transaction[] => {
  if (!Array.isArray(rawList)) return [];
  const now = new Date().toISOString();

  return rawList.map(t => {
    const safeDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toISOString() : now;
    };

    const safeRepayments = Array.isArray(t.repayments) ? t.repayments.map((r: any) => ({
        id: r.id || generateId(),
        amount: Number(r.amount) || 0,
        date: safeDate(r.date)
    })) : [];

    const safeProfileId = t.profileId || generateProfileId(t.friendName || 'Unknown', false);
    const calculatedPaid = safeRepayments.reduce((sum: number, r: any) => sum + r.amount, 0);

    const tempTx: Transaction = {
      id: t.id || generateId(),
      profileId: safeProfileId,
      friendName: t.friendName || 'Unknown',
      friendPhone: t.friendPhone || '',
      principalAmount: Number(t.principalAmount) || 0,
      paidAmount: calculatedPaid,
      startDate: safeDate(t.startDate),
      returnDate: safeDate(t.returnDate),
      notes: t.notes || '',
      interestType: t.interestType || 'none',
      interestRate: Number(t.interestRate) || 0,
      isCompleted: !!t.isCompleted,
      repayments: safeRepayments,
      hasTime: !!t.hasTime,
      interestFreeIfPaidByDueDate: !!t.interestFreeIfPaidByDueDate
    };

    const totalPayable = getTotalPayable(tempTx);
    // Auto-repair completion if it's actually finished but not marked
    if (!tempTx.isCompleted && calculatedPaid >= (totalPayable - 1.0)) {
        tempTx.isCompleted = true;
    }

    return tempTx;
  });
};

export const useLedger = (tourStep: number, searchQuery: string = '') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // --- INITIAL DATA LOAD (IndexedDB + Migration) ---
  useEffect(() => {
    // Detect Standalone Mode (PWA or APK)
    const mq = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
        setIsStandalone(mq.matches || (window.navigator as any).standalone);
    };
    checkStandalone();
    mq.addEventListener('change', checkStandalone);

    const initData = async () => {
      try {
        // 1. Load Settings from IndexedDB
        const dbSettings = await getSettings();
        
        if (dbSettings) {
          // Merge with defaults to ensure new fields (like keyboardScale) exist
          setSettings({ ...DEFAULT_SETTINGS, ...dbSettings });
        } else {
            // One-time Migration from localStorage to IndexedDB
            const legacySettings = localStorage.getItem(SETTINGS_KEY_LEGACY);
            if(legacySettings) {
                try {
                    const parsed = JSON.parse(legacySettings);
                    const merged = { ...DEFAULT_SETTINGS, ...parsed };
                    setSettings(merged);
                    await saveSettingsToDB(merged);
                    // Clear legacy to ensure we don't read stale data later
                    localStorage.removeItem(SETTINGS_KEY_LEGACY);
                } catch(e) {
                    setSettings(DEFAULT_SETTINGS);
                }
            }
        }

        // 2. Load Transactions from IndexedDB
        const dbTxs = await getAllTransactions();
        
        if (dbTxs.length > 0) {
           setTransactions(dbTxs);
           setIsLoggedIn(true);
        } else {
           // One-time Migration for Transactions
           const legacyTx = localStorage.getItem(STORAGE_KEY_LEGACY);
           if (legacyTx) {
              try {
                  const parsed = JSON.parse(legacyTx);
                  const cleanData = sanitizeTransactions(parsed);
                  if (cleanData.length > 0) {
                     await migrateLegacyData(cleanData);
                     setTransactions(cleanData);
                     setIsLoggedIn(true);
                     localStorage.removeItem(STORAGE_KEY_LEGACY); 
                  }
              } catch(e) {
                  // Corrupt legacy data, ignore
              }
           }
        }
      } catch (e) {
        console.error("Critical Error: Failed to initialize DB", e);
      }
    };

    initData();

    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // --- PERSISTENCE HANDLERS ---

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => {
        const next = { ...prev, [key]: value };
        saveSettingsToDB(next); // Async save to IndexedDB
        return next;
    });
  };

  const addLoan = (data: {
    friendName: string;
    profileId?: string;
    friendPhone?: string;
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
    interestFreeIfPaidByDueDate?: boolean;
  }) => {
    const hasTime = data.startDate.includes('T');
    const pid = data.profileId || generateProfileId(data.friendName, true);

    const newTx: Transaction = {
      id: generateId(),
      profileId: pid,
      friendName: data.friendName.trim(),
      friendPhone: data.friendPhone?.trim(),
      principalAmount: Number(data.amount),
      paidAmount: 0,
      startDate: new Date(data.startDate).toISOString(),
      returnDate: new Date(data.returnDate).toISOString(),
      notes: data.notes,
      interestType: data.interestType,
      interestRate: Number(data.interestRate),
      isCompleted: false,
      repayments: [],
      hasTime: hasTime,
      interestFreeIfPaidByDueDate: data.interestFreeIfPaidByDueDate
    };

    // Update UI immediately
    setTransactions(prev => [newTx, ...prev]);
    // Persist to DB
    saveTransaction(newTx);
  };

  const addPayment = (activeTxId: string | null, amount: number, date: string) => {
    if (!activeTxId) return;
    
    setTransactions(prev => prev.map(t => {
      if (t.id === activeTxId) {
        const amt = Number(amount);
        const newRepayment: Repayment = { 
          id: generateId(), 
          amount: amt, 
          date: new Date(date).toISOString() 
        };
        const updatedRepayments = [...t.repayments, newRepayment];
        const updatedPaidAmount = Number(t.paidAmount) + amt;

        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: updatedPaidAmount };
        const totalPayable = getTotalPayable(tempTx);
        const isCompleted = updatedPaidAmount >= (totalPayable - 0.5); 

        const updatedTx = {
          ...t,
          paidAmount: updatedPaidAmount,
          isCompleted,
          repayments: updatedRepayments
        };
        
        // Persist specific item
        saveTransaction(updatedTx);
        return updatedTx;
      }
      return t;
    }));
  };

  const addProfilePayment = (profileId: string, totalAmount: number, date: string) => {
    setTransactions(prev => {
      // 1. Identify User Transactions
      const userTxs = prev.filter(t => t.profileId === profileId);
      
      // 2. Sort for Allocation
      const allocationOrder = [...userTxs].sort((a, b) => {
         if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
         return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });

      let moneyToDistribute = Number(totalAmount);
      const allocationMap = new Map<string, number>();
      const isoDate = new Date(date).toISOString();

      for (const tx of allocationOrder) {
          if (moneyToDistribute <= 0) break;
          const totalPayable = getTotalPayable(tx);
          const pending = totalPayable - tx.paidAmount;
          if (pending <= 0.01) continue; 
          const payAmount = Math.min(moneyToDistribute, pending);
          if (payAmount > 0) {
              allocationMap.set(tx.id, payAmount);
              moneyToDistribute -= payAmount;
          }
      }

      if (moneyToDistribute > 0 && allocationOrder.length > 0) {
          const latestTx = allocationOrder.reduce((latest, current) => {
              return new Date(current.startDate).getTime() > new Date(latest.startDate).getTime() ? current : latest;
          }, allocationOrder[0]);
          const currentAlloc = allocationMap.get(latestTx.id) || 0;
          allocationMap.set(latestTx.id, currentAlloc + moneyToDistribute);
      }

      const txToSave: Transaction[] = [];

      const newTransactions = prev.map(t => {
         if (!allocationMap.has(t.id)) return t;

         const addAmount = allocationMap.get(t.id)!;
         const newRepayment: Repayment = { 
            id: generateId(), 
            amount: addAmount, 
            date: isoDate 
         };
         const updatedRepayments = [...t.repayments, newRepayment];
         const updatedPaid = t.paidAmount + addAmount;
         const totalPayable = getTotalPayable(t);
         const isCompleted = updatedPaid >= (totalPayable - 0.5);

         const updatedTx = {
            ...t,
            repayments: updatedRepayments,
            paidAmount: updatedPaid,
            isCompleted
         };
         
         txToSave.push(updatedTx);
         return updatedTx;
      });

      // Bulk persist the modified ones
      if (txToSave.length > 0) {
          bulkSaveTransactions(txToSave);
      }

      return newTransactions;
    });
  };

  const updateDueDate = (activeTxId: string | null, newDueDate: string) => {
    if (!activeTxId) return;
    setTransactions(prev => prev.map(t => {
        if (t.id === activeTxId) {
            const updatedTx = {
                ...t,
                returnDate: new Date(newDueDate).toISOString(),
                notes: `${t.notes}\n[System Log]: Deadline adjusted to ${newDueDate}`
            };
            saveTransaction(updatedTx);
            return updatedTx;
        }
        return t;
    }));
  };

  const editTransaction = (activeTxId: string | null, newData: { amount: number, date: string }) => {
    if (!activeTxId) return;
    setTransactions(prev => prev.map(t => {
        if (t.id === activeTxId) {
            const newPrincipal = Number(newData.amount);
            const newDate = new Date(newData.date).toISOString();
            
            const tempTx = { ...t, principalAmount: newPrincipal, returnDate: newDate };
            const totalPayable = getTotalPayable(tempTx);
            const isCompleted = t.paidAmount >= (totalPayable - 0.5);

            const updatedTx = {
                ...t,
                principalAmount: newPrincipal,
                returnDate: newDate,
                isCompleted,
            };
            saveTransaction(updatedTx);
            return updatedTx;
        }
        return t;
    }));
  };

  const editRepayment = (txId: string, repId: string, newData: { amount: number, date: string }) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        const updatedRepayments = t.repayments.map(r => {
            if (r.id === repId) {
                return { ...r, amount: Number(newData.amount), date: new Date(newData.date).toISOString() };
            }
            return r;
        });
        
        const newPaidAmount = updatedRepayments.reduce((sum, r) => sum + r.amount, 0);
        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: newPaidAmount };
        const finalTotalPayable = getTotalPayable(tempTx);
        const isCompleted = newPaidAmount >= (finalTotalPayable - 0.5);

        const updatedTx = {
          ...t,
          repayments: updatedRepayments,
          paidAmount: newPaidAmount,
          isCompleted
        };
        saveTransaction(updatedTx);
        return updatedTx;
      }
      return t;
    }));
  };

  const deleteTransaction = (activeTxId: string | null) => {
    if (!activeTxId) return;
    setTransactions(prev => prev.filter(t => t.id !== activeTxId)); 
    deleteTxFromDB(activeTxId);
  };

  const deleteRepayment = (txId: string, repId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        const repaymentToRemove = t.repayments.find(r => r.id === repId);
        if (!repaymentToRemove) return t;

        const updatedRepayments = t.repayments.filter(r => r.id !== repId);
        const updatedPaidAmount = Number(t.paidAmount) - Number(repaymentToRemove.amount);
        
        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: updatedPaidAmount };
        const totalPayable = getTotalPayable(tempTx);
        
        const updatedTx = {
          ...t,
          repayments: updatedRepayments,
          paidAmount: Math.max(0, updatedPaidAmount),
          isCompleted: updatedPaidAmount >= (totalPayable - 0.5)
        };
        saveTransaction(updatedTx);
        return updatedTx;
      }
      return t;
    }));
  };

  const deleteProfile = (nameOrId: string) => {
    setTransactions(prev => {
        const txToDelete: string[] = [];
        const newArr = prev.filter(t => {
            const match = t.profileId === nameOrId || t.friendName === nameOrId;
            if (match) txToDelete.push(t.id);
            return !match;
        });
        // Background delete
        txToDelete.forEach(id => deleteTxFromDB(id));
        return newArr;
    });
  };

  const handleExport = useCallback(() => {
    // Note: We export from current RAM state, which should match DB
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `abhi_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [transactions]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          const sanitized = sanitizeTransactions(data);
          setTransactions(sanitized);
          setIsLoggedIn(true);
          await bulkSaveTransactions(sanitized);
          alert("Backup restored successfully!");
        } else {
          alert("Invalid backup format.");
        }
      } catch (err) {
        alert("Failed to parse the file.");
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }, []);

  const { accounts, allAccounts } = useMemo(() => {
    const simulationTx: Transaction = {
      id: 'sim-tx',
      profileId: 'SIM-PROFILE',
      friendName: 'Example Client',
      principalAmount: 5000,
      paidAmount: 1500,
      startDate: new Date().toISOString(),
      returnDate: new Date(Date.now() + 604800000).toISOString(),
      notes: 'Sample deal for tour.',
      interestType: 'monthly',
      interestRate: 3,
      isCompleted: false,
      repayments: []
    };

    let txToProcess = [...transactions];
    const simExists = txToProcess.some(t => t.profileId === 'SIM-PROFILE');

    // Ensure Sim Profile exists if:
    // 1. We are at Step 11 (UPI Tour) - Required because App.tsx forces this ID
    // 2. We are in Tour Mode (Steps 3+) AND have no data (need something to show)
    if ((tourStep === 11 && !simExists) || (transactions.length === 0 && tourStep >= 3)) {
       if (!simExists) txToProcess.push(simulationTx);
    }

    const grouped: Record<string, Transaction[]> = {};
    txToProcess.forEach(t => {
      const key = t.profileId; 
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    const accountList = Object.entries(grouped).map(([id, txs]) => {
      const exposure = txs.reduce((acc, t) => {
        if (t.isCompleted) return acc;
        return acc + (getTotalPayable(t) - (Number(t.paidAmount) || 0));
      }, 0);

      const name = txs[0].friendName; 
      const trust = calculateTrustScore(id, transactions); 
      const lastActivity = Math.max(...txs.map(t => new Date(t.startDate).getTime()));
      
      return {
        id: id,
        name: name,
        transactions: txs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        totalExposure: Math.max(0, exposure),
        trustScore: trust,
        lastActivity
      };
    });
    
    const baseList = [...accountList].sort((a, b) => b.lastActivity - a.lastActivity);

    let filteredList = [...accountList];
    if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            filteredList = filteredList.filter(acc => 
                acc.name.toLowerCase().includes(query) || 
                acc.id.toLowerCase().includes(query)
            );
        }
    }

    filteredList.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'exposure': return b.totalExposure - a.totalExposure;
        case 'trust': return b.trustScore - a.trustScore;
        case 'recent': default: return b.lastActivity - a.lastActivity;
      }
    });

    return { accounts: filteredList, allAccounts: baseList };
  }, [transactions, sortBy, tourStep, searchQuery]);

  const stats = getSummaryStats(transactions);

  // Install Button Logic:
  // Show ONLY if:
  // 1. Not in Standalone Mode (PWA or APK)
  // 2. AND Browser fired beforeinstallprompt
  const showInstallButton = !isStandalone && !!deferredPrompt;

  return {
    transactions, settings, isLoggedIn, deferredPrompt, sortBy, accounts, allAccounts, stats,
    setIsLoggedIn, setSortBy, updateSetting, addLoan, addPayment, addProfilePayment, updateDueDate, editTransaction, editRepayment,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, handleInstallClick, showInstallButton
  };
};
