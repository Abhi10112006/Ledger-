
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, AppSettings } from '../types';
import { getTrustBreakdown, calculateInterest } from './calculations';

const formatDate = (date: Date, includeTime = false) => {
  try {
    let str = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
    
    if (includeTime) {
      str += ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return str;
  } catch (e) {
    return 'INVALID DATE';
  }
};

const createStatementDoc = (friendName: string, allTransactions: Transaction[], settings: AppSettings): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Map symbols to ISO codes
  const currencyMap: { [key: string]: string } = {
    '₹': 'INR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY'
  };
  const displayCurrency = currencyMap[settings.currency] || settings.currency;

  // AGENCY STYLE CONFIG (Man in Black Theme)
  const colors = {
    bg: [255, 255, 255] as [number, number, number], // Paper White
    ink: [20, 20, 20] as [number, number, number],   // Typing Black
    stamp: [185, 28, 28] as [number, number, number], // Red Stamp
    highlight: [255, 241, 5] as [number, number, number], // Neon Yellow Highlighter
    grid: [220, 220, 220] as [number, number, number] // Faint Guide Lines
  };

  // 1. BACKGROUND PAPER
  doc.setFillColor(...colors.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // 2. HEADER SCAN LINES (CRT Effect)
  doc.setDrawColor(...colors.grid);
  doc.setLineWidth(0.1);
  for (let y = 0; y < 45; y += 1.5) {
      doc.line(0, y, pageWidth, y);
  }

  // 3. STAMP (Formal but styled)
  doc.setTextColor(...colors.stamp);
  doc.setDrawColor(...colors.stamp);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth - 70, 10, 55, 20, 1, 1, 'S');
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  const stampX = pageWidth - 42.5; 
  doc.text("CONFIDENTIAL", stampX, 21, { align: 'center', angle: -5 });
  doc.setFontSize(7);
  doc.text("EYES ONLY // NO COPY", stampX, 26, { align: 'center', angle: -5 });

  // ROBUST FILTERING
  const friendTx = allTransactions.filter(t => 
      t.friendName.trim().toLowerCase() === friendName.trim().toLowerCase()
  );
  
  const breakdown = getTrustBreakdown(friendName, allTransactions, settings.currency);

  // Financial & Timeline Calculations
  let totalBorrowed = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  let activeLoanEnd: Date | null = null;
  let activeInterestRate = 0;
  let activeInterestType = '';
  
  const events: any[] = [];

  friendTx.forEach(t => {
    const interest = calculateInterest(t);
    totalBorrowed += t.principalAmount;
    totalInterest += interest;
    totalPaid += t.paidAmount;

    // Check for active loan details
    if (!t.isCompleted) {
      activeLoanEnd = new Date(t.returnDate);
      activeInterestRate = t.interestRate;
      activeInterestType = t.interestType;
    }

    // ENHANCED NOTE LOGIC
    let noteDetails = t.notes || 'Principal Advance';
    if (t.interestType !== 'none' && t.interestRate > 0) {
       noteDetails += ` (${t.interestRate}% ${t.interestType})`;
    } else {
       noteDetails += ` (Flat/Fixed)`;
    }
    
    // Append Due Date for context
    if (t.returnDate) {
        try {
            const dueStr = new Date(t.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
            noteDetails += ` [Due: ${dueStr}]`;
        } catch(e) {}
    }

    events.push({
      date: new Date(t.startDate),
      type: 'ADVANCE',
      amount: t.principalAmount,
      note: noteDetails,
      isCredit: false,
      hasTime: t.hasTime
    });

    if (interest > 0) {
      events.push({
        date: new Date(),
        type: 'INTEREST',
        amount: interest,
        note: 'Accrued Interest (Calculated)',
        isCredit: false
      });
    }

    t.repayments.forEach(r => {
      events.push({
        date: new Date(r.date),
        type: 'REPAYMENT',
        amount: r.amount,
        note: 'Payment Received',
        isCredit: true
      });
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // --- HEADER INFO ---
  doc.setTextColor(...colors.ink);
  doc.setFont('courier', 'bold');
  doc.setFontSize(22);
  // User Name Header
  doc.text(`${settings.userName.toUpperCase()} DOSSIER`, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  // Monospace alignment with formal terms
  doc.text(`CLIENT   : ${friendName.toUpperCase()}`, 14, 30);
  doc.text(`AGENT    : ${settings.userName.toUpperCase()}`, 14, 35);
  doc.text(`DATE     : ${formatDate(new Date())}`, 14, 40);

  // --- SUMMARY GRID ---
  const startY = 55;
  const boxHeight = 35;
  
  // Net Calculation
  const netDue = (totalBorrowed + totalInterest) - totalPaid;
  
  // Timeline Logic
  let timelineText1 = "NO ACTIVE";
  let timelineText2 = "CONTRACTS";
  let isOverdue = false;

  if (activeLoanEnd && netDue > 1) {
      const now = new Date();
      now.setHours(0,0,0,0);
      const due = new Date(activeLoanEnd);
      due.setHours(0,0,0,0);
      
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
          isOverdue = true;
          timelineText1 = `${Math.abs(diffDays)} DAYS`;
          timelineText2 = "OVERDUE";
      } else {
          timelineText1 = `${diffDays} DAYS`;
          timelineText2 = "REMAINING";
      }
  } else if (netDue <= 1 && friendTx.length > 0) {
       timelineText1 = "ALL CLEAR";
       timelineText2 = "SETTLED";
  }

  // Draw Grid Lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(14, startY, pageWidth - 14, startY); // Top
  doc.line(14, startY + boxHeight, pageWidth - 14, startY + boxHeight); // Bottom
  
  // Vertical Separators
  const colWidth = (pageWidth - 28) / 3;
  doc.line(14 + colWidth, startY, 14 + colWidth, startY + boxHeight);
  doc.line(14 + (colWidth * 2), startY, 14 + (colWidth * 2), startY + boxHeight);

  // COL 1: TRUST METRIC + GAUGE
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.text("TRUST SCORE", 18, startY + 8);
  
  doc.setFontSize(14);
  doc.text(`${breakdown.score}`, 18, startY + 18);
  
  doc.setFontSize(9);
  doc.text("/ 100", 18 + doc.getTextWidth(`${breakdown.score}`) + 2, startY + 18);
  
  // --- GAUGE (Progress Bar) ---
  const gaugeY = startY + 22;
  const gaugeWidth = 35;
  const gaugeHeight = 2.5;
  
  // Background Track
  doc.setFillColor(220, 220, 220);
  doc.rect(18, gaugeY, gaugeWidth, gaugeHeight, 'F');
  
  // Fill
  const fillWidth = (breakdown.score / 100) * gaugeWidth;
  // Color Logic
  if (breakdown.score >= 75) doc.setFillColor(16, 185, 129); // Emerald
  else if (breakdown.score >= 50) doc.setFillColor(245, 158, 11); // Amber
  else doc.setFillColor(220, 38, 38); // Red
  
  if (fillWidth > 0) {
      doc.rect(18, gaugeY, fillWidth, gaugeHeight, 'F');
  }

  doc.setFillColor(...colors.ink); // Reset to ink
  doc.setFontSize(7);
  doc.text("RATING ANALYSIS", 18, startY + 30);

  // COL 2: NET LIABILITY (The Highlighter)
  const col2X = 14 + colWidth + 4;
  doc.setFontSize(8);
  doc.text("TOTAL LIABILITY", col2X, startY + 8);
  
  if (netDue > 0) {
      const amountText = `${displayCurrency} ${Math.round(netDue).toLocaleString()}`;
      doc.setFontSize(16);
      doc.setFont('courier', 'bold');
      
      // HIGHLIGHTER EFFECT (Yellow Rect behind text)
      const textWidth = doc.getTextWidth(amountText);
      doc.setFillColor(...colors.highlight);
      // x, y, w, h, style
      doc.rect(col2X - 1, startY + 14, textWidth + 2, 8, 'F');
      
      doc.text(amountText, col2X, startY + 20);
  } else {
      doc.setFontSize(16);
      doc.setFont('courier', 'bold');
      doc.setTextColor(150, 150, 150);
      doc.text("SETTLED", col2X, startY + 20);
      doc.setTextColor(...colors.ink);
  }
  
  // Reset Font
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  if(activeInterestRate > 0) {
      doc.text(`RATE: ${activeInterestRate}% ${activeInterestType.toUpperCase()}`, col2X, startY + 28);
  } else {
      doc.text("RATE: FIXED PRINCIPAL", col2X, startY + 28);
  }

  // COL 3: TIMELINE
  const col3X = 14 + (colWidth * 2) + 4;
  doc.setFontSize(8);
  doc.text("DEADLINE STATUS", col3X, startY + 8);
  
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  if (isOverdue) doc.setTextColor(200, 0, 0); // Red if overdue
  
  doc.text(timelineText1, col3X, startY + 18);
  doc.text(timelineText2, col3X, startY + 24);
  
  doc.setTextColor(...colors.ink); // Reset color
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  if (activeLoanEnd && netDue > 1) {
      doc.text(`DUE: ${formatDate(activeLoanEnd)}`, col3X, startY + 31);
  }

  // --- AUTO TABLE ---
  let applyAutoTable = autoTable;
  if (typeof applyAutoTable !== 'function') {
    // @ts-ignore
    applyAutoTable = (applyAutoTable as any).default;
  }

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
      startY: startY + 45,
      head: [['DATE', 'OPERATION', 'DETAILS', 'AMOUNT']],
      body: events.map(e => [
        formatDate(e.date, e.hasTime),
        e.type,
        e.note,
        `${e.isCredit ? '-' : '+'} ${Math.abs(e.amount).toLocaleString()}`
      ]),
      theme: 'plain', // Minimalist layout for typewriter look
      styles: {
        font: 'courier',
        fontSize: 9,
        textColor: colors.ink,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: colors.ink,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [230, 230, 230], // Light Gray Header
        textColor: colors.ink,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: colors.ink
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      },
      didDrawPage: (data: any) => {
          const footerY = pageHeight - 15;
          doc.setLineWidth(0.1);
          doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
          doc.setFontSize(8);
          doc.setFont('courier', 'normal');
          doc.setTextColor(...colors.ink);

          // Redacted Info Blocks helper
          const drawRedacted = (x: number, y: number, w: number) => {
              doc.setFillColor(20, 20, 20);
              doc.rect(x, y, w, 3.5, 'F');
          };

          doc.text("CLEARANCE:", 14, footerY);
          drawRedacted(35, footerY - 3, 25); 
          
          doc.text("ORIGIN:", 70, footerY);
          drawRedacted(85, footerY - 3, 30); 
          
          doc.text(`PG ${doc.internal.getNumberOfPages()}`, pageWidth - 25, footerY);
      }
    });
  }
  
  return doc;
};

export const generateStatementPDF = (friendName: string, allTransactions: Transaction[], settings: AppSettings) => {
  try {
    const doc = createStatementDoc(friendName, allTransactions, settings);
    doc.save(`DOSSIER_${friendName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Could not generate PDF. Please check console for details.");
  }
};

export const generateStatementFile = (friendName: string, allTransactions: Transaction[], settings: AppSettings): File => {
  const doc = createStatementDoc(friendName, allTransactions, settings);
  const blob = doc.output('blob');
  return new File([blob], `Statement_${friendName}.pdf`, { type: 'application/pdf' });
};
