
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { getTrustBreakdown, calculateInterest } from './calculations';

const formatDate = (date: Date) => {
  try {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  } catch (e) {
    return 'INVALID DATE';
  }
};

export const generateStatementPDF = (friendName: string, allTransactions: Transaction[], currency: string = '₹') => {
  try {
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
    const displayCurrency = currencyMap[currency] || 'INR';
    
    // Theme Palette
    const colors = {
      bg: [2, 6, 23] as [number, number, number],
      card: [15, 23, 42] as [number, number, number],
      text: [241, 245, 249] as [number, number, number],
      subtext: [148, 163, 184] as [number, number, number],
      emerald: [52, 211, 153] as [number, number, number],
      rose: [251, 113, 133] as [number, number, number],
      border: [30, 41, 59] as [number, number, number],
      grid: [30, 41, 59] as [number, number, number]
    };

    // 1. BACKGROUND
    doc.setFillColor(...colors.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Grid
    doc.setDrawColor(...colors.grid);
    doc.setLineWidth(0.05);
    for (let x = 0; x <= pageWidth; x += 10) doc.line(x, 0, x, pageHeight);
    for (let y = 0; y <= pageHeight; y += 10) doc.line(0, y, pageWidth, y);

    // 2. WATERMARK
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.text("INTERNAL // CONFIDENTIAL", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();

    // ROBUST FILTERING: Trim and normalize case to match allTransactions against the friendName header
    const friendTx = allTransactions.filter(t => 
        t.friendName.trim().toLowerCase() === friendName.trim().toLowerCase()
    );
    
    const breakdown = getTrustBreakdown(friendName, allTransactions, currency);

    // Financial Calculations
    let totalBorrowed = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    
    const events: any[] = [];

    friendTx.forEach(t => {
      const interest = calculateInterest(t);
      totalBorrowed += t.principalAmount;
      totalInterest += interest;
      totalPaid += t.paidAmount;

      events.push({
        date: new Date(t.startDate),
        type: 'CONTRACT INITIATED',
        amount: t.principalAmount,
        note: `Principal (${t.interestRate}% ${t.interestType})`,
        isCredit: false
      });

      if (interest > 0) {
        events.push({
          date: new Date(),
          type: 'INTEREST ACCRUED',
          amount: interest,
          note: 'Calculated to date',
          isCredit: false
        });
      }

      t.repayments.forEach(r => {
        events.push({
          date: new Date(r.date),
          type: 'PAYMENT LOGGED',
          amount: r.amount,
          note: 'Funds Received',
          isCredit: true
        });
      });
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // --- HEADER ---
    doc.setTextColor(...colors.text);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("LEDGER", 14, 25);
    
    doc.setDrawColor(...colors.emerald);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 44, 30);

    doc.setFontSize(10);
    doc.setTextColor(...colors.subtext);
    doc.text(`DATE: ${formatDate(new Date())}`, pageWidth - 14, 15, { align: 'right' });

    // --- PROFILE CARD ---
    const cardY = 40;
    doc.setFillColor(...colors.card);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(14, cardY, pageWidth - 28, 45, 3, 3, 'FD');

    doc.setTextColor(...colors.text);
    doc.setFontSize(16);
    doc.text(friendName.toUpperCase(), 24, cardY + 18);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.subtext);
    doc.text('TARGET IDENTITY', 24, cardY + 10);

    const scoreColor = breakdown.score >= 50 ? colors.emerald : colors.rose;
    doc.setTextColor(...scoreColor);
    doc.setFontSize(12);
    doc.text(`${breakdown.score}/100 TRUST SCORE`, 24, cardY + 32);

    const netDue = (totalBorrowed + totalInterest) - totalPaid;
    const summaryX = pageWidth - 20;
    doc.setTextColor(...colors.subtext);
    doc.setFontSize(8);
    doc.text('NET OUTSTANDING', summaryX, cardY + 15, { align: 'right' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(netDue > 0 ? colors.emerald : colors.subtext));
    doc.text(`${displayCurrency} ${netDue.toLocaleString()}`, summaryX, cardY + 25, { align: 'right' });

    // --- METRICS ---
    const gridY = 95;
    const colWidth = (pageWidth - 28) / 3;
    
    const drawMetric = (label: string, value: string, x: number, accent: [number, number, number]) => {
      doc.setFillColor(...colors.card);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(x, gridY, colWidth - 4, 25, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(...colors.subtext);
      doc.text(label, x + 10, gridY + 10);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text(value, x + 10, gridY + 19);
    };

    drawMetric('TOTAL PRINCIPAL', `${displayCurrency} ${totalBorrowed.toLocaleString()}`, 14, colors.text);
    drawMetric('TOTAL REPAID', `${displayCurrency} ${totalPaid.toLocaleString()}`, 14 + colWidth, colors.emerald);
    drawMetric('INTEREST ACCRUED', `${displayCurrency} ${totalInterest.toLocaleString()}`, 14 + (colWidth * 2), colors.rose);

    let currentY = 135;

    // --- TRUST FACTORS ---
    if (breakdown.factors.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...colors.subtext);
      doc.text('TRUST ALGORITHM FACTORS', 14, currentY);
      currentY += 6;

      breakdown.factors.forEach((factor) => {
        const factorColor = factor.impact === 'positive' ? colors.emerald : 
                           factor.impact === 'negative' ? colors.rose : colors.subtext;
        
        doc.setFillColor(...colors.card);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(14, currentY, pageWidth - 28, 12, 1, 1, 'FD');
        
        doc.setFillColor(...factorColor);
        doc.circle(20, currentY + 6, 2, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.text(factor.label, 28, currentY + 7.5);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...factorColor);
        doc.text(factor.value, pageWidth - 20, currentY + 7.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        currentY += 15;
      });
      currentY += 5;
    }

    // --- AUTO TABLE ---
    // Robustly resolve autoTable function for various ESM environments
    // In some builds, it's the default export, in others it's the function itself.
    let applyAutoTable = autoTable;
    if (typeof applyAutoTable !== 'function') {
      // @ts-ignore - Handle ESM default export quirk
      applyAutoTable = (applyAutoTable as any).default;
    }

    if (typeof applyAutoTable === 'function') {
      applyAutoTable(doc, {
        startY: currentY + 10,
        head: [['DATE', 'OPERATION', 'NOTE', 'AMOUNT']],
        body: events.map(e => [
          formatDate(e.date),
          e.type,
          e.note,
          { 
            content: `${displayCurrency} ${Math.abs(e.amount).toLocaleString()}`, 
            styles: { 
              textColor: e.isCredit ? colors.emerald : colors.text,
              halign: 'right'
            } 
          }
        ]),
        theme: 'grid',
        styles: {
          fillColor: colors.bg,
          textColor: colors.subtext,
          lineColor: colors.border,
          lineWidth: 0.1,
          font: 'helvetica',
          fontSize: 9
        },
        headStyles: {
          fillColor: colors.card,
          textColor: colors.emerald,
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: colors.emerald
        },
        alternateRowStyles: {
          fillColor: [6, 12, 30]
        },
        columnStyles: {
          3: { fontStyle: 'bold' }
        },
        willDrawPage: (data: any) => {
          if (data.pageNumber > 1) {
            doc.setFillColor(...colors.bg);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
          }
        },
        didDrawPage: (data: any) => {
          const str = `ENCRYPTED OFFLINE STORAGE // ${friendName.toUpperCase()} // PAGE ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(7);
          doc.setTextColor(...colors.subtext);
          doc.text(str, 14, pageHeight - 10);
        }
      });
    } else {
      console.error("PDF AutoTable plugin failed to load.");
      alert("PDF Module Error: AutoTable plugin not found. Please refresh.");
    }

    doc.save(`${friendName.replace(/\s+/g, '_')}_Secure_Report.pdf`);
    
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Could not generate PDF. Please check console for details.");
  }
};
