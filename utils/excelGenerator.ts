import ExcelJS from 'exceljs';
import { Transaction, AppSettings } from '../types';
import { formatAppTitle, formatMoney } from './branding';
import { L_LOGO_BASE64 } from './logoData';
import { downloadOrShare } from './androidFileHandler';
import { getTotalPayable } from './calculations';

interface CounterpartyRow {
  name: string;
  phone: string;
  totalLent: number;
  totalRepaid: number;
  balanceDue: number;
  activeDealsCount: number;
  overdueDealsCount: number;
  trustScore: number;
}

export async function exportExcelDossier(
  transactions: Transaction[],
  settings: AppSettings
): Promise<{ success: boolean; fileName: string; error?: string }> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Abhi's Ledger";
    workbook.lastModifiedBy = formatAppTitle(settings.userName);
    workbook.created = new Date();
    workbook.modified = new Date();

    const titleText = `${formatAppTitle(settings.userName).toUpperCase()} FINANCIAL DOSSIER`;
    const currency = settings.currency || '₹';

    // ─── AGGREGATE ACCOUNT STATS ───
    const counterpartiesMap = new Map<string, CounterpartyRow>();
    let grandTotalLent = 0;
    let grandTotalRepaid = 0;
    let grandActiveDeals = 0;
    let grandOverdueDeals = 0;
    const now = new Date();

    transactions.forEach((tx) => {
      const name = (tx.friendName || 'Unknown').trim();
      const phone = tx.phoneNumber || '—';
      const payable = getTotalPayable(tx);
      const repaid = (tx.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const balance = Math.max(0, payable - repaid);
      const isSettled = tx.isSettled || balance <= 0;

      let isOverdue = false;
      if (!isSettled && tx.dueDate) {
        const due = new Date(tx.dueDate);
        if (due < now) isOverdue = true;
      }

      if (!counterpartiesMap.has(name)) {
        counterpartiesMap.set(name, {
          name,
          phone,
          totalLent: 0,
          totalRepaid: 0,
          balanceDue: 0,
          activeDealsCount: 0,
          overdueDealsCount: 0,
          trustScore: tx.trustScore ?? 85,
        });
      }

      const row = counterpartiesMap.get(name)!;
      row.totalLent += payable;
      row.totalRepaid += repaid;
      row.balanceDue += balance;
      if (!isSettled) {
        row.activeDealsCount += 1;
        grandActiveDeals += 1;
        if (isOverdue) {
          row.overdueDealsCount += 1;
          grandOverdueDeals += 1;
        }
      }

      grandTotalLent += payable;
      grandTotalRepaid += repaid;
    });

    const grandBalanceDue = Math.max(0, grandTotalLent - grandTotalRepaid);
    const counterpartyRows = Array.from(counterpartiesMap.values()).sort(
      (a, b) => b.balanceDue - a.balanceDue
    );

    // ─── ADD LOGO IMAGE ───
    let logoImageId: number | null = null;
    try {
      logoImageId = workbook.addImage({
        base64: L_LOGO_BASE64,
        extension: 'png',
      });
    } catch (e) {
      console.warn('Could not add logo image to Excel workbook:', e);
    }

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: EXECUTIVE SUMMARY & COUNTERPARTIES
    // ─────────────────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet('Executive Summary', {
      views: [{ showGridLines: true }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    // Embed logo at Top Left (Col B Row 2)
    if (logoImageId !== null) {
      sheet1.addImage(logoImageId, {
        tl: { col: 0.2, row: 0.5 },
        ext: { width: 44, height: 44 },
      });
    }

    // Header Title
    sheet1.mergeCells('B2:H2');
    const titleCell = sheet1.getCell('B2');
    titleCell.value = titleText;
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle' };

    sheet1.mergeCells('B3:H3');
    const subtitleCell = sheet1.getCell('B3');
    subtitleCell.value = `Official Financial Audit Dossier • Currency: ${currency} • Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subtitleCell.alignment = { vertical: 'middle' };

    // KPI METRICS BLOCK (Row 5 to 7)
    const kpiDefinitions = [
      { label: 'TOTAL ADVANCED', value: grandTotalLent, isCurrency: true, colStart: 'A', colEnd: 'B', bg: 'FFF1F5F9', fg: 'FF0F172A' },
      { label: 'TOTAL REPAID', value: grandTotalRepaid, isCurrency: true, colStart: 'C', colEnd: 'D', bg: 'FFECFDF5', fg: 'FF059669' },
      { label: 'NET OUTSTANDING', value: grandBalanceDue, isCurrency: true, colStart: 'E', colEnd: 'F', bg: 'FFFEF2F2', fg: 'FFDC2626' },
      { label: 'ACTIVE DEALS', value: grandActiveDeals, isCurrency: false, colStart: 'G', colEnd: 'G', bg: 'FFF8FAFC', fg: 'FF2563EB' },
      { label: 'OVERDUE DEALS', value: grandOverdueDeals, isCurrency: false, colStart: 'H', colEnd: 'H', bg: 'FFFFFBEB', fg: 'FFD97706' },
    ];

    kpiDefinitions.forEach((kpi) => {
      const topCellCoord = `${kpi.colStart}5`;
      const valCellCoord = `${kpi.colStart}6`;

      if (kpi.colStart !== kpi.colEnd) {
        sheet1.mergeCells(`${kpi.colStart}5:${kpi.colEnd}5`);
        sheet1.mergeCells(`${kpi.colStart}6:${kpi.colEnd}6`);
      }

      const topCell = sheet1.getCell(topCellCoord);
      topCell.value = kpi.label;
      topCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
      topCell.alignment = { horizontal: 'center', vertical: 'middle' };
      topCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };

      const valCell = sheet1.getCell(valCellCoord);
      valCell.value = kpi.value;
      if (kpi.isCurrency) {
        valCell.numFmt = `"${currency}" #,##0.00`;
      } else {
        valCell.numFmt = `#,##0`;
      }
      valCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: kpi.fg } };
      valCell.alignment = { horizontal: 'center', vertical: 'middle' };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
    });

    // Table Header (Row 9)
    const summaryHeaders = [
      '#',
      'Counterparty / Client',
      'Contact Phone',
      'Total Lent / Advanced',
      'Total Repaid',
      'Balance Outstanding',
      'Active Deals',
      'Status / Trust',
    ];

    const headerRow = sheet1.getRow(9);
    headerRow.values = summaryHeaders;
    headerRow.height = 28;
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      };
      if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    // Populate Counterparty Rows
    let currentRowIdx = 10;
    counterpartyRows.forEach((cp, idx) => {
      const row = sheet1.getRow(currentRowIdx);
      const isZebra = idx % 2 === 1;
      const statusText =
        cp.balanceDue <= 0
          ? 'Settled (All Clear)'
          : cp.overdueDealsCount > 0
          ? `Overdue (${cp.overdueDealsCount})`
          : 'Active In Progress';

      row.values = [
        idx + 1,
        cp.name,
        cp.phone,
        cp.totalLent,
        cp.totalRepaid,
        cp.balanceDue,
        cp.activeDealsCount,
        statusText,
      ];

      row.height = 22;
      row.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

      // Number formatting for currencies
      row.getCell(4).numFmt = `"${currency}" #,##0.00`;
      row.getCell(5).numFmt = `"${currency}" #,##0.00`;
      row.getCell(6).numFmt = `"${currency}" #,##0.00`;
      row.getCell(6).font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: cp.balanceDue > 0 ? 'FFDC2626' : 'FF059669' },
      };

      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      // Background fill & subtle borders
      const fillArgb = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      currentRowIdx++;
    });

    // Grand Total Row
    const grandRow = sheet1.getRow(currentRowIdx);
    grandRow.values = [
      '',
      'TOTAL ALL CLIENTS',
      `${counterpartyRows.length} Accounts`,
      grandTotalLent,
      grandTotalRepaid,
      grandBalanceDue,
      grandActiveDeals,
      grandBalanceDue <= 0 ? 'All Settled' : 'Active Balances',
    ];
    grandRow.height = 26;
    grandRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    grandRow.getCell(4).numFmt = `"${currency}" #,##0.00`;
    grandRow.getCell(5).numFmt = `"${currency}" #,##0.00`;
    grandRow.getCell(6).numFmt = `"${currency}" #,##0.00`;
    grandRow.getCell(7).alignment = { horizontal: 'center' };
    grandRow.getCell(8).alignment = { horizontal: 'center' };

    grandRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });

    // Auto-fit Column Widths for Sheet 1
    sheet1.columns = [
      { width: 6 },  // #
      { width: 28 }, // Client Name
      { width: 18 }, // Phone
      { width: 22 }, // Total Lent
      { width: 20 }, // Total Repaid
      { width: 24 }, // Balance Outstanding
      { width: 14 }, // Active Deals
      { width: 22 }, // Status
    ];

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: DETAILED LEDGER & REPAYMENTS
    // ─────────────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet('Complete Ledger', {
      views: [{ showGridLines: true }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5 },
      },
    });

    sheet2.mergeCells('A1:J1');
    const s2Title = sheet2.getCell('A1');
    s2Title.value = `${titleText} — COMPLETE TRANSACTION CHRONOLOGY`;
    s2Title.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF0F172A' } };
    s2Title.alignment = { vertical: 'middle' };

    const ledgerHeaders = [
      'Record Date',
      'Counterparty',
      'Phone Number',
      'Type / Action',
      'Principal Advanced',
      'Interest',
      'Repaid Amount',
      'Remaining Balance',
      'Due / Repayment Date',
      'Notes & Purpose',
    ];

    const s2HeaderRow = sheet2.getRow(3);
    s2HeaderRow.values = ledgerHeaders;
    s2HeaderRow.height = 26;
    s2HeaderRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    s2HeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    s2HeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E293B' } },
        bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
      };
    });

    let s2RowIdx = 4;
    // Flatten transactions with their repayments in chronological order
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTx.forEach((tx) => {
      const payable = getTotalPayable(tx);
      const totalRepaidForTx = (tx.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const balance = Math.max(0, payable - totalRepaidForTx);

      // Primary Loan Entry
      const loanRow = sheet2.getRow(s2RowIdx);
      loanRow.values = [
        tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : '—',
        tx.friendName,
        tx.phoneNumber || '—',
        'LOAN ADVANCED',
        tx.amount,
        tx.interestRate ? `${tx.interestRate}% (${tx.interestType || 'Simple'})` : '0%',
        totalRepaidForTx,
        balance,
        tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('en-GB') : 'No Deadline',
        tx.description || '—',
      ];
      loanRow.height = 21;
      loanRow.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } };
      loanRow.getCell(5).numFmt = `"${currency}" #,##0.00`;
      loanRow.getCell(7).numFmt = `"${currency}" #,##0.00`;
      loanRow.getCell(8).numFmt = `"${currency}" #,##0.00`;
      loanRow.getCell(4).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF2563EB' } };

      loanRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
      s2RowIdx++;

      // Repayments sub-rows
      (tx.repayments || []).forEach((rep) => {
        const repRow = sheet2.getRow(s2RowIdx);
        repRow.values = [
          rep.date ? new Date(rep.date).toLocaleDateString('en-GB') : '—',
          `↳ ${tx.friendName}`,
          tx.phoneNumber || '—',
          'REPAYMENT RECEIVED',
          0,
          '—',
          rep.amount,
          balance,
          rep.date ? new Date(rep.date).toLocaleDateString('en-GB') : '—',
          rep.notes ? `Payment: ${rep.notes}` : 'Installment credited',
        ];
        repRow.height = 19;
        repRow.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
        repRow.getCell(5).numFmt = `"${currency}" #,##0.00`;
        repRow.getCell(7).numFmt = `"${currency}" #,##0.00`;
        repRow.getCell(7).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF059669' } };
        repRow.getCell(8).numFmt = `"${currency}" #,##0.00`;
        repRow.getCell(4).font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FF059669' } };

        repRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFCBD5E1' } } };
        });
        s2RowIdx++;
      });
    });

    // Column widths for sheet 2
    sheet2.columns = [
      { width: 14 }, // Date
      { width: 26 }, // Counterparty
      { width: 16 }, // Phone
      { width: 22 }, // Type
      { width: 20 }, // Principal
      { width: 18 }, // Interest
      { width: 18 }, // Repaid
      { width: 20 }, // Remaining Balance
      { width: 20 }, // Due Date
      { width: 32 }, // Notes
    ];

    // Generate buffer & trigger download / share
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const safeTitle = formatAppTitle(settings.userName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${safeTitle || 'ledger'}_financial_dossier_${dateStr}.xlsx`;

    await downloadOrShare(
      fileName,
      blob,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `${titleText}`,
      `Financial Dossier generated from Ledger for ${formatAppTitle(settings.userName)}.`
    );

    return { success: true, fileName };
  } catch (err: any) {
    console.error('Failed to generate Excel dossier:', err);
    return { success: false, fileName: '', error: err?.message || String(err) };
  }
}
