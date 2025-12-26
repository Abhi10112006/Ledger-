
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

  // Simple interest calculation: P * r * t
  return t.principalAmount * (t.interestRate / 100) * periods;
};

export const getTotalPayable = (t: Transaction): number => {
  return t.principalAmount + calculateInterest(t);
};

export const calculateTrustScore = (friendName: string, transactions: Transaction[]): number => {
  const friendTx = transactions.filter(t => t.friendName === friendName);
  if (friendTx.length === 0) return 100;

  let score = 80; // Baseline
  const now = new Date();

  friendTx.forEach(t => {
    const due = new Date(t.returnDate);
    
    if (t.isCompleted) {
      // Bonus for on-time
      const completedOn = new Date(t.repayments[t.repayments.length - 1]?.date || t.startDate);
      if (completedOn <= due) {
        score += 5;
      } else {
        score -= 5;
      }
    } else {
      // Penalty for active overdue
      if (now > due) {
        const daysLate = calculateDaysBetween(due, now);
        score -= Math.min(20, Math.floor(daysLate / 7) * 5); // -5 every week late
      }
    }
  });

  return Math.max(0, Math.min(100, score));
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
