
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, AppSettings } from '../types';
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

export const generateStatementPDF = (friendName: string, allTransactions: Transaction[], settings: AppSettings) => {
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
    const displayCurrency = currencyMap[settings.currency] || settings.currency;

    // AGENCY STYLE CONFIG
    const colors = {
      bg: [255, 255, 255] as [number, number, number], // Paper White
      ink: [20, 20, 20] as [number, number, number],   // Typing Black
      stamp: [185, 28, 28] as [number, number, number], // Red Stamp
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

    // 3. "CONFIDENTIAL" STAMP (Tilted Text in Box)
    doc.setTextColor(...colors.stamp);
    doc.setDrawColor(...colors.stamp);
    doc.setLineWidth(0.8);
    
    // Draw the frame
    doc.roundedRect(pageWidth - 70, 10, 55, 25, 1, 1, 'S');
    
    // Draw Tilted Text
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    const stampX = pageWidth - 42.5; // Center of box roughly
    doc.text("TOP SECRET", stampX, 22, { align: 'center', angle: -10 });
    
    doc.setFontSize(8);
    doc.text("EYES ONLY // NO COPY", stampX, 30, { align: 'center', angle: -10 });

    // ROBUST FILTERING
    const friendTx = allTransactions.filter(t => 
        t.friendName.trim().toLowerCase() === friendName.trim().toLowerCase()
    );
    
    const breakdown = getTrustBreakdown(friendName, allTransactions, settings.currency);

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
        type: 'INITIATION',
        amount: t.principalAmount,
        note: `Principal (${t.interestRate}%)`,
        isCredit: false
      });

      if (interest > 0) {
        events.push({
          date: new Date(),
          type: 'INTEREST',
          amount: interest,
          note: 'Accrued to date',
          isCredit: false
        });
      }

      t.repayments.forEach(r => {
        events.push({
          date: new Date(r.date),
          type: 'PAYMENT',
          amount: r.amount,
          note: 'Funds Logged',
          isCredit: true
        });
      });
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // --- HEADER INFO ---
    doc.setTextColor(...colors.ink);
    doc.setFont('courier', 'bold');
    doc.setFontSize(22);
    doc.text("AGENCY DOSSIER", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    // Monospace alignment
    doc.text(`SUBJECT  : ${friendName.toUpperCase()}`, 14, 30);
    doc.text(`HANDLER  : ${settings.userName.toUpperCase()}`, 14, 35);
    doc.text(`DATE     : ${formatDate(new Date())}`, 14, 40);

    // --- SUMMARY GRID (Typewriter Style) ---
    const startY = 50;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    // Top Bar
    doc.line(14, startY, pageWidth - 14, startY); 
    
    doc.setFontSize(9);
    // Column 1
    doc.text("TRUST RATING", 14, startY + 8);
    doc.setFont('courier', 'bold');
    doc.text(`${breakdown.score}/100`, 14, startY + 14);
    
    // Column 2
    doc.setFont('courier', 'normal');
    doc.text("NET LIABILITY", 60, startY + 8);
    const netDue = (totalBorrowed + totalInterest) - totalPaid;
    doc.setFont('courier', 'bold');
    doc.text(`${displayCurrency} ${netDue.toLocaleString()}`, 60, startY + 14);

    // Column 3
    doc.setFont('courier', 'normal');
    doc.text("STATUS", 120, startY + 8);
    doc.setFont('courier', 'bold');
    doc.text(netDue > 0 ? "ACTIVE / UNRESOLVED" : "CLEARED", 120, startY + 14);

    // Bottom Bar
    doc.line(14, startY + 18, pageWidth - 14, startY + 18);

    // --- REDACTED FOOTER HELPER ---
    const drawRedacted = (x: number, y: number, w: number) => {
      doc.setFillColor(10, 10, 10);
      doc.rect(x, y, w, 3.5, 'F');
    };

    // --- AUTO TABLE ---
    let applyAutoTable = autoTable;
    if (typeof applyAutoTable !== 'function') {
      // @ts-ignore
      applyAutoTable = (applyAutoTable as any).default;
    }

    if (typeof applyAutoTable === 'function') {
      applyAutoTable(doc, {
        startY: startY + 25,
        head: [['DATE', 'OPERATION', 'DETAILS', 'AMOUNT']],
        body: events.map(e => [
          formatDate(e.date),
          e.type,
          e.note,
          `${e.isCredit ? '-' : '+'} ${Math.abs(e.amount).toLocaleString()}`
        ]),
        theme: 'plain', // Minimalist layout
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
            
            // Footer Line
            doc.setLineWidth(0.1);
            doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
            
            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.setTextColor(...colors.ink);

            // Redacted Info Blocks
            doc.text("CLEARANCE:", 14, footerY);
            drawRedacted(35, footerY - 3, 25); // Black Bar 1
            
            doc.text("ORIGIN:", 70, footerY);
            drawRedacted(85, footerY - 3, 30); // Black Bar 2

            doc.text("AUTH:", 125, footerY);
            drawRedacted(135, footerY - 3, 20); // Black Bar 3
            
            // Page Number
            doc.text(`PG ${doc.internal.getNumberOfPages()}`, pageWidth - 25, footerY);
            
            // Bottom disclaimer
            doc.setFontSize(6);
            doc.text("WARNING: UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE. DESTROY AFTER READING.", pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
      });
    }

    doc.save(`DOSSIER_${friendName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
    
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Could not generate PDF. Please check console for details.");
  }
};
