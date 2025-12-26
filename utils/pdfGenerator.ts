
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { calculateTrustScore, getTotalPayable, calculateInterest } from './calculations';

const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const generateStatementPDF = (friendName: string, allTransactions: Transaction[]) => {
  const doc = new jsPDF();
  const friendTx = allTransactions.filter(t => t.friendName.toLowerCase() === friendName.toLowerCase());
  const score = calculateTrustScore(friendName, allTransactions);

  // Financial aggregation
  let totalBorrowed = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  // Sort all events chronologically
  const events: { date: Date; type: string; amount: number; note: string }[] = [];

  friendTx.forEach(t => {
    const interest = calculateInterest(t);
    totalBorrowed += t.principalAmount;
    totalInterest += interest;
    totalPaid += t.paidAmount;

    events.push({
      date: new Date(t.startDate),
      type: 'Loan Disbursed',
      amount: t.principalAmount,
      note: `Initial Principal (Rate: ${t.interestRate}% ${t.interestType})`
    });

    if (interest > 0) {
      events.push({
        date: new Date(),
        type: 'Interest Accrued',
        amount: interest,
        note: 'Calculated based on current duration'
      });
    }

    t.repayments.forEach(r => {
      events.push({
        date: new Date(r.date),
        type: 'Repayment',
        amount: -r.amount,
        note: 'Payment received'
      });
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // PDF Content Construction
  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("ABHI'S LEDGER", 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("OFFICIAL FINANCIAL STATEMENT", 14, 28);
  doc.text(`Generated: ${formatDate(new Date())}`, 140, 28);

  // Friend Profile Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Account Summary", 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client Name: ${friendName}`, 14, 65);
  doc.text(`Current Trust Score: ${score}`, 14, 70);
  
  // Scoring Badge Logic Visual
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 75, 196, 75);

  // Summary Metrics
  const netDue = (totalBorrowed + totalInterest) - totalPaid;
  
  autoTable(doc, {
    startY: 85,
    head: [['Total Borrowed', 'Total Interest', 'Total Repaid', 'Net Outstanding']],
    body: [[
      `INR ${totalBorrowed.toLocaleString()}`,
      `INR ${totalInterest.toLocaleString()}`,
      `INR ${totalPaid.toLocaleString()}`,
      { content: `INR ${netDue.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: netDue > 0 ? [220, 38, 38] : [16, 185, 129] } }
    ]],
    theme: 'plain',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 9 },
    styles: { fontSize: 11 }
  });

  // Detailed Activity Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Detailed Transaction History", 14, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Date', 'Description', 'Amount', 'Balance Delta']],
    body: events.map(e => [
      formatDate(e.date),
      e.type,
      `INR ${Math.abs(e.amount).toLocaleString()}`,
      e.amount > 0 ? `+${e.amount}` : `-${Math.abs(e.amount)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is an electronically generated document. No signature required.", 14, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }

  doc.save(`${friendName.replace(/\s+/g, '_')}_Statement.pdf`);
};
