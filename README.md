
# Abhi's Ledger // DEBT INTELLIGENCE SYSTEM

**Abhi's Ledger** is a high-performance, offline-first financial tracking application designed for personal lending. It combines professional-grade interest calculations with a fully customizable "Cyberpunk" aesthetic interface to manage debts, track trust scores, and generate formal "Classified" PDF reports.

## 🚀 Core Capabilities

*   **100% Offline Architecture**: All data resides in your browser's LocalStorage. No servers, no tracking.
*   **Neural Trust Scoring**: An algorithm that rates borrowers from 0-100 based on repayment behavior with a detailed **Audit Modal**.
*   **Dynamic Interest Engine**: Supports Fixed, Daily, Monthly, and Yearly compound-style logic using the **Reducing Balance Method**.
*   **Forensic PDF Reports**: Generate professional "Classified Dossier" reports with scan lines, redacted text, and top-secret stamps.
*   **Visual Engine**: Complete control over the app's atmosphere—OLED modes, glass blur, film grain, and neon intensity.
*   **Data Integrity**: Robust whitespace trimming and case-insensitive matching ensure all transactions link to the correct profile.

---

## 🎨 Visual Engine & Interface Tuner

Customize the Ledger to fit your device and mood via the Settings menu.

### Atmosphere Control
*   **Base Reality**: Switch between **Deep Slate** (Professional Dark) and **OLED Black** (Battery Saver / True Black).
*   **Texture Overlays**: Apply **Nebula** glows, **Grid** lines, or keep it **Solid**.
*   **Glass Material**: Fine-tune the UI's glass effect.
    *   **Blur Strength**: 0px (Matte) to 40px (Frosted).
    *   **Transparency**: Control how much background bleeds through.
    *   **Film Grain**: Toggle a subtle noise overlay for a tactile, cinematic feel.
*   **System Glow**: Adjust the intensity of the neon shadows and borders (0% to 100%).

### Interface Geometry
*   **Density**:
    *   **Comfortable**: Large touch targets, airy layout.
    *   **Information Dense**: Compact lists for power users managing many accounts.
*   **Corner Radius**:
    *   **Sharp**: Brutalist, square corners.
    *   **Round**: Standard mobile radius.
    *   **Pill**: Soft, hyper-rounded aesthetics (Default).
*   **Typography**:
    *   **Tech Mono**: JetBrains Mono for a coding/hacker vibe.
    *   **Modern Sans**: Inter for clean readability.
    *   **System Native**: Uses your device's optimized font (SF Pro / Roboto).

---

## 👨‍💻 Developer & Sponsorship Protocol

Hidden within the **Settings Module** is the new **Developer Tab**.
*   **Holographic Identity**: Interact with a 3D-tilt enabled ID card representing the system architect.
*   **Direct Transmission**: One-click access to open sponsorship channels or business inquiries via secure email link.
*   **Cipher Decryption**: Experience real-time text decoding animations on the developer profile.

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

---

## 🛡️ Trust Score Algorithm (0 - 100)

The "Target Identity" score helps you assess risk at a glance. **Click the Score Badge** to open the Trust Briefing Modal.

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

## 📄 Classified Dossier (PDF)

Click the **File Icon** next to a Client's Total Liability to generate a report.

*   **Style**: "Agency Confidential"
*   **Features**:
    *   **Courier Typeface**: For that typewriter/terminal look.
    *   **Scan Lines**: CRT monitor effect on the header.
    *   **Redaction**: Footer elements (Origin, Clearance Code) are visually censored with black bars.
    *   **Stamps**: Tilted "TOP SECRET // EYES ONLY" red stamps.
    *   **Breakdown**: Includes full transaction ledger, calculated interest events, and Trust Score analysis.

---

## 🛠️ Technical Specs

*   **Framework**: React 18+ (TypeScript)
*   **State Management**: Custom `useLedger` hook (Separation of Concerns).
*   **Styling**: Tailwind CSS 3.4 + Dynamic CSS Variables (Visual Engine).
*   **Icons**: Lucide React.
*   **PDF Engine**: jsPDF + AutoTable.
*   **PWA**: Service Worker with Stale-While-Revalidate caching.
*   **Persistence**: `localStorage` (Key: `abhi_ledger_session`).
