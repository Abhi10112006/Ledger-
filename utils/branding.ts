/**
 * Branding and text formatting helpers for exports.
 */

export const formatAppTitle = (userName?: string): string => {
  const name = (userName || '').trim();
  // If user has not written a name or if it's default/generic
  if (!name || name.toLowerCase() === 'ledger' || name.toLowerCase() === 'user' || name.toLowerCase() === 'admin') {
    return 'LEDGER';
  }
  // If user already wrote a title containing "ledger"
  if (name.toLowerCase().includes('ledger')) {
    return name.toUpperCase();
  }
  // Otherwise format with possessive: e.g. "Abhinav" -> "ABHINAV'S LEDGER", "James" -> "JAMES' LEDGER"
  const suffix = name.endsWith('s') || name.endsWith('S') ? "'" : "'S";
  return `${name.toUpperCase()}${suffix} LEDGER`;
};

/**
 * Format currency symbol for PDF export.
 * Default jsPDF fonts (Helvetica) only support Latin-1 ASCII.
 * Indian Rupee (₹) is mapped to 'Rs.' to prevent encoding artifacts/question marks in PDFs.
 * Standard symbols $, €, £, ¥ work natively in Latin-1.
 */
export const formatCurrencyForPdf = (currency: string): string => {
  if (currency === '₹') return 'Rs.';
  return currency || 'Rs.';
};

/**
 * Clean currency amount string for display without overflow.
 */
export const formatMoney = (amount: number, currency: string, isPdf = false): string => {
  const sym = isPdf ? formatCurrencyForPdf(currency) : currency;
  const numStr = Math.round(Math.abs(amount)).toLocaleString('en-IN');
  return `${sym}${numStr}`;
};
