import { Transaction, AppSettings } from '../types';
import { Capacitor, registerPlugin } from '@capacitor/core';

const DB_NAME = 'AbhiLedgerDB';
const DB_VERSION = 1;
const STORE_TX = 'transactions';
const STORE_SETTINGS = 'settings';

export const isNative = Capacitor.isNativePlatform();

// --- NATIVE DATABASE PLUGIN INTERFACE (Android Native SQLite) ---
interface NativeDatabasePluginInterface {
  getAllTransactions(): Promise<{ transactions: Transaction[] }>;
  saveTransaction(options: { transaction: Transaction }): Promise<{ success: boolean }>;
  bulkSaveTransactions(options: { transactions: Transaction[] }): Promise<{ success: boolean; count?: number }>;
  deleteTransaction(options: { id: string }): Promise<{ success: boolean }>;
  getSettings(): Promise<{ settings: AppSettings | null }>;
  saveSettings(options: { settings: AppSettings }): Promise<{ success: boolean }>;
  getMeta(options: { key: string }): Promise<{ value: string | null }>;
  saveMeta(options: { key: string; value: string }): Promise<{ success: boolean }>;
  resetDatabase(): Promise<{ success: boolean }>;
}

const NativeDatabase = registerPlugin<NativeDatabasePluginInterface>('NativeDatabase');

// --- INDEXED DB DRIVER (Browser Fallback & Native Secondary Cache) ---

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const initIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TX)) db.createObjectStore(STORE_TX, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbResetDB = async (): Promise<boolean> => {
  try {
    const db = await initIDB();
    const tx = db.transaction([STORE_TX, STORE_SETTINGS], 'readwrite');
    tx.objectStore(STORE_TX).clear();
    tx.objectStore(STORE_SETTINGS).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
};

const idbGetMeta = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const result = await promisifyRequest(tx.objectStore(STORE_SETTINGS).get(key));
    return result ? result.value : null;
  } catch (e) {
    return null;
  }
};

const idbSaveMeta = async (key: string, value: any): Promise<boolean> => {
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put({ id: key, value });
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    return false;
  }
};

const idbGetAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const db = await initIDB();
    return await promisifyRequest(db.transaction(STORE_TX, 'readonly').objectStore(STORE_TX).getAll());
  } catch (e) {
    return [];
  }
};

const idbSaveTransaction = async (transaction: Transaction): Promise<boolean> => {
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_TX, 'readwrite');
    tx.objectStore(STORE_TX).put(transaction);
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    return false;
  }
};

const idbDeleteTx = async (id: string): Promise<boolean> => {
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_TX, 'readwrite');
    tx.objectStore(STORE_TX).delete(id);
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    return false;
  }
};

const idbBulkSave = async (transactions: Transaction[]): Promise<boolean> => {
  if (transactions.length === 0) return true;
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_TX, 'readwrite');
    const store = tx.objectStore(STORE_TX);
    transactions.forEach((t) => store.put(t));
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    return false;
  }
};

const idbGetSettings = async (): Promise<AppSettings | null> => {
  try {
    const db = await initIDB();
    const result = await promisifyRequest(
      db.transaction(STORE_SETTINGS, 'readonly').objectStore(STORE_SETTINGS).get('app-settings')
    );
    return result ? result.value : null;
  } catch (e) {
    return null;
  }
};

const idbSaveSettings = async (settings: AppSettings): Promise<boolean> => {
  try {
    const db = await initIDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put({ id: 'app-settings', value: settings });
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    return false;
  }
};

// --- DATA ACCESS LAYER (Native SQLite Primary with Dual-Storage Resilience) ---

let migrationChecked = false;

const checkAndMigrateLegacy = async (): Promise<void> => {
  if (!isNative || migrationChecked) return;
  migrationChecked = true;

  try {
    const res = await NativeDatabase.getAllTransactions();
    // If native database is empty, check if we need to pull from IndexedDB or legacy localStorage
    if (!res.transactions || res.transactions.length === 0) {
      const idbData = await idbGetAllTransactions();
      if (idbData && idbData.length > 0) {
        console.log(`Migrating ${idbData.length} records from IndexedDB to Native SQLite...`);
        await NativeDatabase.bulkSaveTransactions({ transactions: idbData });
        const idbSettings = await idbGetSettings();
        if (idbSettings) {
          await NativeDatabase.saveSettings({ settings: idbSettings });
        }
        return;
      }

      // Check legacy localStorage
      if (typeof localStorage !== 'undefined') {
        const rawLegacy = localStorage.getItem('abhi_ledger_session');
        if (rawLegacy) {
          try {
            const parsed = JSON.parse(rawLegacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`Migrating ${parsed.length} records from localStorage to Native SQLite...`);
              await NativeDatabase.bulkSaveTransactions({ transactions: parsed });
            }
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.warn('Native migration check warning:', err);
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  if (isNative) {
    try {
      await checkAndMigrateLegacy();
      const res = await NativeDatabase.getAllTransactions();
      if (res && Array.isArray(res.transactions)) {
        return res.transactions;
      }
    } catch (err) {
      console.warn('Native getAllTransactions failed, using IndexedDB fallback:', err);
    }
  }
  return idbGetAllTransactions();
};

export const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
  // Always update secondary IDB cache in parallel
  idbSaveTransaction(transaction).catch(() => {});

  if (isNative) {
    try {
      const res = await NativeDatabase.saveTransaction({ transaction });
      return res.success;
    } catch (err) {
      console.error('Native saveTransaction failed:', err);
    }
  }
  return idbSaveTransaction(transaction);
};

export const bulkSaveTransactions = async (transactions: Transaction[]): Promise<boolean> => {
  // Always update secondary IDB cache in parallel
  idbBulkSave(transactions).catch(() => {});

  if (isNative) {
    try {
      const res = await NativeDatabase.bulkSaveTransactions({ transactions });
      return res.success;
    } catch (err) {
      console.error('Native bulkSaveTransactions failed:', err);
    }
  }
  return idbBulkSave(transactions);
};

export const deleteTxFromDB = async (id: string): Promise<boolean> => {
  idbDeleteTx(id).catch(() => {});

  if (isNative) {
    try {
      const res = await NativeDatabase.deleteTransaction({ id });
      return res.success;
    } catch (err) {
      console.error('Native deleteTxFromDB failed:', err);
    }
  }
  return idbDeleteTx(id);
};

export const getSettings = async (): Promise<AppSettings | null> => {
  if (isNative) {
    try {
      const res = await NativeDatabase.getSettings();
      if (res && res.settings) {
        return res.settings;
      }
    } catch (err) {
      console.warn('Native getSettings failed, using IndexedDB fallback:', err);
    }
  }
  return idbGetSettings();
};

export const saveSettingsToDB = async (settings: AppSettings): Promise<boolean> => {
  idbSaveSettings(settings).catch(() => {});

  if (isNative) {
    try {
      const res = await NativeDatabase.saveSettings({ settings });
      return res.success;
    } catch (err) {
      console.error('Native saveSettings failed:', err);
    }
  }
  return idbSaveSettings(settings);
};

export const getMeta = async <T>(key: string): Promise<T | null> => {
  if (isNative) {
    try {
      const res = await NativeDatabase.getMeta({ key });
      if (res && res.value) {
        return JSON.parse(res.value);
      }
      return null;
    } catch (err) {
      console.warn('Native getMeta failed, using IndexedDB fallback:', err);
    }
  }
  return idbGetMeta<T>(key);
};

export const saveMeta = async (key: string, value: any): Promise<boolean> => {
  idbSaveMeta(key, value).catch(() => {});

  if (isNative) {
    try {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      const res = await NativeDatabase.saveMeta({ key, value: valStr });
      return res.success;
    } catch (err) {
      console.error('Native saveMeta failed:', err);
    }
  }
  return idbSaveMeta(key, value);
};

export const resetDB = async (): Promise<boolean> => {
  idbResetDB().catch(() => {});

  if (isNative) {
    try {
      const res = await NativeDatabase.resetDatabase();
      return res.success;
    } catch (err) {
      console.error('Native resetDatabase failed:', err);
    }
  }
  return idbResetDB();
};

export const migrateLegacyData = async (legacyData: Transaction[]): Promise<void> => {
  if (!legacyData || legacyData.length === 0) return;
  try {
    await bulkSaveTransactions(legacyData);
    console.log(`Migration successful: Moved ${legacyData.length} items to primary DB.`);
  } catch (e) {
    console.error('Legacy Migration failed', e);
  }
};
