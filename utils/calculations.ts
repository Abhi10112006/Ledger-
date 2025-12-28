
import { Transaction, SummaryStats, InterestType } from '../types';

export const calculateDaysBetween = (start: Date, end: Date): number => {
  // Normalize to UTC midnight to avoid DST/Timezone offset issues affecting day count
  const oneDay = 1000 * 60 * 60 * 24;
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.ceil((endUTC - startUTC) / oneDay));
};

export const calculateInterest = (t: Transaction): number => {
  if (t.interestType === 'none' || t.interestRate <= 0) return 0;

  const start = new Date(t.startDate);
  start.setHours(0,0,0,0);
  
  const now = new Date();
  now.setHours(0,0,0,0);

  // If the loan hasn't started yet relative to 'now', no interest.
  if (now <= start) return 0;

  // 1. Sort repayments chronologically
  const sortedRepayments = t.repayments
    .map(r => ({ 
      amount: r.amount, 
      date: new Date(r.date) 
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Normalize repayment dates to midnight for consistent day-diff calculation
  sortedRepayments.forEach(r => r.date.setHours(0,0,0,0));

  let currentBalance = t.principalAmount;
  let accruedInterest = 0;
  let lastDate = start;
  
  // Define precise divisors
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;
  let periodDivisor = 1; // Default Daily
  
  // 365.25 days/year accounts for leap years on average
  if (t.interestType === 'monthly') periodDivisor = 30.4375; // 365.25 / 12
  if (t.interestType === 'yearly') periodDivisor = 365.25;

  // 2. Iterate through timeline events (Reducing Balance Method)
  for (const repayment of sortedRepayments) {
    // Skip if repayment is before/on start date (treated as down payment or immediate correction)
    if (repayment.date <= lastDate) {
      currentBalance -= repayment.amount;
      continue;
    }

    // If repayment is in the future relative to 'now', stop calculation at 'now'
    if (repayment.date > now) break;

    // Calculate interest for the period since last event
    const days = (repayment.date.getTime() - lastDate.getTime()) / ONE_DAY_MS;
    const periods = days / periodDivisor;
    
    // Only accrue interest if there is a positive balance
    if (currentBalance > 0) {
      accruedInterest += currentBalance * (t.interestRate / 100) * periods;
    }

    // Update balance and cursor
    currentBalance -= repayment.amount;
    lastDate = repayment.date;
  }

  // 3. Calculate final segment from last event until today
  if (lastDate < now && currentBalance > 0) {
    const days = (now.getTime() - lastDate.getTime()) / ONE_DAY_MS;
    const periods = days / periodDivisor;
    accruedInterest += currentBalance * (t.interestRate / 100) * periods;
  }

  return Math.max(0, accruedInterest);
};

export const getTotalPayable = (t: Transaction): number => {
  return t.principalAmount + calculateInterest(t);
};

export interface TrustBreakdown {
  score: number;
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; value: string }[];
  history: { date: string; event: string; status: string }[];
}

/**
 * Modern Credit Scoring System (0 - 100)
 * Logic factors:
 * - Base: 50 (Neutral)
 * - Repayment consistency: Weight 40%
 * - Overdue behavior: Weight 40% (Penalty-heavy)
 * - Historical completion: Weight 20%
 */
export const calculateTrustScore = (friendName: string, transactions: Transaction[]): number => {
  // We pass a default currency here as the score itself is currency agnostic, 
  // but the breakdown function requires it.
  const breakdown = getTrustBreakdown(friendName, transactions, ''); 
  return breakdown.score;
};

export const getTrustBreakdown = (friendName: string, transactions: Transaction[], currency: string = '₹'): TrustBreakdown => {
  const friendTx = transactions.filter(t => t.friendName.toLowerCase() === friendName.toLowerCase());
  if (friendTx.length === 0) {
    return { 
      score: 50, 
      factors: [{ label: 'Baseline', impact: 'neutral', value: 'New Account' }],
      history: []
    };
  }

  let score = 50;
  const factors: TrustBreakdown['factors'] = [];
  const history: TrustBreakdown['history'] = [];
  const now = new Date();

  let onTimePayments = 0;
  let latePayments = 0;
  let totalPayments = 0;
  let maxDaysOverdue = 0;
  let completedDeals = 0;

  friendTx.forEach(t => {
    const due = new Date(t.returnDate);
    
    // Track History
    history.push({ 
      date: new Date(t.startDate).toLocaleDateString(), 
      event: `Loan of ${currency}${t.principalAmount}`, 
      status: 'Disbursed' 
    });

    t.repayments.forEach(r => {
      totalPayments++;
      const payDate = new Date(r.date);
      const isLate = payDate > due;
      if (isLate) latePayments++; else onTimePayments++;
      
      history.push({ 
        date: payDate.toLocaleDateString(), 
        event: `Payment of ${currency}${r.amount}`, 
        status: isLate ? 'Late' : 'On-Time' 
      });
    });

    if (t.isCompleted) {
      completedDeals++;
      const lastPayment = t.repayments[t.repayments.length - 1];
      if (lastPayment && new Date(lastPayment.date) <= due) {
        score += 8; // On-time completion bonus
      }
    } else if (now > due) {
      const days = calculateDaysBetween(due, now);
      maxDaysOverdue = Math.max(maxDaysOverdue, days);
    }
  });

  // Calculate Impact
  if (onTimePayments > 0) {
    const bonus = Math.min(25, onTimePayments * 4);
    score += bonus;
    factors.push({ label: 'On-time Payments', impact: 'positive', value: `+${bonus} pts` });
  }

  if (latePayments > 0) {
    const penalty = Math.min(30, latePayments * 7);
    score -= penalty;
    factors.push({ label: 'Late Repayments', impact: 'negative', value: `-${penalty} pts` });
  }

  if (maxDaysOverdue > 0) {
    const penalty = Math.min(40, 10 + (maxDaysOverdue * 2));
    score -= penalty;
    factors.push({ label: 'Current Overdue', impact: 'negative', value: `-${penalty} pts` });
  }

  if (completedDeals > 0) {
    const bonus = Math.min(15, completedDeals * 5);
    score += bonus;
    factors.push({ label: 'Resolved Contracts', impact: 'positive', value: `+${bonus} pts` });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    factors,
    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
};

export const getSummaryStats = (transactions: Transaction[]): SummaryStats => {
  const now = new Date();
  return transactions.reduce((acc, t) => {
    const totalPayable = getTotalPayable(t);
    const balance = Math.max(0, totalPayable - t.paidAmount);
    
    if (t.isCompleted) {
      acc.received += t.paidAmount;
    } else {
      acc.pending += balance;
      acc.received += t.paidAmount;
      acc.activeCount += 1;
      if (now > new Date(t.returnDate)) {
        acc.overdueCount += 1;
      }
    }
    return acc;
  }, { pending: 0, received: 0, activeCount: 0, overdueCount: 0 });
};
