
# Abhi's Ledger // DEBT INTELLIGENCE SYSTEM

> **⚠️ SYSTEM STATUS: ONLINE**
> 
> 🔴 **ACCESS NEURAL LINK**: [**https://ledger69.vercel.app/**](https://ledger69.vercel.app/)
>
> *Initiate protocol to access your offline financial mainframe.*

![License](https://img.shields.io/badge/LICENSE-MIT-emerald?style=for-the-badge)
![Status](https://img.shields.io/badge/SYSTEM-OPERATIONAL-cyan?style=for-the-badge)
![Stack](https://img.shields.io/badge/REACT-TYPESCRIPT-blue?style=for-the-badge)

**Abhi's Ledger** is a high-performance, offline-first financial tracking application designed for personal lending. It combines professional-grade interest calculations with a fully customizable "Cyberpunk" aesthetic interface to manage debts, track trust scores, and generate formal "Classified" PDF reports.

---

## 🚀 Quick Start & Usage Protocol

### 1. The Dashboard (Command Center)
*   **Exposure Monitor**: The top cards show your financial health.
    *   **Pending**: Capital currently lent out (Principal + Interest).
    *   **Returned**: Total capital recovered.
*   **Global Search**: Use the top bar to instantly filter your entire database by Name, Amount, or Note content.

### 2. Managing Contracts (Transactions)
*   **New Deal**: Click the **(+)** button.
    *   **Principal**: The amount lent.
    *   **Interest Protocol**: Choose between **Fixed %** (Flat), **Daily**, **Monthly**, or **Yearly** compounding logic.
    *   **Return Date**: Sets the deadline. If missed, the borrower's Trust Score degrades.
*   **Logging Payments**: Click **Entry** on a specific transaction card.
    *   Partial payments immediately reduce the principal balance for future interest calculations (Reducing Balance Method).
*   **Flex Deadlines**: Negotiations happen. Click the **Date** on any active card to extend the deadline. The system logs this event for the audit trail.

### 3. Neural Trust Score (Risk Analysis)
Every borrower is assigned a dynamic score **(0 - 100)**.
*   **View Analysis**: Click the **Trust Badge** (e.g., "92 • Elite") to open the **Trust Briefing**.
*   **The Breakdown**: See exactly why a score went up or down (e.g., "+25 pts On-Time Payment", "-10 pts Overdue").

### 4. Classified Dossier (PDF Export)
Need a hard copy?
*   Click the **File Icon** next to any client's name.
*   The system generates an **"Agency Confidential" PDF** featuring:
    *   CRT Scanline header effects.
    *   Redacted footer information.
    *   Full transaction history and interest calculation events.

### 5. System Config & Visual Engine
Access the **Settings (Gear Icon)** to tune the mainframe:
*   **Identity**: Set your Alias and Currency (₹, $, €, £, ¥).
*   **Visual Engine**:
    *   **Base Atmosphere**: Switch between **Deep Slate** (Dark Mode) and **OLED Black** (Battery Saver).
    *   **Glass Physics**: Adjust blur strength, transparency, and film grain.
*   **Developer Tab**: Access the hidden 3D ID card and sponsorship channels.

---

## 🔒 Offline & Privacy First
**Abhi's Ledger** operates entirely within your browser's secure sandbox.
*   **No Servers**: Your financial data never leaves your device.
*   **Persistence**: Data is stored in `localStorage`.
*   **Backup**: Use the **Download Icon** in the navbar to save an encrypted JSON file.
*   **Restore**: Drag and drop your JSON backup onto the Welcome Screen to restore your session.

---

## 🧠 The Interest Engine

Unlike simple calculators, Abhi's Ledger uses a **Timeline-Based Reducing Balance** algorithm. This ensures fairness: borrowers only pay interest on the money they are currently holding.

**Logic Example**:
1.  **Day 0**: Loan of ₹10,000 @ 10% Monthly.
2.  **Day 15**: Borrower repays ₹5,000.
3.  **Day 30**: Interest is calculated in two segments:
    *   *First 15 days*: Interest on ₹10,000.
    *   *Next 15 days*: Interest on ₹5,000.

**Precision Timekeeping**:
*   All dates are normalized to UTC Midnight to prevent timezone drift.
*   **Monthly Divisor**: `30.4375` days (Average month).
*   **Yearly Divisor**: `365.25` days (Leap year safe).

---

## 🛡️ Trust Score Algorithm

The "Target Identity" score helps you assess risk at a glance.

*   **Baseline**: Everyone starts at **50/100**.
*   **Positive Factors (+)**:
    *   **On-Time Payments**: Up to +25 pts based on frequency.
    *   **Resolved Contracts**: +8 pts per successfully closed deal (max +15 bonus).
*   **Negative Factors (-)**:
    *   **Late Repayments**: Heavy penalty (up to -30 pts).
    *   **Current Overdue**: If a loan is past its due date, score drops daily (up to -40 pts).

**Tiers**:
*   🟢 **90+**: Elite
*   🔵 **75-89**: Reliable
*   🟡 **50-74**: Fair
*   🟠 **25-49**: Risky
*   🔴 **0-24**: Critical

---

## 🛠️ Technical Specs

*   **Framework**: React 18+ (TypeScript)
*   **State Management**: Custom `useLedger` hook.
*   **Styling**: Tailwind CSS 3.4 + CSS Variables for the Visual Engine.
*   **PWA**: Fully installable on iOS/Android with Service Worker caching.

---

> *System Architect: Abhinav Yaduvanshi*
> *Protocol: Secure*
