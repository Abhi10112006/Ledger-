/**
 * Secure 6-digit PIN hashing and verification using WebCrypto SHA-256.
 */

const PIN_SALT = "AbhiLedger_SecurityPin_Salt_2026_#X9";

export const isPinFormatValid = (pin: string): boolean => {
  return /^\d{6}$/.test(pin.trim());
};

export const hashSecurityPin = async (pin: string): Promise<string> => {
  const cleanPin = pin.trim();
  if (!isPinFormatValid(cleanPin)) {
    throw new Error("PIN must be exactly 6 digits.");
  }

  const enc = new TextEncoder();
  const data = enc.encode(`${PIN_SALT}:${cleanPin}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifySecurityPin = async (inputPin: string, storedHash?: string): Promise<boolean> => {
  if (!storedHash || !storedHash.trim()) {
    return false;
  }
  try {
    const inputHash = await hashSecurityPin(inputPin);
    return inputHash === storedHash.trim();
  } catch (err) {
    return false;
  }
};
