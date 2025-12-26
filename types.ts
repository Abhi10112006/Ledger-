
export type InterestType = 'none' | 'daily' | 'monthly' | 'yearly';

export interface Repayment {
  id: string;
  amount: number;
  date: string; // ISO string
}

export interface Transaction {
  id: string;
  friendName: string;
  principalAmount: number;
  paidAmount: number;
  startDate: string; // ISO string
  returnDate: string; // ISO string
  notes: string;
  interestType: InterestType;
  interestRate: number; // percentage
  isCompleted: boolean;
  repayments: Repayment[];
}

export interface AppState {
  transactions: Transaction[];
  lastBackup?: string;
}

export interface SummaryStats {
  pending: number;
  received: number;
  activeCount: number;
  overdueCount: number;
}
