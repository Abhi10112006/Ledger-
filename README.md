
# Abhi's Ledger // DEBT INTELLIGENCE SYSTEM v4.0

> **⚠️ SYSTEM STATUS: OPERATIONAL**
> 
> **PROTOCOL: OFFLINE-FIRST**

**Abhi's Ledger** is a next-generation financial tracking mainframe designed for personal lending. It abandons the boring spreadsheet aesthetic for a high-fidelity, cyberpunk-inspired interface. It features a proprietary **Trust Score Algorithm**, a fully customizable **Visual Engine**, and professional **Agency-Style PDF Reports**.

---

## ⚡ Core Capabilities

### 1. Neural Trust Engine
The system analyzes every transaction and repayment timeline to assign a dynamic reliability score **(0-100)** to every client profile.
*   **Elite (90-100)**: Flawless repayment history.
*   **Reliable (75-89)**: Consistent behavior.
*   **Risky (25-49)**: Frequent delays.
*   **Critical (0-24)**: Active defaults and overdue debts.

*Algorithm Factors*: On-time payments boost score (+); overdue deadlines and missed payments degrade it heavily (-).

### 2. The Visual Engine
Customize the mainframe interface to match your environment via **Settings > Visual Engine**.
*   **Atmosphere**: Switch between **Deep Slate** (Standard) and **OLED Black** (Battery Saver/High Contrast).
*   **Texture Overlays**: Apply 'Nebula', 'Grid', or 'Solid' backgrounds.
*   **Glass Physics**: Fine-tune UI blur strength, transparency, and enable **Cinematic Film Grain**.
*   **Typography**: Choose from Tech Mono (JetBrains), Modern Sans (Inter), or System Native fonts.

### 3. Financial Logic
*   **Profile-Centric Architecture**: Transactions are grouped by Client Identity, giving you a total exposure summary per person.
*   **Interest Protocols**:
    *   **Fixed**: Flat percentage fee.
    *   **Dynamic**: Daily, Monthly, or Yearly compounding logic.
    *   **Reducing Balance**: Interest is calculated strictly on the *remaining* principal amount after every partial payment.
*   **Dossier Mode**: Generate a "Classified/Confidential" style PDF statement for any client with a single click.

---

## 🚀 Operating Manual

### Phase 1: Initialization
1.  **Install the PWA**: Click the "Install" button in the navbar (or "Add to Home Screen") for a native app experience.
2.  **Neural Link**: Upon first load, the system initiates an interactive guided tour. Click the **"Tutorial"** button in the navbar at any time to re-calibrate.

### Phase 2: Transaction Management
*   **New Contract**: Click the **(+) FAB** to create a profile or add a loan ("You Gave").
    *   *Inputs*: Name, Amount, Interest Cycle, and Deadline.
*   **Repayment**: Open a specific Profile, then click **"You Got"** (Global Receive) or the **"Entry"** button on a specific transaction card.
    *   Partial payments are supported.
*   **Settlement**: Once `Paid Amount >= Total Payable`, the transaction automatically marks itself as **Settled** and archives.

### Phase 3: Data Sovereignty
*   **Offline Storage**: All data lives securely in your device's `localStorage`. No cloud servers. No tracking.
*   **Secure Backup**: Click the **Download** icon in the navbar to export an encrypted JSON backup.
*   **Restoration**: Drag and drop a backup file onto the Welcome Screen to restore your ledger state.

---

## 🛠️ Technical Specifications

*   **Core**: React 18 (TypeScript)
*   **State**: Custom Hooks with LocalStorage Persistence.
*   **Styling**: Tailwind CSS 3.4 + Dynamic CSS Variables for the Visual Engine.
*   **Icons**: Lucide React.
*   **Reporting**: `jspdf` & `jspdf-autotable` for vector-perfect PDF generation.
*   **PWA**: Service Worker caching for 100% offline functionality (Android/iOS supported).

---

> *System Architect: Abhinav Yaduvanshi*  
> *End Transmission.*
