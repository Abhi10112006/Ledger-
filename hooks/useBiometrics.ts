import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: BiometryType;
  biometryName: string;
  hasFingerprint: boolean;
  hasFaceLock: boolean;
  deviceIsSecure: boolean;
}

export const getBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  if (!Capacitor.isNativePlatform()) {
    // In web / browser testing
    return {
      isAvailable: true,
      biometryType: BiometryType.MULTIPLE,
      biometryName: 'Biometrics (Simulated)',
      hasFingerprint: true,
      hasFaceLock: true,
      deviceIsSecure: true,
    };
  }

  try {
    const result = await NativeBiometric.isAvailable();
    const type = result.biometryType;
    let name = 'Biometrics';
    let hasFingerprint = false;
    let hasFaceLock = false;

    if (type === BiometryType.FINGERPRINT || type === BiometryType.TOUCH_ID) {
      name = 'Fingerprint';
      hasFingerprint = true;
    } else if (type === BiometryType.FACE_ID || type === BiometryType.FACE_AUTHENTICATION) {
      name = 'Face Lock';
      hasFaceLock = true;
    } else if (type === BiometryType.MULTIPLE || type === BiometryType.DEVICE_CREDENTIAL) {
      name = 'Biometrics & Face';
      hasFingerprint = true;
      hasFaceLock = true;
    } else {
      hasFingerprint = true;
      hasFaceLock = true;
    }

    return {
      isAvailable: !!result.isAvailable,
      biometryType: type,
      biometryName: name,
      hasFingerprint,
      hasFaceLock,
      deviceIsSecure: !!result.deviceIsSecure,
    };
  } catch (err) {
    console.warn('Failed to query biometric availability:', err);
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
): Promise<{ success: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) {
    // Browser simulated success for testing
    return { success: true };
  }

  try {
    const caps = await getBiometricCapabilities();
    if (!caps.isAvailable) {
      return { success: false, error: 'Fingerprint sensor is not available on this device.' };
    }

    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Fingerprint Unlock',
      subtitle: 'Touch the fingerprint sensor to access your ledger.',
      negativeButtonText: 'Use 6-Digit PIN',
      maxAttempts: 3,
    });
    return { success: true };
  } catch (e: any) {
    console.warn('Fingerprint verification failed or was dismissed:', e);
    return { success: false, error: e?.message || 'Fingerprint verification cancelled.' };
  }
};

export const verifyFaceLock = async (
  reason = 'Scan your face to unlock Ledger.'
): Promise<{ success: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) {
    // Browser simulated success for testing
    return { success: true };
  }

  try {
    const caps = await getBiometricCapabilities();
    if (!caps.isAvailable) {
      return { success: false, error: 'Face biometric sensor is not available on this device.' };
    }

    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Face Lock Verification',
      subtitle: 'Look at the front camera to verify face authentication.',
      negativeButtonText: 'Use 6-Digit PIN',
      maxAttempts: 3,
    });
    return { success: true };
  } catch (e: any) {
    console.warn('Face verification failed or was dismissed:', e);
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
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) return true;

    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Security Verification',
      subtitle: 'Confirm your fingerprint or face scan to proceed.',
      negativeButtonText: 'Use PIN',
      maxAttempts: 3,
    });
    return true;
  } catch (e) {
    console.error('Biometric authentication failed or was cancelled', e);
    return false;
  }
};
