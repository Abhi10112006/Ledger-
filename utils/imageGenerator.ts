import { formatAppTitle } from './branding';
import { getAppLogoImage } from './logoProvider';

// Helper for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper to draw rounded image
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}

// Vector fallback for the official "L" logo
function drawVectorLLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 100;
  ctx.scale(scale, scale);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 100, 100);
  bgGrad.addColorStop(0, '#1C1C1E');
  bgGrad.addColorStop(1, '#141416');
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, 100, 100, 24);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0, 0, 100, 100, 24);
  ctx.stroke();

  // Accent gradient
  const accGrad = ctx.createLinearGradient(0, 0, 100, 100);
  accGrad.addColorStop(0, '#10b981');
  accGrad.addColorStop(1, '#059669');
  ctx.fillStyle = accGrad;

  // L Vertical bar
  roundRect(ctx, 27, 24, 14, 52, 5);
  ctx.fill();

  // L Horizontal bar
  roundRect(ctx, 27, 62, 46, 14, 5);
  ctx.fill();

  // Accent dot
  ctx.fillStyle = '#10b981';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(73, 27, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Helper to draw auto-scaling amount to prevent ANY overflow
function drawFittedAmount(
  ctx: CanvasRenderingContext2D,
  amountStr: string,
  centerX: number,
  centerY: number,
  maxW: number,
  baseFontSize = 100,
  color = '#0f172a'
) {
  let fontSize = baseFontSize;
  ctx.font = `800 ${fontSize}px "Inter", -apple-system, sans-serif`;
  while (ctx.measureText(amountStr).width > maxW && fontSize > 32) {
    fontSize -= 4;
    ctx.font = `800 ${fontSize}px "Inter", -apple-system, sans-serif`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(amountStr, centerX, centerY);
}

// Helper for text wrapping
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

// Canvas Setup
const setupCanvas = (size: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
};

// Background gradient with subtle glow
const drawModernBackground = (
  ctx: CanvasRenderingContext2D,
  size: number,
  tint: 'emerald' | 'indigo' | 'rose' = 'emerald'
) => {
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(0.5, '#f1f5f9');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(size / 2, size / 2, 80, size / 2, size / 2, size / 2);
  if (tint === 'emerald') {
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
  } else if (tint === 'rose') {
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
  } else {
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
  }
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
};

// Card container
const drawCardContainer = (
  ctx: CanvasRenderingContext2D,
  margin: number,
  width: number,
  height: number,
  radius = 32
) => {
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, margin, margin, width, height, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, margin, width, height, radius);
  ctx.stroke();
};

// Header: Exact "L" logo + User Name / "LEDGER" + Category pill
const drawBrandHeader = (
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  cardMargin: number,
  cardWidth: number,
  rawUserName: string,
  badgeText: string,
  badgeBg: string,
  badgeColor: string
) => {
  const headerY = cardMargin + 40;
  const logoSize = 64;
  const logoX = cardMargin + 40;

  // Draw the official "L" Logo
  if (logoImg) {
    drawRoundedImage(ctx, logoImg, logoX, headerY, logoSize, logoSize, 16);
  } else {
    drawVectorLLogo(ctx, logoX, headerY, logoSize);
  }

  // App Title: user name or "LEDGER" only if not written
  const title = formatAppTitle(rawUserName);

  // Category Pill Badge (Top-Right)
  ctx.font = 'bold 20px "Inter", sans-serif';
  const pillPaddingX = 20;
  const pillW = ctx.measureText(badgeText).width + pillPaddingX * 2;
  const pillH = 46;
  const pillX = cardMargin + cardWidth - 40 - pillW;
  const pillY = headerY + 9;

  ctx.fillStyle = badgeBg;
  roundRect(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.fill();

  ctx.fillStyle = badgeColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, pillX + pillW / 2, pillY + pillH / 2 + 1);

  // Title text with auto-fitting between logo and pill
  const textX = logoX + logoSize + 18;
  const availableTitleW = pillX - textX - 16;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';

  let titleSize = 28;
  ctx.font = `bold ${titleSize}px "Inter", -apple-system, sans-serif`;
  while (ctx.measureText(title).width > availableTitleW && titleSize > 18) {
    titleSize -= 2;
    ctx.font = `bold ${titleSize}px "Inter", -apple-system, sans-serif`;
  }
  ctx.fillText(title, textX, headerY + 6);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 17px "Inter", sans-serif';
  ctx.fillText("Official Financial Record", textX, headerY + 38);
};

// Footer with verification seal
const drawModernFooter = (
  ctx: CanvasRenderingContext2D,
  size: number,
  cardMargin: number,
  cardWidth: number,
  footerY: number,
  counterpartyLabel: string,
  counterpartyName: string,
  profileId: string,
  rawUserName: string
) => {
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardMargin + 40, footerY);
  ctx.lineTo(cardMargin + cardWidth - 40, footerY);
  ctx.stroke();

  const contentY = footerY + 28;

  // Counterparty info (Left)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px "Inter", sans-serif';
  ctx.fillText(counterpartyLabel.toUpperCase(), cardMargin + 40, contentY);

  // Auto-fit counterparty name
  ctx.fillStyle = '#0f172a';
  let nameSize = 26;
  ctx.font = `bold ${nameSize}px "Inter", sans-serif`;
  const maxNameW = cardWidth * 0.55;
  while (ctx.measureText(counterpartyName).width > maxNameW && nameSize > 18) {
    nameSize -= 2;
    ctx.font = `bold ${nameSize}px "Inter", sans-serif`;
  }
  ctx.fillText(counterpartyName, cardMargin + 40, contentY + 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 17px "Inter", monospace';
  ctx.fillText(`ID: ${profileId}`, cardMargin + 40, contentY + 64);

  // Digital Verification Badge (Right)
  const rightX = cardMargin + cardWidth - 40;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.fillText("✓ VERIFIED DOSSIER", rightX, contentY + 14);

  const brandLabel = formatAppTitle(rawUserName);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillText(`Secured via ${brandLabel}`, rightX, contentY + 46);
  ctx.fillText(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    rightX,
    contentY + 70
  );
};

// ==========================================
// 1. PAYMENT REQUEST / SETTLEMENT CARD
// ==========================================
export const generateShareCard = async (
  fromName: string,
  name: string,
  profileId: string,
  amount: number,
  currency: string,
  dueDate: Date | null,
  isOverdue: boolean,
  daysDiff: number,
  customMessage: string
): Promise<File | null> => {
  const size = 1080;
  const { canvas, ctx } = setupCanvas(size);
  if (!ctx) return null;

  const logoImg = await getAppLogoImage();

  let tint: 'emerald' | 'indigo' | 'rose' = 'emerald';
  let badgeText = 'SETTLEMENT REQUEST';
  let badgeBg = '#ecfdf5';
  let badgeColor = '#059669';

  if (isOverdue) {
    tint = 'rose';
    badgeText = 'PAYMENT OVERDUE';
    badgeBg = '#fef2f2';
    badgeColor = '#dc2626';
  } else if (daysDiff <= 1) {
    tint = 'indigo';
    badgeText = 'SETTLEMENT DUE';
    badgeBg = '#eff6ff';
    badgeColor = '#2563eb';
  }

  drawModernBackground(ctx, size, tint);

  const cardMargin = 60;
  const cardWidth = size - cardMargin * 2;
  const cardHeight = size - cardMargin * 2;

  drawCardContainer(ctx, cardMargin, cardWidth, cardHeight, 32);
  drawBrandHeader(ctx, logoImg, cardMargin, cardWidth, fromName, badgeText, badgeBg, badgeColor);

  // Amount Section
  const amountSectionY = cardMargin + 180;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillText("TOTAL OUTSTANDING AMOUNT", size / 2, amountSectionY);

  const formattedAmount = `${currency}${Math.round(amount).toLocaleString('en-IN')}`;
  drawFittedAmount(
    ctx,
    formattedAmount,
    size / 2,
    amountSectionY + 95,
    cardWidth - 80,
    110,
    isOverdue ? '#dc2626' : '#0f172a'
  );

  // Status Chip
  let statusText = 'NO DEADLINE SPECIFIED';
  if (dueDate) {
    if (isOverdue) {
      statusText = `OVERDUE BY ${Math.abs(daysDiff)} DAYS`;
    } else if (daysDiff === 0) {
      statusText = `DUE TODAY`;
    } else {
      statusText = `${daysDiff} DAYS REMAINING`;
    }
  }

  ctx.font = 'bold 22px "Inter", sans-serif';
  const chipW = ctx.measureText(statusText).width + 48;
  const chipH = 50;
  const chipX = (size - chipW) / 2;
  const chipY = amountSectionY + 180;

  ctx.fillStyle = isOverdue ? '#fee2e2' : '#f1f5f9';
  roundRect(ctx, chipX, chipY, chipW, chipH, 25);
  ctx.fill();

  ctx.fillStyle = isOverdue ? '#b91c1c' : '#334155';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusText, size / 2, chipY + chipH / 2);

  // Message Box
  if (customMessage && customMessage.trim().length > 0) {
    const msgBoxY = chipY + chipH + 35;
    const msgBoxW = cardWidth - 80;
    const msgBoxH = 140;
    const msgBoxX = cardMargin + 40;

    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, msgBoxX, msgBoxY, msgBoxW, msgBoxH, 20);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    roundRect(ctx, msgBoxX, msgBoxY, msgBoxW, msgBoxH, 20);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    wrapText(ctx, `"${customMessage}"`, size / 2, msgBoxY + 36, msgBoxW - 40, 36);
  }

  // Modern Footer
  const footerY = cardMargin + cardHeight - 160;
  drawModernFooter(
    ctx,
    size,
    cardMargin,
    cardWidth,
    footerY,
    "Payment Requested From",
    name,
    profileId,
    fromName
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `Payment_Request_${name.replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
};

// ==========================================
// 2. OFFICIAL REPAYMENT RECEIPT CARD
// ==========================================
export const generateReceiptCard = async (
  fromName: string,
  payerName: string,
  profileId: string,
  amountPaid: number,
  currency: string,
  timeliness: 'early' | 'ontime' | 'late',
  remainingBalance: number,
  customMessage: string
): Promise<File | null> => {
  const size = 1080;
  const { canvas, ctx } = setupCanvas(size);
  if (!ctx) return null;

  const logoImg = await getAppLogoImage();

  drawModernBackground(ctx, size, 'emerald');

  const cardMargin = 60;
  const cardWidth = size - cardMargin * 2;
  const cardHeight = size - cardMargin * 2;

  drawCardContainer(ctx, cardMargin, cardWidth, cardHeight, 32);
  drawBrandHeader(ctx, logoImg, cardMargin, cardWidth, fromName, 'PAYMENT RECEIPT', '#ecfdf5', '#059669');

  // Amount Received
  const amountSectionY = cardMargin + 175;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillText("PAYMENT RECEIVED", size / 2, amountSectionY);

  const formattedAmount = `${currency}${Math.round(amountPaid).toLocaleString('en-IN')}`;
  drawFittedAmount(ctx, formattedAmount, size / 2, amountSectionY + 90, cardWidth - 80, 110, '#059669');

  // Status Chip
  let statusText = "PAID ON SCHEDULE";
  let chipBg = "#ecfdf5";
  let chipColor = "#059669";
  if (timeliness === 'early') {
    statusText = "EARLY SETTLEMENT";
    chipBg = "#ecfdf5";
    chipColor = "#047857";
  } else if (timeliness === 'late') {
    statusText = "SETTLED (LATE)";
    chipBg = "#fffbeb";
    chipColor = "#b45309";
  }

  ctx.font = 'bold 22px "Inter", sans-serif';
  const chipW = ctx.measureText(statusText).width + 48;
  const chipH = 48;
  const chipX = (size - chipW) / 2;
  const chipY = amountSectionY + 175;

  ctx.fillStyle = chipBg;
  roundRect(ctx, chipX, chipY, chipW, chipH, 24);
  ctx.fill();

  ctx.fillStyle = chipColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusText, size / 2, chipY + chipH / 2);

  // Remaining Balance Metric Card
  const balanceBoxY = chipY + chipH + 30;
  const balanceBoxW = cardWidth - 80;
  const balanceBoxH = 120;
  const balanceBoxX = cardMargin + 40;

  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, balanceBoxX, balanceBoxY, balanceBoxW, balanceBoxH, 20);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, balanceBoxX, balanceBoxY, balanceBoxW, balanceBoxH, 20);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("OUTSTANDING BALANCE", balanceBoxX + 32, balanceBoxY + 36);

  ctx.textAlign = 'right';
  ctx.font = 'bold 36px "Inter", sans-serif';
  ctx.fillStyle = remainingBalance <= 0 ? '#059669' : '#0f172a';
  const balStr = remainingBalance <= 0 ? 'FULLY SETTLED' : `${currency}${Math.round(remainingBalance).toLocaleString('en-IN')}`;
  ctx.fillText(balStr, balanceBoxX + balanceBoxW - 32, balanceBoxY + 44);

  // Note
  if (customMessage && customMessage.trim().length > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 20px "Inter", sans-serif';
    ctx.fillText(`"${customMessage}"`, size / 2, balanceBoxY + balanceBoxH + 30);
  }

  // Modern Footer
  const footerY = cardMargin + cardHeight - 160;
  drawModernFooter(
    ctx,
    size,
    cardMargin,
    cardWidth,
    footerY,
    "Received With Thanks From",
    payerName,
    profileId,
    fromName
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `Payment_Receipt_${payerName.replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
};

// ==========================================
// 3. LOAN DISBURSEMENT / PROMISSORY NOTE CARD
// ==========================================
export const generateLoanCard = async (
  fromName: string,
  borrowerName: string,
  profileId: string,
  amount: number,
  currency: string,
  startDate: string,
  returnDate: string,
  interestRate: number,
  interestType: string,
  interestFree: boolean,
  notes: string
): Promise<File | null> => {
  const size = 1080;
  const { canvas, ctx } = setupCanvas(size);
  if (!ctx) return null;

  const logoImg = await getAppLogoImage();

  drawModernBackground(ctx, size, 'indigo');

  const cardMargin = 60;
  const cardWidth = size - cardMargin * 2;
  const cardHeight = size - cardMargin * 2;

  drawCardContainer(ctx, cardMargin, cardWidth, cardHeight, 32);
  drawBrandHeader(ctx, logoImg, cardMargin, cardWidth, fromName, 'LOAN DISBURSEMENT', '#eff6ff', '#2563eb');

  // Amount
  const amountSectionY = cardMargin + 160;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillText("PRINCIPAL ADVANCE", size / 2, amountSectionY);

  const formattedAmount = `${currency}${Math.round(amount).toLocaleString('en-IN')}`;
  drawFittedAmount(ctx, formattedAmount, size / 2, amountSectionY + 80, cardWidth - 80, 100, '#0f172a');

  // Key Terms Table Box
  const tableY = amountSectionY + 160;
  const tableW = cardWidth - 80;
  const tableX = cardMargin + 40;
  const tableH = 240;

  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, tableX, tableY, tableW, tableH, 20);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, tableX, tableY, tableW, tableH, 20);
  ctx.stroke();

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  let rowY = tableY + 38;
  const rowStep = 55;

  const drawDataRow = (label: string, value: string, isAccent = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillText(label, tableX + 32, rowY);

    ctx.textAlign = 'right';
    ctx.fillStyle = isAccent ? '#2563eb' : '#0f172a';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillText(value, tableX + tableW - 32, rowY);

    if (rowY < tableY + tableH - 40) {
      ctx.strokeStyle = '#edf2f7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX + 32, rowY + 18);
      ctx.lineTo(tableX + tableW - 32, rowY + 18);
      ctx.stroke();
    }

    rowY += rowStep;
  };

  drawDataRow("Disbursement Date", fmtDate(startDate));
  drawDataRow("Agreed Due Date", fmtDate(returnDate));

  let interestStr = "0% (Fixed Principal)";
  if (interestRate > 0) {
    const tStr = interestType === 'none' ? 'Flat' : interestType.toUpperCase();
    interestStr = `${interestRate}% ${tStr}`;
  }
  drawDataRow("Interest Rate", interestStr, interestRate > 0);

  if (interestFree && interestRate > 0) {
    drawDataRow("Waiver Term", "0% If Paid Before Due Date", true);
  } else if (notes) {
    const noteText = notes.length > 30 ? notes.slice(0, 28) + '...' : notes;
    drawDataRow("Reference / Note", noteText);
  }

  // Modern Footer
  const footerY = cardMargin + cardHeight - 160;
  drawModernFooter(
    ctx,
    size,
    cardMargin,
    cardWidth,
    footerY,
    "Borrower Agreement With",
    borrowerName,
    profileId,
    fromName
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `Loan_Note_${borrowerName.replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
};

// ==========================================
// 4. DIGITAL UPI PAYMENT QR CARD
// ==========================================
export const generateUPIQrCard = async (
  qrUrl: string,
  userName: string,
  amount: string,
  vpa: string
): Promise<File | null> => {
  const size = 1080;
  const { canvas, ctx } = setupCanvas(size);
  if (!ctx) return null;

  const logoImg = await getAppLogoImage();

  drawModernBackground(ctx, size, 'emerald');

  const cardMargin = 60;
  const cardWidth = size - cardMargin * 2;
  const cardHeight = size - cardMargin * 2;

  drawCardContainer(ctx, cardMargin, cardWidth, cardHeight, 32);
  drawBrandHeader(ctx, logoImg, cardMargin, cardWidth, userName, 'UPI INSTANT PAY', '#ecfdf5', '#059669');

  // Amount if provided
  let currentY = cardMargin + 155;
  if (amount && Number(amount) > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillText("PAYMENT AMOUNT", size / 2, currentY);

    const formattedAmount = `₹${Number(amount).toLocaleString('en-IN')}`;
    drawFittedAmount(ctx, formattedAmount, size / 2, currentY + 68, cardWidth - 80, 80, '#0f172a');
    currentY += 140;
  } else {
    currentY += 20;
  }

  // Draw QR Image
  try {
    const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrUrl;
    });

    const qrSize = 380;
    const qrX = (size - qrSize) / 2;
    const qrY = currentY;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
    ctx.stroke();

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch (e) {
    console.error('Failed to draw QR image:', e);
  }

  // VPA details
  const vpaY = cardMargin + cardHeight - 170;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillText(userName || 'Ledger User', size / 2, vpaY);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 22px "Inter", monospace';
  ctx.fillText(vpa, size / 2, vpaY + 40);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillText("Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)", size / 2, vpaY + 80);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `UPI_QR_${userName.replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
};
