/**
 * Utility for normalizing and formatting phone numbers across the app.
 * Ensures consistent international E.164 and digits-only formats for:
 * - Direct SMS intents (sms:+919876543210?body=...)
 * - WhatsApp Click-to-Chat (wa.me / whatsapp://)
 * - Native Dial intents (tel:+919876543210)
 */

export interface NormalizedPhone {
  e164: string;         // E.g. "+919876543210" (for SMS & tel intents)
  digitsOnly: string;   // E.g. "919876543210" (for wa.me / WhatsApp links)
  isValid: boolean;
}

export function normalizePhoneNumber(rawPhone?: string | null, currency: string = '₹'): NormalizedPhone {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { e164: '', digitsOnly: '', isValid: false };
  }

  // 1. Remove all spaces, hyphens, brackets, dots, and non-digit non-plus characters
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]+/g, '').replace(/[^\d+]/g, '');

  if (!cleaned) {
    return { e164: '', digitsOnly: '', isValid: false };
  }

  // 2. Handle international prefix "00" (e.g. 00919876543210 -> +919876543210)
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // 3. If it already starts with '+', remove any stray '+' inside
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return {
      e164: `+${digits}`,
      digitsOnly: digits,
      isValid: digits.length >= 7
    };
  }

  // 4. Remove leading zero if 11 digits (STD / trunk zero like 09876543210 -> 9876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  const pureDigits = cleaned.replace(/\D/g, '');

  // 5. Handle standard 10-digit mobile numbers
  if (pureDigits.length === 10) {
    // If currency is ₹ or starts with 6,7,8,9 (Standard Indian mobile numbers)
    if (currency === '₹' || /^[6-9]/.test(pureDigits)) {
      return {
        e164: `+91${pureDigits}`,
        digitsOnly: `91${pureDigits}`,
        isValid: true
      };
    } else if (currency === '$') {
      return {
        e164: `+1${pureDigits}`,
        digitsOnly: `1${pureDigits}`,
        isValid: true
      };
    } else {
      // Default fallback for 10-digit numbers
      return {
        e164: `+91${pureDigits}`,
        digitsOnly: `91${pureDigits}`,
        isValid: true
      };
    }
  }

  // 6. Handle 12-digit number already having India country code without + (e.g. 919876543210)
  if (pureDigits.length === 12 && pureDigits.startsWith('91')) {
    return {
      e164: `+${pureDigits}`,
      digitsOnly: pureDigits,
      isValid: true
    };
  }

  // 7. Handle 11-digit US number without + (e.g. 14155551234)
  if (pureDigits.length === 11 && pureDigits.startsWith('1')) {
    return {
      e164: `+${pureDigits}`,
      digitsOnly: pureDigits,
      isValid: true
    };
  }

  // Fallback: prepend '+' to digits if >= 7 digits
  return {
    e164: `+${pureDigits}`,
    digitsOnly: pureDigits,
    isValid: pureDigits.length >= 7
  };
}
