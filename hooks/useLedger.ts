
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, AppSettings, Repayment, InterestType, SummaryStats } from '../types';
import { generateId, generateProfileId } from '../utils/common';
import { calculateTrustScore, getTotalPayable, getSummaryStats } from '../utils/calculations';

const STORAGE_KEY = 'abhi_ledger_session';
const SETTINGS_KEY = 'abhi_ledger_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  userName: "Abhi's Ledger",
  themeColor: 'emerald',
  background: 'solid',
  currency: '₹',
  language: 'en',
  baseColor: 'slate',
  glowIntensity: 0.5,
  glassBlur: 16,
  glassOpacity: 0.5,
  enableGrain: false,
  density: 'comfortable',
  cornerRadius: 'pill',
  fontStyle: 'sans'
};

export type SortOption = 'name' | 'exposure' | 'trust' | 'recent';

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

  useEffect(() => {
    const savedTx = localStorage.getItem(STORAGE_KEY);
    if (savedTx) {
      try {
        const parsed = JSON.parse(savedTx);
        const cleanData = sanitizeTransactions(parsed);
        if (cleanData.length > 0) {
          setTransactions(cleanData);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) { console.error("Failed settings load", e); }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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

    setTransactions(prev => [{
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
    }, ...prev]);
  };

  // Add specific payment to specific transaction (Entry Button)
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

        return {
          ...t,
          paidAmount: updatedPaidAmount,
          isCompleted,
          repayments: updatedRepayments
        };
      }
      return t;
    }));
  };

  // WATERFALL LOGIC: Distribute payment across user's loans (Oldest -> Newest)
  const addProfilePayment = (profileId: string, totalAmount: number, date: string) => {
    setTransactions(prev => {
      // 1. Identify Target Transactions
      const userTxs = prev.filter(t => t.profileId === profileId);
      
      // 2. Sort: Active loans first (Oldest to Newest), then Completed ones (Newest to Oldest)
      // We prioritize paying off the oldest ACTIVE debt.
      const sortedTxs = userTxs.sort((a, b) => {
         if (a.isCompleted === b.isCompleted) {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
         }
         return a.isCompleted ? 1 : -1; // Active first
      });

      const userTxIds = new Set(sortedTxs.map(t => t.id));
      let remainingMoney = Number(totalAmount);
      const isoDate = new Date(date).toISOString();

      const updatedTransactions = prev.map(t => {
         // Skip other people's transactions
         if (!userTxIds.has(t.id)) return t;

         // If we have no money left, stop modifying
         if (remainingMoney <= 0) return t;

         // Calculate Pending
         const totalPayable = getTotalPayable(t);
         const pending = totalPayable - t.paidAmount;

         // How much to pay here?
         let payAmount = 0;
         
         if (t.isCompleted) {
            // Even if completed, if we have excess money at the end, we might dump it in the last transaction.
            // But usually we don't pay completed ones unless it's the ONLY transaction.
            return t; 
         } else {
             // Pay up to the pending amount or whatever we have left
             payAmount = Math.min(remainingMoney, pending);
             // If due to float precision pending is < 0.5, treat as 0
             if (pending < 0.5) payAmount = 0;
         }

         // If we calculate 0 payment but still have money, it means this tx is effectively paid. Move to next.
         if (payAmount <= 0) return t;

         // Apply Payment
         remainingMoney -= payAmount;
         
         const newRepayment: Repayment = { id: generateId(), amount: payAmount, date: isoDate };
         const updatedRepayments = [...t.repayments, newRepayment];
         const updatedPaid = t.paidAmount + payAmount;
         const isCompleted = updatedPaid >= (totalPayable - 0.5);

         return {
            ...t,
            repayments: updatedRepayments,
            paidAmount: updatedPaid,
            isCompleted
         };
      });

      // 3. OVERPAYMENT HANDLING
      // If we looped through all active transactions and still have money (remainingMoney > 0)
      // We apply the excess to the VERY LAST transaction (Newest) of the user, making it overpaid/credit.
      if (remainingMoney > 0.1 && userTxs.length > 0) {
          // Find the newest transaction (last in our sorted list by date)
          const newestTx = sortedTxs[sortedTxs.length - 1];
          
          return updatedTransactions.map(t => {
              if (t.id === newestTx.id) {
                  const newRepayment: Repayment = { id: generateId(), amount: remainingMoney, date: isoDate };
                  const updatedRepayments = [...t.repayments, newRepayment];
                  const updatedPaid = t.paidAmount + remainingMoney;
                  
                  // Force complete if it wasn't already
                  return {
                      ...t,
                      repayments: updatedRepayments,
                      paidAmount: updatedPaid,
                      isCompleted: true
                  };
              }
              return t;
          });
      }

      return updatedTransactions;
    });
  };

  const updateDueDate = (activeTxId: string | null, newDueDate: string) => {
    if (!activeTxId) return;
    setTransactions(prev => prev.map(t => t.id === activeTxId ? {
      ...t,
      returnDate: new Date(newDueDate).toISOString(),
      notes: `${t.notes}\n[System Log]: Deadline adjusted to ${newDueDate}`
    } : t));
  };

  const deleteTransaction = (activeTxId: string | null) => {
    if (!activeTxId) return;
    setTransactions(prev => prev.filter(t => t.id !== activeTxId)); 
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

        return {
          ...t,
          repayments: updatedRepayments,
          paidAmount: Math.max(0, updatedPaidAmount),
          isCompleted: updatedPaidAmount >= (totalPayable - 0.5)
        };
      }
      return t;
    }));
  };

  const deleteProfile = (nameOrId: string) => {
    setTransactions(prev => prev.filter(t => 
        t.profileId !== nameOrId && t.friendName !== nameOrId
    ));
  };

  const handleExport = useCallback(() => {
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
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          const sanitized = sanitizeTransactions(data);
          setTransactions(sanitized);
          setIsLoggedIn(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
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
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
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

  return {
    transactions, settings, isLoggedIn, deferredPrompt, sortBy, accounts, allAccounts, stats,
    setIsLoggedIn, setSortBy, updateSetting, addLoan, addPayment, addProfilePayment, updateDueDate,
    deleteTransaction, deleteRepayment, deleteProfile, handleExport, handleImport, handleInstallClick
  };
};
