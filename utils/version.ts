/**
 * Version Management Utility with 1-Tap Direct In-App APK Download & Install
 * 
 * How it works:
 * - APP_VERSION is the hardcoded current version of the APK.
 * - On startup and periodically in the background, the app fetches `version.json` from GitHub.
 * - If the remote version is newer:
 *   1. System tray notification alerts the user even if the app is in background/closed.
 *   2. In-app UpdateBanner appears with a 1-Tap "Direct Install" button.
 *   3. NativeAppUpdate plugin downloads the APK with live percentage feedback.
 *   4. Android's native package installer dialog is invoked directly via FileProvider.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

export const APP_VERSION = '3.5.0';
export const APP_VERSION_NAME = 'Fintech Pro Overhaul';

// Primary URL: raw GitHub file from the app's actual repository
const VERSION_URL = 'https://raw.githubusercontent.com/Abhi10112006/Ledger-/main/public/version.json';

// Fallback URL — Vercel deployment of the same app
const VERSION_URL_FALLBACK = 'https://ledger69.vercel.app/version.json';

export interface VersionInfo {
  version: string;
  versionName: string;
  releaseDate: string;
  changelog: string[];
  downloadUrl?: string;
  apkUrl?: string;
  isForced?: boolean; // if true, user cannot dismiss the update banner
}

export interface DownloadProgressEvent {
  progress: number; // 0 to 100
  bytesDownloaded?: number;
  totalBytes?: number;
  status: 'downloading' | 'installing' | 'completed' | 'error';
  filePath?: string;
  error?: string;
}

export interface NativeAppUpdatePluginInterface {
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean }>;
  downloadAndInstall(options: { apkUrl: string; version?: string }): Promise<{ success: boolean; filePath?: string }>;
  installApk(options?: { filePath?: string; version?: string }): Promise<{ success: boolean }>;
  scheduleBackgroundCheck(): Promise<{ scheduled: boolean }>;
  checkNow(): Promise<{ checking: boolean }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (event: DownloadProgressEvent) => void
  ): Promise<{ remove: () => void }>;
}

export const NativeAppUpdate = registerPlugin<NativeAppUpdatePluginInterface>('NativeAppUpdate');

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Checks if the app currently has permission to install unknown apps (Android 8.0+)
 */
export const canInstallUnknownApps = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return true;
  try {
    const res = await NativeAppUpdate.canRequestPackageInstalls();
    return !!res.canInstall;
  } catch {
    return true;
  }
};

/**
 * Opens Android system settings for granting "Install unknown apps" to Abhi's Ledger
 */
export const openInstallPermissionSettings = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const res = await NativeAppUpdate.openInstallPermissionSettings();
    return !!res.opened;
  } catch {
    return false;
  }
};

/**
 * Initiates 1-tap direct in-app download and installation of the new APK.
 */
export const downloadAndInstallApk = async (
  apkUrl: string,
  version: string,
  onProgress?: (event: DownloadProgressEvent) => void
): Promise<{ success: boolean; error?: string }> => {
  if (!isNativeAndroid()) {
    // Web fallback: open direct link in a new tab
    window.open(apkUrl, '_blank');
    return { success: true };
  }

  let listenerHandle: { remove: () => void } | null = null;
  try {
    if (onProgress) {
      listenerHandle = await NativeAppUpdate.addListener('downloadProgress', onProgress);
    }

    const result = await NativeAppUpdate.downloadAndInstall({ apkUrl, version });
    return { success: !!result.success };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Download and installation failed.' };
  } finally {
    if (listenerHandle) {
      listenerHandle.remove();
    }
  }
};

/**
 * Launches the package installer on a previously downloaded APK file.
 */
export const retryInstallApk = async (version: string): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const res = await NativeAppUpdate.installApk({ version });
    return !!res.success;
  } catch {
    return false;
  }
};

/**
 * Schedules periodic background update checks in Android AlarmManager.
 */
export const scheduleBackgroundUpdateCheck = async (): Promise<void> => {
  if (!isNativeAndroid()) return;
  try {
    await NativeAppUpdate.scheduleBackgroundCheck();
  } catch (e) {
    console.warn('[Version] Failed to schedule background check:', e);
  }
};

/**
 * Parses semantic version strings like "2.0.0" and compares them.
 * Returns true if `remote` is newer than `local`.
 */
const isNewerVersion = (local: string, remote: string): boolean => {
  const parse = (v: string) => v.split('.').map(n => parseInt(n.replace(/[^0-9]/g, ''), 10) || 0);
  const [lMaj = 0, lMin = 0, lPatch = 0] = parse(local);
  const [rMaj = 0, rMin = 0, rPatch = 0] = parse(remote);

  if (rMaj !== lMaj) return rMaj > lMaj;
  if (rMin !== lMin) return rMin > lMin;
  return rPatch > lPatch;
};

/**
 * Fetches the remote version manifest.
 * Returns null on network failure — app should continue normally.
 */
export const fetchRemoteVersion = async (): Promise<VersionInfo | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    let response = await fetch(VERSION_URL, {
      cache: 'no-store',
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeout);

    if (!response || !response.ok) {
      // Try fallback
      response = await fetch(VERSION_URL_FALLBACK, { cache: 'no-store' }).catch(() => null);
    }

    if (!response || !response.ok) return null;

    const data: VersionInfo = await response.json();
    // Default apkUrl to direct release asset if not specified
    if (!data.apkUrl && data.version) {
      data.apkUrl = `https://github.com/Abhi10112006/Ledger-/releases/download/v${data.version}/app-release.apk`;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * Main check function.
 * Returns VersionInfo if an update is available, or null if already up-to-date.
 */
export const checkForUpdate = async (): Promise<VersionInfo | null> => {
  const remote = await fetchRemoteVersion();
  if (!remote) return null;

  if (isNewerVersion(APP_VERSION, remote.version)) {
    return remote;
  }

  return null;
};
