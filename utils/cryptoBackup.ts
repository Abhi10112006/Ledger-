import { registerPlugin, Capacitor } from '@capacitor/core';
import { Transaction, AppSettings } from '../types';
import { formatAppTitle } from './branding';
import { downloadOrShare } from './androidFileHandler';

interface NativeBackupPluginInterface {
  encrypt(options: { data: string }): Promise<{ encryptedData: string; version?: number }>;
  decrypt(options: { encryptedData: string }): Promise<{ data: string }>;
}

const NativeBackup = registerPlugin<NativeBackupPluginInterface>('NativeBackup');

const HEADER_V3 = "ABHI_LEDGER_ENCRYPTED_V3:";
const HEADER_V2 = "ABHI_LEDGER_ENCRYPTED_V2:";
const MASTER_SECRET = "AbhiLedgerMasterEncryptedV2_#9871!";
const FIXED_SALT = "AbhiLedgerAppSalt_2026_Secure";
const GCM_IV_LENGTH = 12;

/**
 * WebCrypto fallback for browser development and PWA mode.
 * Matches Native Android PBKDF2-HMAC-SHA256 + AES-256-GCM byte-for-byte.
 */
async function deriveWebCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(MASTER_SECRET),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(FIXED_SALT),
      iterations: 65536,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function webCryptoEncrypt(plainText: string): Promise<string> {
  const key = await deriveWebCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
  const enc = new TextEncoder();
  const encodedData = enc.encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    encodedData
  );

  const cipherArray = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherArray.length);
  combined.set(iv, 0);
  combined.set(cipherArray, iv.length);

  // Convert binary to base64
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  const base64 = btoa(binary);
  return HEADER_V3 + base64;
}

async function webCryptoDecrypt(encryptedPayload: string): Promise<string> {
  const payload = encryptedPayload.trim();
  let base64Content = '';
  if (payload.startsWith(HEADER_V3)) {
    base64Content = payload.substring(HEADER_V3.length);
  } else if (payload.startsWith(HEADER_V2)) {
    base64Content = payload.substring(HEADER_V2.length);
  } else {
    throw new Error('Invalid file format. Not an encrypted Ledger backup file.');
  }
  const binary = atob(base64Content);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  if (combined.length <= GCM_IV_LENGTH) {
    throw new Error('Corrupted backup payload: truncated data');
  }

  const iv = combined.slice(0, GCM_IV_LENGTH);
  const cipherText = combined.slice(GCM_IV_LENGTH);

  const key = await deriveWebCryptoKey();
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    cipherText
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Encrypts string using Native Android Kotlin/Java plugin (or WebCrypto fallback).
 */
export async function encryptData(plainText: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeBackup.encrypt({ data: plainText });
      return res.encryptedData;
    } catch (err) {
      console.warn('NativeBackup plugin failed, falling back to WebCrypto:', err);
      return await webCryptoEncrypt(plainText);
    }
  }
  return await webCryptoEncrypt(plainText);
}

/**
 * Decrypts payload using Native Android Kotlin/Java plugin (or WebCrypto fallback).
 */
export async function decryptData(encryptedPayload: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeBackup.decrypt({ encryptedData: encryptedPayload });
      return res.data;
    } catch (err) {
      console.warn('NativeBackup plugin decrypt failed, trying WebCrypto:', err);
      return await webCryptoDecrypt(encryptedPayload);
    }
  }
  return await webCryptoDecrypt(encryptedPayload);
}

export interface EncryptedBackupPayload {
  version: number;
  appName: string;
  appTitle: string;
  exportedAt: string;
  transactions: Transaction[];
  settings?: AppSettings;
}

/**
 * Packs transactions and settings, encrypts with AES-256-GCM, and downloads/shares as .ledgerbak
 */
export async function exportEncryptedBackup(
  transactions: Transaction[],
  settings: AppSettings
): Promise<{ success: boolean; fileName: string; error?: string }> {
  try {
    const rawPayload: EncryptedBackupPayload = {
      version: 2,
      appName: "Abhi's Ledger",
      appTitle: formatAppTitle(settings.userName),
      exportedAt: new Date().toISOString(),
      transactions,
      settings,
    };

    const jsonStr = JSON.stringify(rawPayload);
    const encryptedString = await encryptData(jsonStr);

    const safeTitle = formatAppTitle(settings.userName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${safeTitle || 'ledger'}_backup_${dateStr}.ledgerbak`;

    await downloadOrShare(
      fileName,
      encryptedString,
      'application/octet-stream',
      'Encrypted Ledger Backup',
      'Encrypted backup file generated by Ledger. Safe to store anywhere.'
    );

    return { success: true, fileName };
  } catch (err: any) {
    console.error('Failed to export encrypted backup:', err);
    return { success: false, fileName: '', error: err?.message || String(err) };
  }
}

/**
 * Reads and decrypts a user-selected backup file (.ledgerbak, new format, or legacy .json).
 */
export async function importBackupFile(
  file: File
): Promise<{ transactions: Transaction[]; settings?: AppSettings }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the backup file.'));
    reader.onload = async (e) => {
      try {
        const rawContent = (e.target?.result as string) || '';
        // Strip BOM and surrounding whitespace
        let content = rawContent.replace(/^\uFEFF/, '').trim();

        let jsonPayload = '';

        // 1. If it's an encrypted backup file (V3 or V2)
        if (content.startsWith(HEADER_V3) || content.startsWith(HEADER_V2)) {
          jsonPayload = await decryptData(content);
        } else {
          // 2. Check if it's base64 encoded text
          try {
            if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length > 30) {
              const decoded = atob(content).trim();
              if (decoded.startsWith(HEADER_V3) || decoded.startsWith(HEADER_V2)) {
                jsonPayload = await decryptData(decoded);
              } else if (decoded.startsWith('{') || decoded.startsWith('[')) {
                jsonPayload = decoded;
              }
            }
          } catch (_) {
            // Not base64, continue
          }

          // 3. If still not set, check if it's plaintext JSON
          if (!jsonPayload) {
            if (content.startsWith('{') || content.startsWith('[')) {
              jsonPayload = content;
            }
          }
        }

        if (!jsonPayload) {
          reject(new Error('Unrecognized backup format. Please select a valid .ledgerbak, .json, or .bak file.'));
          return;
        }

        const parsed = JSON.parse(jsonPayload);
        let rawTransactions: any[] = [];
        let restoredSettings: AppSettings | undefined = undefined;

        if (Array.isArray(parsed)) {
          rawTransactions = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.transactions)) {
            rawTransactions = parsed.transactions;
          } else if (parsed.data && Array.isArray(parsed.data.transactions)) {
            rawTransactions = parsed.data.transactions;
          } else if (parsed.state && Array.isArray(parsed.state.transactions)) {
            rawTransactions = parsed.state.transactions;
          }
          if (parsed.settings && typeof parsed.settings === 'object') {
            restoredSettings = parsed.settings;
          }
        }

        if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) {
          // If transactions array was empty, still allow if it was valid JSON backup with 0 records
          if (parsed && (Array.isArray(parsed) || Array.isArray(parsed.transactions))) {
            resolve({ transactions: [], settings: restoredSettings });
            return;
          }
          reject(new Error('File does not contain valid transaction records.'));
          return;
        }

        // Clean & normalize transaction schema
        const nowIso = new Date().toISOString();
        const cleanTransactions: Transaction[] = rawTransactions.map((tx: any, idx: number) => {
          const friendName = (tx.friendName || tx.name || 'Unknown').trim();
          const cleanPid = tx.profileId || `PRF-${friendName.slice(0, 3).toUpperCase()}-${idx + 100}`;
          const pAmount = Number(tx.principalAmount ?? tx.amount ?? 0) || 0;
          const pPaid = Number(tx.paidAmount ?? tx.repaidAmount ?? 0) || 0;

          const reps = Array.isArray(tx.repayments)
            ? tx.repayments.map((r: any, rIdx: number) => ({
                id: r.id || `rep-${idx}-${rIdx}`,
                amount: Number(r.amount) || 0,
                date: r.date ? new Date(r.date).toISOString() : nowIso,
              }))
            : [];

          return {
            id: tx.id || `tx-${idx}-${Date.now()}`,
            profileId: cleanPid,
            friendName,
            friendPhone: tx.friendPhone || tx.phoneNumber || '',
            principalAmount: pAmount,
            paidAmount: pPaid,
            startDate: tx.startDate ? new Date(tx.startDate).toISOString() : nowIso,
            returnDate: tx.returnDate || tx.dueDate ? new Date(tx.returnDate || tx.dueDate).toISOString() : nowIso,
            notes: tx.notes || tx.description || '',
            interestType: tx.interestType || 'none',
            interestRate: Number(tx.interestRate) || 0,
            isCompleted: typeof tx.isCompleted === 'boolean' ? tx.isCompleted : !!tx.isSettled,
            repayments: reps,
            hasTime: !!tx.hasTime,
            interestFreeIfPaidByDueDate: !!tx.interestFreeIfPaidByDueDate,
          };
        });

        resolve({
          transactions: cleanTransactions,
          settings: restoredSettings,
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to decrypt or parse backup file.'));
      }
    };
    reader.readAsText(file);
  });
}
