import React from 'react';

export type InterestType = 'none' | 'daily' | 'monthly' | 'yearly';

export interface Repayment {
  id: string;
  amount: number;
  date: string; // ISO string
}

export interface Transaction {
  id: string;
  profileId: string; // Unique Identifier for the person (e.g. RAH-452)
  friendName: string;
  friendPhone?: string; // Contact number for SMS
  principalAmount: number;
  paidAmount: number;
  startDate: string; // ISO string
  returnDate: string; // ISO string
  notes: string;
  interestType: InterestType;
  interestRate: number; // percentage
  isCompleted: boolean;
  repayments: Repayment[];
  hasTime?: boolean;
  interestFreeIfPaidByDueDate?: boolean;
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

export type ThemeColor = 'emerald' | 'violet' | 'blue' | 'rose' | 'amber';
export type BackgroundType = 'solid' | 'nebula' | 'grid';

// Visual Engine Types
export type BaseColor = 'slate' | 'oled';
export type Density = 'comfortable' | 'compact';
export type CornerRadius = 'sharp' | 'round' | 'pill';
export type FontStyle = 'mono' | 'sans' | 'system' | 'serif' | 'comic';

export interface AppSettings {
  userName: string;
  themeColor: ThemeColor;
  background: BackgroundType;
  currency: string;
  language?: string;
  
  // Visual Engine
  baseColor: BaseColor;
  glowIntensity: number; // 0.0 to 1.0
  glassBlur: number; // px
  glassOpacity: number; // 0.0 to 1.0
  enableGrain: boolean;

  // Interface Tuner
  density: Density;
  cornerRadius: CornerRadius;
  fontStyle: FontStyle;
}

// Error Boundary Types
export interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}