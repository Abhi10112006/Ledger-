
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, AppSettings, Repayment, InterestType, SummaryStats } from '../types';
import { generateId } from '../utils/common';
import { calculateTrustScore, getTotalPayable, getSummaryStats } from '../utils/calculations';

const STORAGE_KEY = 'abhi_ledger_session';
const SETTINGS_KEY = 'abhi_ledger_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  userName: "Abhi's Ledger",
  themeColor: 'emerald',
  background: 'solid',
  currency: '₹',
  language: 'en',
  
  // Visual Engine Defaults
  baseColor: 'slate',
  glowIntensity: 0.5,
  glassBlur: 16,
  glassOpacity: 0.5,
  enableGrain: false,

  // Interface Tuner Defaults
  density: 'comfortable',
  cornerRadius: 'pill',
  fontStyle: 'sans'
};

export type SortOption = 'name' | 'exposure' | 'trust' | 'recent';

// --- DATA SANITIZER HELPER ---
// This acts as a "Firewall" for your data. It repairs bad data before the app uses it.
const sanitizeTransactions = (rawList: any[]): Transaction[] => {
  if (!Array.isArray(rawList)) return [];

  const now = new Date().toISOString();

  return rawList.map(t => {
    // 1. Repair Dates: If date is invalid, default to Now
    const safeDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toISOString() : now;
    };

    // 2. Repair Arrays: Ensure repayments is always an array
    const safeRepayments = Array.isArray(t.repayments) ? t.repayments.map((r: any) => ({
        id: r.id || generateId(),
        amount: Number(r.amount) || 0,
        date: safeDate(r.date)
    })) : [];

    return {
      id: t.id || generateId(),
      friendName: t.friendName || 'Unknown',
      friendPhone: t.friendPhone || '',
      principalAmount: Number(t.principalAmount) || 0,
      paidAmount: Number(t.paidAmount) || 0,
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
  });
};

export const useLedger = (tourStep: number, searchQuery: string = '') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load & Sanitize Transactions
    const savedTx = localStorage.getItem(STORAGE_KEY);
    if (savedTx) {
      try {
        const parsed = JSON.parse(savedTx);
        // CRITICAL: Sanitize immediately to prevent crash loops
        const cleanData = sanitizeTransactions(parsed);
        
        if (cleanData.length > 0) {
          setTransactions(cleanData);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }

    // 2. Load Settings
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

  // --- PERSISTENCE ---
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // --- ACTIONS ---

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
    setTransactions(prev => [{
      id: generateId(),
      friendName: data.friendName.trim(),
      friendPhone: data.friendPhone?.trim(),
      principalAmount: data.amount,
      paidAmount: 0,
      startDate: new Date(data.startDate).toISOString(),
      returnDate: new Date(data.returnDate).toISOString(),
      notes: data.notes,
      interestType: data.interestType,
      interestRate: data.interestRate,
      isCompleted: false,
      repayments: [],
      hasTime: hasTime,
      interestFreeIfPaidByDueDate: data.interestFreeIfPaidByDueDate
    }, ...prev]);
  };

  const addPayment = (activeTxId: string | null, amount: number, date: string) => {
    if (!activeTxId) return;
    
    setTransactions(prev => prev.map(t => {
      if (t.id === activeTxId) {
        const newRepayment: Repayment = { 
          id: generateId(), 
          amount: amount, 
          date: new Date(date).toISOString() 
        };
        const updatedRepayments = [...t.repayments, newRepayment];
        const updatedPaidAmount = t.paidAmount + amount;

        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: updatedPaidAmount };
        const totalPayable = getTotalPayable(tempTx);
        const isCompleted = updatedPaidAmount >= (totalPayable - 0.1);

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
        const updatedPaidAmount = t.paidAmount - repaymentToRemove.amount;
        const tempTx = { ...t, repayments: updatedRepayments, paidAmount: updatedPaidAmount };
        const totalPayable = getTotalPayable(tempTx);

        return {
          ...t,
          repayments: updatedRepayments,
          paidAmount: Math.max(0, updatedPaidAmount),
          isCompleted: updatedPaidAmount >= (totalPayable - 0.1)
        };
      }
      return t;
    }));
  };

  const deleteProfile = (friendName: string) => {
    setTransactions(prev => prev.filter(t => t.friendName.trim().toLowerCase() !== friendName.trim().toLowerCase()));
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

  // --- DERIVED STATE ---

  const accounts = useMemo(() => {
    // Grouping
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const name = t.friendName.trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(t);
    });

    let accountList = Object.entries(grouped).map(([name, txs]) => {
      const exposure = txs.reduce((acc, t) => acc + (getTotalPayable(t) - t.paidAmount), 0);
      const trust = calculateTrustScore(name, transactions);
      const lastActivity = Math.max(...txs.map(t => new Date(t.startDate).getTime()));
      
      return {
        name,
        transactions: txs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        totalExposure: exposure,
        trustScore: trust,
        lastActivity
      };
    });

    // 1. Filter based on Search Query
    if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            accountList = accountList.filter(acc => 
                acc.name.toLowerCase().includes(query) || 
                acc.transactions.some(t => 
                    t.notes.toLowerCase().includes(query) ||
                    t.principalAmount.toString().includes(query)
                )
            );
        }
    }

    return accountList.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'exposure': return b.totalExposure - a.totalExposure;
        case 'trust': return b.trustScore - a.trustScore;
        case 'recent': default: return b.lastActivity - a.lastActivity;
      }
    });
  }, [transactions, sortBy, tourStep, searchQuery]);

  const stats = getSummaryStats(transactions);

  return {
    transactions,
    settings,
    isLoggedIn,
    deferredPrompt,
    sortBy,
    accounts,
    stats,
    setIsLoggedIn,
    setSortBy,
    updateSetting,
    addLoan,
    addPayment,
    updateDueDate,
    deleteTransaction,
    deleteRepayment,
    deleteProfile,
    handleExport,
    handleImport,
    handleInstallClick
  };
};
