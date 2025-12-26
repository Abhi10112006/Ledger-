
import { Transaction, SummaryStats, InterestType } from '../types';

export const calculateDaysBetween = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateInterest = (t: Transaction): number => {
  if (t.interestType === 'none' || t.interestRate <= 0) return 0;

  const start = new Date(t.startDate);
  const now = new Date();
  const daysElapsed = Math.max(0, calculateDaysBetween(start, now));
  
  let periods = 0;
  switch (t.interestType) {
    case 'daily':
      periods = daysElapsed;
      break;
    case 'monthly':
      periods = daysElapsed / 30.44;
      break;
    case 'yearly':
      periods = daysElapsed / 365;
      break;
  }

  return t.principalAmount * (t.interestRate / 100) * periods;
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
  const breakdown = getTrustBreakdown(friendName, transactions);
  return breakdown.score;
};

export const getTrustBreakdown = (friendName: string, transactions: Transaction[]): TrustBreakdown => {
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
      event: `Loan of ₹${t.principalAmount}`, 
      status: 'Disbursed' 
    });

    t.repayments.forEach(r => {
      totalPayments++;
      const payDate = new Date(r.date);
      const isLate = payDate > due;
      if (isLate) latePayments++; else onTimePayments++;
      
      history.push({ 
        date: payDate.toLocaleDateString(), 
        event: `Payment of ₹${r.amount}`, 
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
