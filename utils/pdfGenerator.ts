import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, AppSettings } from '../types';
import { getTrustBreakdown, calculateInterest } from './calculations';
import { getAppLogoBase64 } from './logoProvider';
import { formatAppTitle, formatCurrencyForPdf, formatMoney } from './branding';

const formatDate = (date: Date, includeTime = false) => {
  try {
    let str = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (includeTime) {
      str += ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return str;
  } catch (e) {
    return 'Invalid Date';
  }
};

/**
 * Dynamic font sizing to prevent text from overflowing its allotted width in PDF
 */
const drawFittedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  baseSize: number,
  fontStyle: 'bold' | 'normal' = 'bold',
  align: 'left' | 'center' | 'right' = 'left'
) => {
  doc.setFont('helvetica', fontStyle);
  let size = baseSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxW && size > 5.5) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  doc.text(text, x, y, { align });
};

export const createStatementDoc = async (
  profileId: string,
  friendName: string,
  allTransactions: Transaction[],
  settings: AppSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  const displayCurrency = formatCurrencyForPdf(settings.currency);
  const appTitle = formatAppTitle(settings.userName);

  // Filter transactions for this profile
  const friendTx = allTransactions.filter(t => t.profileId === profileId);
  const breakdown = getTrustBreakdown(profileId, allTransactions, settings.currency);

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

    if (!t.isCompleted) {
      activeLoanEnd = new Date(t.returnDate);
      activeInterestRate = t.interestRate;
      activeInterestType = t.interestType;
    }

    let noteDetails = t.notes || 'Principal Advance';
    if (t.interestType !== 'none' && t.interestRate > 0) {
      noteDetails += ` (${t.interestRate}% ${t.interestType})`;
    } else if (t.interestRate > 0) {
      noteDetails += ` (Flat ${t.interestRate}%)`;
    }

    if (t.returnDate) {
      try {
        const dueStr = new Date(t.returnDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        noteDetails += ` • Due: ${dueStr}`;
      } catch (e) {}
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
        note: 'Accrued Interest',
        isCredit: false
      });
    }

    (t.repayments || []).forEach(r => {
      events.push({
        date: new Date(r.date),
        type: 'REPAYMENT',
        amount: r.amount,
        note: 'Repayment Received',
        isCredit: true
      });
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const netDue = (totalBorrowed + totalInterest) - totalPaid;

  // Find nearest active due date across all non-completed transactions
  const activeTxWithDueDate = friendTx
    .filter(t => !t.isCompleted && t.returnDate)
    .map(t => new Date(t.returnDate))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let statusText = "● SETTLED (ALL CLEAR)";
  let pillBg: [number, number, number] = [236, 253, 245];
  let pillBorder: [number, number, number] = [16, 185, 129];
  let pillColor: [number, number, number] = [5, 150, 105];

  if (netDue > 0) {
    if (activeTxWithDueDate.length > 0) {
      const nearestDueDate = activeTxWithDueDate[0];
      const diffTime = nearestDueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysLate = Math.abs(diffDays);
        statusText = `● OVERDUE BY ${daysLate} DAY${daysLate === 1 ? '' : 'S'}`;
        pillBg = [254, 242, 242];
        pillBorder = [239, 68, 68];
        pillColor = [220, 38, 38];
      } else if (diffDays === 0) {
        statusText = `● DUE TODAY`;
        pillBg = [255, 251, 235];
        pillBorder = [245, 158, 11];
        pillColor = [217, 119, 6];
      } else {
        statusText = `● ${diffDays} DAY${diffDays === 1 ? '' : 'S'} REMAINING`;
        pillBg = [238, 242, 255];
        pillBorder = [99, 102, 241];
        pillColor = [79, 70, 229];
      }
    } else {
      statusText = `● ACTIVE DEAL (NO DUE DATE)`;
      pillBg = [241, 245, 249];
      pillBorder = [148, 163, 184];
      pillColor = [71, 85, 105];
    }
  } else if (friendTx.length === 0) {
    statusText = `● NO TRANSACTIONS`;
    pillBg = [241, 245, 249];
    pillBorder = [203, 213, 225];
    pillColor = [100, 116, 139];
  }

  // --- 1. HEADER (Exact "L" Logo + App Title + Status Pill) ---
  const logoBase64 = await getAppLogoBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 12, 16, 16);
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
    }
  }

  const textStartX = logoBase64 ? margin + 20 : margin;

  // Auto-calculated dynamic Status Badge (Top-Right) so it NEVER overflows
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const pillPaddingX = 4;
  const textWidth = doc.getTextWidth(statusText);
  const pillW = Math.max(38, textWidth + pillPaddingX * 2);
  const pillH = 8.5;
  const pillX = pageWidth - margin - pillW;
  const pillY = 15;

  doc.setFillColor(...pillBg);
  doc.setDrawColor(...pillBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'FD');
  doc.setTextColor(...pillColor);
  doc.text(statusText, pillX + (pillW / 2), pillY + 5.5, { align: 'center' });

  // Draw Title without colliding with the pill
  const maxTitleW = pillX - textStartX - 6;
  doc.setTextColor(15, 23, 42);
  drawFittedText(doc, appTitle, textStartX, 18, maxTitleW, 15, 'bold');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("OFFICIAL FINANCIAL LEDGER STATEMENT", textStartX, 24);

  // Hairline Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 32, pageWidth - margin, 32);

  // --- 2. PARTY INFO (Client & Issuer Cards) ---
  const infoY = 37;
  const colW = (pageWidth - (margin * 2) - 6) / 2;

  // Client Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, infoY, colW, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("COUNTERPARTY / CLIENT", margin + 4, infoY + 5.5);

  doc.setTextColor(15, 23, 42);
  drawFittedText(doc, friendName, margin + 4, infoY + 12, colW - 8, 11, 'bold');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Account ID: ${profileId}`, margin + 4, infoY + 18);

  // Issuer Box (Right)
  const col2X = margin + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, infoY, colW, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("STATEMENT DETAILS", col2X + 4, infoY + 5.5);

  const issuerDisplay = settings.userName && settings.userName.trim().length > 0 ? settings.userName.trim() : 'Primary Ledger';
  doc.setTextColor(15, 23, 42);
  drawFittedText(doc, `Issuer: ${issuerDisplay}`, col2X + 4, infoY + 12, colW - 8, 10, 'bold');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const refCode = profileId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  doc.text(`Issued: ${formatDate(new Date())}  •  Ref: #${refCode}`, col2X + 4, infoY + 18);

  // --- 3. EXECUTIVE FINANCIAL SUMMARY CARDS ---
  const sumY = 63;
  const cardGap = 4;
  const numCards = 4;
  const cardW = (pageWidth - (margin * 2) - (cardGap * (numCards - 1))) / numCards;
  const cardH = 22;

  // Helper to format currency amount safely
  const formatAmt = (val: number) => {
    return `${displayCurrency} ${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Card 1: Principal Advanced
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, sumY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL ADVANCED", margin + 3.5, sumY + 5.5);
  doc.setTextColor(15, 23, 42);
  drawFittedText(doc, formatAmt(totalBorrowed), margin + 3.5, sumY + 14, cardW - 7, 11, 'bold');

  // Card 2: Total Repaid
  const c2X = margin + cardW + cardGap;
  doc.roundedRect(c2X, sumY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL REPAID", c2X + 3.5, sumY + 5.5);
  doc.setTextColor(5, 150, 105); // emerald
  drawFittedText(doc, formatAmt(totalPaid), c2X + 3.5, sumY + 14, cardW - 7, 11, 'bold');

  // Card 3: Net Balance
  const c3X = c2X + cardW + cardGap;
  const isNetDuePositive = netDue > 0;
  if (isNetDuePositive) {
    if (isOverdue) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
    }
  } else {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
  }
  doc.roundedRect(c3X, sumY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(isNetDuePositive ? (isOverdue ? 220 : 15) : 5, isNetDuePositive ? (isOverdue ? 38 : 23) : 150, isNetDuePositive ? (isOverdue ? 38 : 42) : 105);
  doc.text("NET OUTSTANDING", c3X + 3.5, sumY + 5.5);

  const netDueText = isNetDuePositive ? formatAmt(netDue) : "SETTLED";
  drawFittedText(doc, netDueText, c3X + 3.5, sumY + 14, cardW - 7, 11.5, 'bold');

  // Card 4: Trust Score & Rating
  const c4X = c3X + cardW + cardGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c4X, sumY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("TRUST SCORE", c4X + 3.5, sumY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${breakdown.score}`, c4X + 3.5, sumY + 13);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("/ 100", c4X + 3.5 + doc.getTextWidth(`${breakdown.score}`) + 1.5, sumY + 13);

  // Trust progress bar
  const barW = cardW - 7;
  const barH = 2;
  const barY = sumY + 16.5;
  doc.setFillColor(226, 232, 240);
  doc.rect(c4X + 3.5, barY, barW, barH, 'F');
  const fillW = Math.max(0, Math.min(barW, (breakdown.score / 100) * barW));
  if (breakdown.score >= 75) doc.setFillColor(16, 185, 129);
  else if (breakdown.score >= 50) doc.setFillColor(245, 158, 11);
  else doc.setFillColor(239, 68, 68);
  if (fillW > 0) doc.rect(c4X + 3.5, barY, fillW, barH, 'F');

  // --- 4. TRANSACTION & SETTLEMENT TABLE ---
  let applyAutoTable = autoTable;
  if (typeof applyAutoTable !== 'function') {
    applyAutoTable = (applyAutoTable as any).default;
  }

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
      startY: sumY + cardH + 7,
      head: [['DATE & TIME', 'TRANSACTION TYPE', 'DETAILS & REFERENCE', 'AMOUNT']],
      body: events.map(e => {
        let typeBadge =
          e.type === 'REPAYMENT'
            ? 'Repayment Received'
            : e.type === 'INTEREST'
            ? 'Accrued Interest'
            : 'Loan Advance';
        let amountText = `${e.isCredit ? '+' : '-'} ${displayCurrency} ${Math.abs(e.amount).toLocaleString('en-IN')}`;
        return [
          formatDate(e.date, e.hasTime),
          typeBadge,
          e.note,
          amountText
        ];
      }),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: [51, 65, 85],
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        font: 'helvetica',
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 42, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const raw = String(data.cell.raw || '');
          if (raw.startsWith('+')) {
            data.cell.styles.textColor = [5, 150, 105]; // emerald
          } else {
            data.cell.styles.textColor = [15, 23, 42]; // slate-900
          }
        }
      },
      didDrawPage: (data: any) => {
        const footerY = pageHeight - 12;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Digitally generated via ${appTitle} • Confidential Financial Document`, margin, footerY);

        const pageStr = `Page ${doc.getNumberOfPages()}`;
        doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
      }
    });
  }

  return doc;
};

export const generateStatementPDF = async (
  profileId: string,
  friendName: string,
  allTransactions: Transaction[],
  settings: AppSettings
) => {
  try {
    const doc = await createStatementDoc(profileId, friendName, allTransactions, settings);

    const { saveToDocuments, downloadOrShare, isNative } = await import('./androidFileHandler');
    const blob = doc.output('blob');
    const filename = `Statement_${friendName.replace(/\s+/g, '_')}_${profileId.slice(0, 6)}.pdf`;

    if (isNative) {
      await saveToDocuments(filename, blob, 'Statement PDF');
    } else {
      await downloadOrShare(filename, blob, 'application/pdf', 'Statement PDF');
    }
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
      detail: { message: "Could not generate PDF. Please try again.", type: 'error' }
    }));
  }
};

export const generateStatementFile = async (
  profileId: string,
  friendName: string,
  allTransactions: Transaction[],
  settings: AppSettings
): Promise<File> => {
  const doc = await createStatementDoc(profileId, friendName, allTransactions, settings);
  const blob = doc.output('blob');
  return new File([blob], `Statement_${friendName}.pdf`, { type: 'application/pdf' });
};
