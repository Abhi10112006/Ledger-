import { Capacitor } from '@capacitor/core';
import { NativeSecurity } from '../utils/securityPin';

export enum BiometryType {
  NONE = 0,
  TOUCH_ID = 1,
  FACE_ID = 2,
  FINGERPRINT = 3,
  FACE_AUTHENTICATION = 4,
  IRIS_AUTHENTICATION = 5,
  MULTIPLE = 6,
  DEVICE_CREDENTIAL = 7,
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: BiometryType;
  biometryName: string;
  hasFingerprint: boolean;
  hasFaceLock: boolean;
  deviceIsSecure: boolean;
}

export interface VerifyResult {
  success: boolean;
  cancelled?: boolean;
  usePin?: boolean;
  error?: string;
}

export const getBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  if (!Capacitor.isNativePlatform()) {
    return {
      isAvailable: true,
      biometryType: BiometryType.FINGERPRINT,
      biometryName: 'Biometrics (Simulated)',
      hasFingerprint: true,
      hasFaceLock: false,
      deviceIsSecure: true,
    };
  }

  try {
    const status = await NativeSecurity.getBiometricStatus();
    const isAvail = !!status.isAvailable;
    let bType = BiometryType.NONE;
    let name = 'None';

    if (status.hasFingerprint && status.hasFaceLock) {
      bType = BiometryType.MULTIPLE;
      name = 'Fingerprint & Face Lock';
    } else if (status.hasFaceLock) {
      bType = BiometryType.FACE_AUTHENTICATION;
      name = 'Face Lock';
    } else if (status.hasFingerprint) {
      bType = BiometryType.FINGERPRINT;
      name = 'Fingerprint';
    }

    return {
      isAvailable: isAvail,
      biometryType: bType,
      biometryName: name,
      hasFingerprint: !!status.hasFingerprint,
      hasFaceLock: !!status.hasFaceLock,
      deviceIsSecure: isAvail,
    };
  } catch (err) {
    console.warn('Failed to query biometric availability via NativeSecurity:', err);
    return {
      isAvailable: false,
      biometryType: BiometryType.NONE,
      biometryName: 'None',
      hasFingerprint: false,
      hasFaceLock: false,
      deviceIsSecure: false,
    };
  }
};

export const verifyFingerprint = async (
  reason = 'Touch the fingerprint sensor to unlock Ledger.'
): Promise<VerifyResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { success: true };
  }

  try {
    const res = await NativeSecurity.authenticateBiometric({
      title: 'Fingerprint Unlock',
      subtitle: reason,
      negativeButtonText: 'Use 6-Digit PIN',
      mode: 'fingerprint',
    });
    return {
      success: !!res.success,
      cancelled: !!res.cancelled,
      usePin: !!res.usePin,
      error: res.error,
    };
  } catch (e: any) {
    console.warn('Fingerprint verification failed:', e);
    return { success: false, error: e?.message || 'Fingerprint verification cancelled.' };
  }
};

export const verifyFaceLock = async (
  reason = 'Look at the front camera to unlock Ledger.'
): Promise<VerifyResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { success: true };
  }

  try {
    const res = await NativeSecurity.authenticateBiometric({
      title: 'Face Lock Unlock',
      subtitle: reason,
      negativeButtonText: 'Use 6-Digit PIN',
      mode: 'face',
    });
    return {
      success: !!res.success,
      cancelled: !!res.cancelled,
      usePin: !!res.usePin,
      error: res.error,
    };
  } catch (e: any) {
    console.warn('Face verification failed:', e);
    return { success: false, error: e?.message || 'Face verification cancelled.' };
  }
};

export const verifyUserIdentity = async (
  reason = 'Authorize secure access to Ledger'
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const res = await NativeSecurity.authenticateBiometric({
      title: 'Security Verification',
      subtitle: reason,
      negativeButtonText: 'Cancel',
      mode: 'any',
    });
    return !!res.success;
  } catch (e) {
    console.error('Biometric authentication failed or was cancelled', e);
    return false;
  }
};
