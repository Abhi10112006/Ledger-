
import { Transaction, SummaryStats, InterestType } from '../types';

export const calculateDaysBetween = (start: Date, end: Date): number => {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const oneDay = 1000 * 60 * 60 * 24;
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.ceil((endUTC - startUTC) / oneDay));
};

export const calculateInterest = (t: Transaction): number => {
  const principal = Number(t.principalAmount) || 0;
  const rate = Number(t.interestRate) || 0;
  if (rate <= 0 || principal <= 0) return 0;
  
  const returnDate = new Date(t.returnDate);
  if (isNaN(returnDate.getTime())) return 0;

  // --- CONDITIONAL WAIVER LOGIC ---
  if (t.interestFreeIfPaidByDueDate) {
    const dueDate = returnDate;
    const now = new Date();
    const paidByDue = (t.repayments || []).reduce((acc, r) => {
        const rDate = new Date(r.date);
        if (!isNaN(rDate.getTime()) && rDate <= dueDate) return acc + Number(r.amount);
        return acc;
    }, 0);
    if (paidByDue >= principal) return 0;
    if (now <= dueDate) return 0;
  }

  // Freeze interest if deal is completed
  if (t.isCompleted) {
    const lastRepaymentDate = t.repayments.length > 0 
      ? new Date(Math.max(...t.repayments.map(r => new Date(r.date).getTime())))
      : new Date();
    return runInterestCalculation(t, lastRepaymentDate);
  }

  return runInterestCalculation(t, new Date());
};

const runInterestCalculation = (t: Transaction, endDate: Date): number => {
  const principal = Number(t.principalAmount) || 0;
  const rate = Number(t.interestRate) || 0;
  const start = new Date(t.startDate);
  if (isNaN(start.getTime())) return 0;
  
  start.setHours(0,0,0,0);
  const now = new Date(endDate);
  now.setHours(0,0,0,0);

  if (now <= start) return 0;

  // Fixed Interest (Flat Rate)
  if (t.interestType === 'none') {
    return principal * (rate / 100);
  }

  const sortedRepayments = (t.repayments || [])
    .map(r => ({ 
      amount: Number(r.amount) || 0, 
      date: new Date(r.date) 
    }))
    .filter(r => !isNaN(r.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  sortedRepayments.forEach(r => r.date.setHours(0,0,0,0));

  let currentBalance = principal;
  let accruedInterest = 0;
  let lastDate = start;
  
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;
  let periodDivisor = 1; 
  if (t.interestType === 'monthly') periodDivisor = 30.4375; 
  if (t.interestType === 'yearly') periodDivisor = 365.25;

  for (const repayment of sortedRepayments) {
    if (repayment.date <= lastDate) {
      currentBalance -= repayment.amount;
      continue;
    }
    if (repayment.date > now) break;

    const days = (repayment.date.getTime() - lastDate.getTime()) / ONE_DAY_MS;
    const periods = days / periodDivisor;
    
    if (currentBalance > 0) {
      accruedInterest += currentBalance * (rate / 100) * periods;
    }
    currentBalance -= repayment.amount;
    lastDate = repayment.date;
  }

  if (lastDate < now && currentBalance > 0) {
    const days = (now.getTime() - lastDate.getTime()) / ONE_DAY_MS;
    const periods = days / periodDivisor;
    accruedInterest += currentBalance * (rate / 100) * periods;
  }

  return Math.max(0, accruedInterest);
};

export const getTotalPayable = (t: Transaction): number => {
  return (Number(t.principalAmount) || 0) + calculateInterest(t);
};

export interface TrustBreakdown {
  score: number;
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; value: string }[];
  history: { date: string; event: string; status: string }[];
}

export const calculateTrustScore = (profileId: string, transactions: Transaction[]): number => {
  const breakdown = getTrustBreakdown(profileId, transactions, ''); 
  return breakdown.score;
};

export const getTrustBreakdown = (profileId: string, transactions: Transaction[], currency: string = '₹'): TrustBreakdown => {
  const friendTx = transactions.filter(t => t.profileId === profileId);

  // Default / New User State
  if (friendTx.length === 0) {
    return { 
      score: 60, // Start slightly fair
      factors: [{ label: 'No History', impact: 'neutral', value: 'New Profile' }],
      history: []
    };
  }

  // --- ALGORITHM VARIABLES ---
  let score = 60; // Baseline Score (Fair)
  const factors: TrustBreakdown['factors'] = [];
  const history: TrustBreakdown['history'] = [];
  const now = new Date();

  // Metrics
  let completedDeals = 0;
  let activeOverdue = 0;
  let totalLatenessMagnitude = 0; // Cumulative days late
  let onTimeRepayments = 0;
  let lateRepayments = 0;
  let fragmentedPayments = 0; // Paying in small chunks
  let totalBorrowed = 0;
  let totalRepaid = 0;

  friendTx.forEach(t => {
    const due = new Date(t.returnDate);
    const start = new Date(t.startDate);
    totalBorrowed += t.principalAmount;
    
    // Log Creation
    if (!isNaN(start.getTime())) {
        history.push({
            date: start.toLocaleDateString(),
            event: `Loan: ${currency}${t.principalAmount}`,
            status: 'Started'
        });
    }

    // 1. PAYMENT BEHAVIOR ANALYSIS
    if (t.repayments && t.repayments.length > 0) {
        // Check for fragmentation (Struggle indicator)
        // If a single loan has > 5 repayments, they might be struggling
        if (t.repayments.length > 5 && !t.isCompleted) {
            fragmentedPayments++;
        }

        t.repayments.forEach(r => {
            totalRepaid += r.amount;
            const payDate = new Date(r.date);
            
            let status = 'On-Time';
            if (payDate > due) {
                status = 'Late';
                lateRepayments++;
            } else {
                onTimeRepayments++;
            }

            history.push({
                date: payDate.toLocaleDateString(),
                event: `Paid: ${currency}${r.amount}`,
                status: status
            });
        });
    }

    // 2. COMPLETION BONUS
    if (t.isCompleted) {
        completedDeals++;
        // Did they finish it on time?
        const lastPay = t.repayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (lastPay) {
            const finishDate = new Date(lastPay.date);
            if (finishDate <= due) {
                score += 8; // Heavy reward for clean finish
            } else {
                score += 3; // Smaller reward for late finish
            }
        } else {
            score += 5; // Manual mark complete
        }
    } 
    // 3. ACTIVE OVERDUE PENALTY
    else if (now > due) {
        activeOverdue++;
        const daysLate = calculateDaysBetween(due, now);
        totalLatenessMagnitude += daysLate;
        
        // Immediate penalty for being overdue right now
        score -= 15; 
        
        // Progressive decay: -1 point for every 3 days late (capped at -20 extra)
        const decay = Math.min(20, Math.floor(daysLate / 3));
        score -= decay;
    }
  });

  // --- SCORE ADJUSTMENTS ---

  // A. Punctuality Ratio
  const totalRepayments = onTimeRepayments + lateRepayments;
  if (totalRepayments > 0) {
      const ratio = onTimeRepayments / totalRepayments;
      if (ratio >= 0.9) {
          score += 10;
          factors.push({ label: 'Payment Discipline', impact: 'positive', value: 'Excellent' });
      } else if (ratio <= 0.5) {
          score -= 10;
          factors.push({ label: 'Payment Discipline', impact: 'negative', value: 'Poor' });
      }
  }

  // B. Late Penalties
  if (lateRepayments > 0) {
      const penalty = Math.min(25, lateRepayments * 3);
      score -= penalty;
      factors.push({ label: 'Late Incidents', impact: 'negative', value: `-${penalty} pts` });
  }

  // C. Active Overdue (Critical Hit)
  if (activeOverdue > 0) {
      factors.push({ label: 'Currently Overdue', impact: 'negative', value: `${activeOverdue} Loans` });
      if (totalLatenessMagnitude > 30) {
           score -= 10; // Extra penalty for being very late
           factors.push({ label: 'Long Delays', impact: 'negative', value: 'Critical' });
      }
  }

  // D. Fragmentation (Struggle Check)
  if (fragmentedPayments > 0) {
      score -= 5;
      factors.push({ label: 'Struggling to Pay', impact: 'negative', value: 'Micro-payments' });
  }

  // E. Completion Bonus (Loyalty)
  if (completedDeals > 0) {
      const bonus = Math.min(20, completedDeals * 2);
      // We already added points per deal, this is a "Volume Bonus"
      if (completedDeals > 3) {
          score += 5;
          factors.push({ label: 'Credit History', impact: 'positive', value: 'Established' });
      }
  }

  // F. Utilization / Settlement Ratio
  // If they have paid back > 80% of everything they ever borrowed
  if (totalBorrowed > 0) {
      const repaymentRatio = totalRepaid / totalBorrowed;
      if (repaymentRatio > 0.9) {
          score += 5;
      } else if (repaymentRatio < 0.2 && totalBorrowed > 1000 && activeOverdue > 0) {
          score -= 10; // Taking money and not paying back much
          factors.push({ label: 'Repayment Ratio', impact: 'negative', value: 'Very Low' });
      }
  }

  // Final Clamp (1 to 100)
  const finalScore = Math.max(1, Math.min(100, Math.round(score)));
  
  return {
    score: finalScore,
    factors: factors.slice(0, 5), // Top 5 factors
    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
};

export const getSummaryStats = (transactions: Transaction[]): SummaryStats => {
  const now = new Date();
  return transactions.reduce((acc, t) => {
    const paid = Number(t.paidAmount) || 0;
    if (t.isCompleted) {
      acc.received += paid;
      return acc;
    } 

    const totalPayable = getTotalPayable(t);
    const balance = Math.max(0, totalPayable - paid);
    
    acc.pending += balance;
    acc.received += paid;
    acc.activeCount += 1;
    
    const due = new Date(t.returnDate);
    if (!isNaN(due.getTime()) && now > due) {
      acc.overdueCount += 1;
    }
    
    return acc;
  }, { pending: 0, received: 0, activeCount: 0, overdueCount: 0 });
};
