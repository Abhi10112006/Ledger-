
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

/**
 * Modern Credit Scoring System (300 - 900)
 * Logic factors:
 * - Base: 650 (Fair)
 * - Repayment consistency: + points per on-time repayment
 * - Overdue penalty: Heavy - points for days late
 * - History: Bonus for older relationships with completed deals
 */
export const calculateTrustScore = (friendName: string, transactions: Transaction[]): number => {
  const friendTx = transactions.filter(t => t.friendName === friendName);
  if (friendTx.length === 0) return 650; // Neutral starting score

  let score = 650; 
  const now = new Date();

  friendTx.forEach(t => {
    const due = new Date(t.returnDate);
    const totalPayable = getTotalPayable(t);
    
    // Repayment Analysis
    if (t.repayments.length > 0) {
      t.repayments.forEach(r => {
        const payDate = new Date(r.date);
        if (payDate <= due) {
          score += 15; // Positive behavior: paying before/on due date
        } else {
          score -= 10; // Negative behavior: late partial payments
        }
      });
    }

    if (t.isCompleted) {
      const completedOn = new Date(t.repayments[t.repayments.length - 1]?.date || t.startDate);
      if (completedOn <= due) {
        score += 50; // Major boost for finishing on time
      } else {
        score -= 20; // Slight penalty for finishing late
      }
    } else {
      if (now > due) {
        const daysLate = calculateDaysBetween(due, now);
        // Heavy penalty for active overdue status
        score -= Math.min(200, 30 + (daysLate * 5)); 
      }
    }
  });

  // Clamp to standard banking range
  return Math.max(300, Math.min(900, score));
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
