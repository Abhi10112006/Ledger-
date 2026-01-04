
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, AppSettings, Repayment, InterestType, SummaryStats } from '../types';
import { generateId } from '../utils/common';
import { calculateTrustScore, getTotalPayable, getSummaryStats } from '../utils/calculations';

const STORAGE_KEY = 'abhi_ledger_session';
const SETTINGS_KEY = 'abhi_ledger_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  userName: "Abhi's Ledger",
  themeColor: 'emerald',
  background: 'solid',
  currency: '₹'
};

export type SortOption = 'name' | 'exposure' | 'trust' | 'recent';

export const useLedger = (tourStep: number) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- INITIALIZATION & EFFECTS ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }

    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) { console.error("Failed settings load", e); }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
    amount: number;
    startDate: string;
    returnDate: string;
    notes: string;
    interestRate: number;
    interestType: InterestType;
  }) => {
    setTransactions(prev => [{
      id: generateId(),
      friendName: data.friendName.trim(), 
      principalAmount: data.amount,
      paidAmount: 0,
      startDate: new Date(data.startDate).toISOString(),
      returnDate: new Date(data.returnDate).toISOString(),
      notes: data.notes,
      interestType: data.interestType,
      interestRate: data.interestRate,
      isCompleted: false,
      repayments: []
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
          setTransactions(data);
          setIsLoggedIn(true);
          event.target.value = '';
        } else {
          alert("Invalid backup format.");
        }
      } catch (err) {
        alert("Failed to parse the file.");
      }
    };
    reader.readAsText(file);
  }, []);

  // --- DERIVED STATE ---

  const accounts = useMemo(() => {
    const simulationTx: Transaction = {
      id: 'sim-tx',
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

    const txToProcess = (transactions.length === 0 && tourStep >= 3 && tourStep <= 6) 
      ? [simulationTx] 
      : transactions;

    // Grouping
    const grouped: Record<string, Transaction[]> = {};
    txToProcess.forEach(t => {
      const name = t.friendName.trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(t);
    });

    // Transform into Account objects for sorting
    const accountList = Object.entries(grouped).map(([name, txs]) => {
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

    // Sorting
    return accountList.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'exposure': return b.totalExposure - a.totalExposure;
        case 'trust': return b.trustScore - a.trustScore;
        case 'recent': return b.lastActivity - a.lastActivity;
        default: return 0;
      }
    });
  }, [transactions, sortBy, tourStep]);

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
    handleExport,
    handleImport,
    handleInstallClick
  };
};
