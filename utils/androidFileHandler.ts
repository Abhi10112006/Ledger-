import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor, registerPlugin } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

interface NativeBackupPluginInterface {
  encrypt(options: { data: string }): Promise<{ encryptedData: string; version?: number }>;
  decrypt(options: { encryptedData: string }): Promise<{ data: string }>;
  saveToLedgerFolder(options: {
    fileName: string;
    subfolder: string;
    base64Data: string;
    mimeType: string;
  }): Promise<{ success: boolean; uri: string; path: string }>;
}

const NativeBackup = registerPlugin<NativeBackupPluginInterface>('NativeBackup');

export type LedgerFolderCategory = 'Backups' | 'Statements' | 'Excel Reports' | 'Receipts';

/**
 * Converts a string or Blob into a raw base64 string (without data URL prefix).
 */
export async function toRawBase64(data: string | Blob): Promise<string> {
  if (typeof data === 'string') {
    // Check if it's already a base64 string
    if (/^[A-Za-z0-9+/=]+$/.test(data.trim()) && data.length % 4 === 0 && data.length > 32) {
      return data.trim();
    }
    // Encode UTF-8 string to base64
    return btoa(unescape(encodeURIComponent(data)));
  }

  // Blob to Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read blob data'));
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.readAsDataURL(data);
  });
}

/**
 * Saves a file into the user's primary internal storage under Documents/Ledger/<subfolder>/
 * Automatically notifies MediaScanner on Android so the file appears immediately in File Manager apps.
 */
export async function saveToLedgerStorage(
  fileName: string,
  data: string | Blob,
  subfolder: LedgerFolderCategory,
  mimeType: string,
  title: string
): Promise<{ success: boolean; path?: string; uri?: string; error?: string }> {
  try {
    const base64 = await toRawBase64(data);

    if (isNative) {
      try {
        const res = await NativeBackup.saveToLedgerFolder({
          fileName,
          subfolder,
          base64Data: base64,
          mimeType,
        });

        window.dispatchEvent(
          new CustomEvent('abhi-ledger-toast', {
            detail: {
              message: `Saved to ${res.path}`,
              type: 'success',
              duration: 4000,
            },
          })
        );

        return { success: true, path: res.path, uri: res.uri };
      } catch (nativeErr: any) {
        console.warn('Native saveToLedgerFolder error, trying filesystem fallback:', nativeErr);

        // Fallback: Capacitor Filesystem Documents
        const saved = await Filesystem.writeFile({
          path: `Ledger/${subfolder}/${fileName}`,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });

        const fallbackPath = `Documents/Ledger/${subfolder}/${fileName}`;
        window.dispatchEvent(
          new CustomEvent('abhi-ledger-toast', {
            detail: {
              message: `Saved to ${fallbackPath}`,
              type: 'success',
              duration: 4000,
            },
          })
        );

        return { success: true, path: fallbackPath, uri: saved.uri };
      }
    }

    // Web browser fallback: trigger direct browser download
    const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.dispatchEvent(
      new CustomEvent('abhi-ledger-toast', {
        detail: {
          message: `Downloaded: ${fileName}`,
          type: 'success',
          duration: 3500,
        },
      })
    );

    return { success: true, path: fileName };
  } catch (err: any) {
    console.error('saveToLedgerStorage failed:', err);
    window.dispatchEvent(
      new CustomEvent('abhi-ledger-toast', {
        detail: {
          message: `Failed to save ${fileName}: ${err?.message || 'Permission denied'}`,
          type: 'error',
          duration: 4000,
        },
      })
    );
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Shares a file using the system share sheet (WhatsApp, Drive, Gmail, etc.)
 */
export async function shareFile(
  fileName: string,
  base64Data: string,
  mimeType: string,
  title: string,
  text?: string
): Promise<boolean> {
  try {
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const shareOptions: any = {
      title,
      files: [savedFile.uri],
    };

    if (text && text.trim().length > 0) {
      shareOptions.text = text;
    }

    await Share.share(shareOptions);
    return true;
  } catch (error) {
    console.error('Error sharing file:', error);
    return false;
  }
}

/**
 * Saves to public organized Ledger subfolder AND offers system share.
 */
export async function downloadOrShare(
  fileName: string,
  data: string | Blob,
  mimeType: string,
  title: string,
  text?: string
): Promise<boolean> {
  // Determine appropriate subfolder
  let subfolder: LedgerFolderCategory = 'Statements';
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.ledgerbak') || lowerName.endsWith('.json') || lowerName.endsWith('.bak')) {
    subfolder = 'Backups';
  } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
    subfolder = 'Excel Reports';
  } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    subfolder = 'Receipts';
  }

  // 1. Save to user's organized internal storage
  const saveResult = await saveToLedgerStorage(fileName, data, subfolder, mimeType, title);

  // 2. If native, also present share sheet so user can send immediately via WhatsApp/Email if desired
  if (isNative) {
    try {
      const base64 = await toRawBase64(data);
      await shareFile(fileName, base64, mimeType, title, text);
    } catch (shareErr) {
      console.warn('System share sheet cancelled or unavailable:', shareErr);
    }
  }

  return saveResult.success;
}

/**
 * Legacy compatibility alias for existing callers.
 */
export async function saveToDocuments(
  fileName: string,
  data: string | Blob,
  title: string
): Promise<boolean> {
  let subfolder: LedgerFolderCategory = 'Statements';
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.ledgerbak') || lowerName.endsWith('.json')) {
    subfolder = 'Backups';
  } else if (lowerName.endsWith('.xlsx')) {
    subfolder = 'Excel Reports';
  } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg')) {
    subfolder = 'Receipts';
  }

  const mimeType = lowerName.endsWith('.pdf')
    ? 'application/pdf'
    : lowerName.endsWith('.xlsx')
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/octet-stream';

  const res = await saveToLedgerStorage(fileName, data, subfolder, mimeType, title);
  return res.success;
}
