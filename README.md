# Abhi's Ledger // DEBT INTELLIGENCE SYSTEM

**Abhi's Ledger** is a high-performance, offline-first financial tracking application designed for personal lending. It combines professional-grade interest calculations with a "Cyberpunk" aesthetic interface to manage debts, track trust scores, and generate formal PDF reports.

## 🚀 Core Capabilities

*   **100% Offline Architecture**: All data resides in your browser's LocalStorage. No servers, no tracking.
*   **Neural Trust Scoring**: An algorithm that rates borrowers from 0-100 based on repayment behavior.
*   **Dynamic Interest Engine**: Supports Fixed, Daily, Monthly, and Yearly compound-style logic using the **Reducing Balance Method**.
*   **Forensic PDF Reports**: Generate professional "Confidential" dossiers for any client.
*   **JSON Portability**: Full backup and restore functionality via encrypted-like JSON files.

---

## 🧠 The Interest Engine

Unlike simple calculators, Abhi's Ledger uses a **Timeline-Based Reducing Balance** algorithm. This ensures fairness: borrowers only pay interest on the money they are currently holding.

### 1. Reducing Balance Logic
When a payment is made, it immediately reduces the principal balance used for *future* interest calculations.

**Example**:
1.  **Day 0**: Loan of ₹10,000 @ 10% Monthly.
2.  **Day 15**: Borrower repays ₹5,000.
3.  **Day 30**: Interest is calculated in two segments:
    *   *First 15 days*: Interest on ₹10,000.
    *   *Next 15 days*: Interest on ₹5,000.

### 2. Precision Timekeeping
*   **UTC Normalization**: All dates are converted to UTC Midnight to prevent timezone offsets from causing "0.9 day" rounding errors.
*   **Standardized Divisors**:
    *   **Monthly**: Uses `30.4375` days (Average month length based on 365.25 / 12).
    *   **Yearly**: Uses `365.25` days (Accounts for leap years).

### 3. Settlement Logic
A contract is only marked as **SETTLED** (Completed) when:
`Total Paid Amount >= (Principal + Accumulated Interest)`

---

## 🛡️ Trust Score Algorithm (0 - 100)

The "Target Identity" score helps you assess risk at a glance.

*   **Baseline**: Everyone starts at **50/100**.
*   **Positive Factors (+)**:
    *   **On-Time Payments**: Up to +25 pts based on frequency.
    *   **Resolved Contracts**: +8 pts per successfully closed deal (max +15 bonus).
*   **Negative Factors (-)**:
    *   **Late Repayments**: Heavy penalty (up to -30 pts).
    *   **Current Overdue**: If a loan is past its due date, score drops daily (up to -40 pts).

**Tiers**:
*   **90+**: Elite (Cyan)
*   **75-89**: Reliable (Emerald)
*   **50-74**: Fair (Amber)
*   **25-49**: Risky (Orange)
*   **0-24**: Critical (Rose)

---

## 🕹️ User Manual

### 1. Creating a Deal
Click the **+ Button** at the bottom right. Enter the Principal, Start Date, and Return Date.
*   **Interest Type**:
    *   *Fixed*: Flat % fee (e.g., 5% of 1000 = 50 total interest forever).
    *   *Time-based (Daily/Monthly/Yearly)*: Accumulates over time based on the outstanding balance.

### 2. Logging Payments
Click **"Entry"** (Purple/Green button) on a transaction card.
*   Enter the amount received.
*   The system recalculates the outstanding balance instantly.
*   If the payment covers the full debt (Principal + Interest), the card turns gray and marks as "Settled".

### 3. Extending Deadlines
Click the **Date Button** (e.g., "24 Oct") on the transaction card.
*   Select a new date.
*   The system updates the due date and adds a "System Log" note to the transaction history tracking this extension.

### 4. Backup & Restore
*   **Export**: Click the **Download Icon** in the top navigation bar. This saves a `.json` file to your device.
*   **Import**: On the login/welcome screen, click **"Restore Backup"** and select your previously saved file.

### 5. PDF Generation
Click the **File Icon** next to a Client's Total Liability in the account header.
*   Generates a "Secure Report" containing the full ledger, trust breakdown, and verification logs.
*   Renders currencies (₹, $, etc.) as ISO codes (INR, USD) to ensure font compatibility.

---

## 🛠️ Technical Specs

*   **Framework**: React 18+ (TypeScript)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **PDF Engine**: jsPDF + AutoTable
*   **Persistence**: `localStorage` (Key: `abhi_ledger_session`)
