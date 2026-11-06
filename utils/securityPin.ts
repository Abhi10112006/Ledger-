/**
 * Hardware Keystore & WebCrypto 6-digit PIN hashing and verification.
 * Supports Android Keystore (Titan M / TEE / TrustZone) via NativeSecurityPlugin
 * with seamless WebCrypto SHA-256 fallback for web environments.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeSecurityPluginInterface {
  getBiometricStatus(): Promise<{
    isAvailable: boolean;
    hasFingerprint: boolean;
    hasFaceLock: boolean;
    canUseWeakFace: boolean;
  }>;
  authenticateBiometric(options?: {
    title?: string;
    subtitle?: string;
    negativeButtonText?: string;
    mode?: string;
  }): Promise<{
    success: boolean;
    cancelled?: boolean;
    usePin?: boolean;
    error?: string;
    errorCode?: number;
  }>;
  isAuthenticating(): Promise<{ isAuthenticating: boolean }>;
  setSecurityPin(options: { pin: string }): Promise<{ success: boolean; isEnrolled: boolean }>;
  verifySecurityPin(options: { pin: string }): Promise<{ success: boolean; isEnrolled?: boolean; error?: string }>;
  isPinEnrolled(): Promise<{ isEnrolled: boolean }>;
  removeSecurityPin(): Promise<{ success: boolean; isEnrolled: boolean }>;
  getKeystoreMasterStatus(): Promise<{ isHardwareBacked: boolean; alias: string; ready: boolean }>;
  encryptWithMasterKey(options: { data: string }): Promise<{ cipherText: string; iv: string }>;
  decryptWithMasterKey(options: { cipherText: string; iv: string }): Promise<{ data: string }>;
}

export const NativeSecurity = registerPlugin<NativeSecurityPluginInterface>('NativeSecurity');

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

/**
 * Enrolls a 6-digit PIN in hardware Android KeyStore if native,
 * and always returns the WebCrypto hash for synchronized state.
 */
export const saveSecurityPinHardware = async (pin: string): Promise<string> => {
  const cleanPin = pin.trim();
  if (!isPinFormatValid(cleanPin)) {
    throw new Error("PIN must be exactly 6 digits.");
  }

  // 1. Hardware Keystore enrollment on native Android
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeSecurity.setSecurityPin({ pin: cleanPin });
    } catch (e) {
      console.warn("Hardware Keystore PIN enrollment warning:", e);
    }
  }

  // 2. Generate standard hash for storage
  return await hashSecurityPin(cleanPin);
};

/**
 * Verifies a 6-digit PIN. Checks Hardware Keystore first,
 * falling back to hash comparison if needed.
 */
export const verifySecurityPin = async (inputPin: string, storedHash?: string): Promise<boolean> => {
  const cleanPin = inputPin.trim();
  if (!isPinFormatValid(cleanPin)) {
    return false;
  }

  // 1. Hardware Keystore verification on native Android
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeSecurity.verifySecurityPin({ pin: cleanPin });
      if (res && res.isEnrolled) {
        return !!res.success;
      }
    } catch (e) {
      console.warn("Hardware Keystore verification fallback to hash:", e);
    }
  }

  // 2. Fallback to WebCrypto SHA-256 hash
  if (!storedHash || !storedHash.trim()) {
    return false;
  }
  try {
    const inputHash = await hashSecurityPin(cleanPin);
    return inputHash === storedHash.trim();
  } catch (err) {
    return false;
  }
};

/**
 * Removes PIN from hardware keystore
 */
export const removeSecurityPinHardware = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeSecurity.removeSecurityPin();
    } catch (e) {
      console.warn("Failed to remove hardware PIN:", e);
    }
  }
};
