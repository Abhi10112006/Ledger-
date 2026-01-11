
import { Transaction, AppSettings } from '../types';

const DB_NAME = 'AbhiLedgerDB';
const DB_VERSION = 1;
const STORE_TX = 'transactions';
const STORE_SETTINGS = 'settings';

// Helper to wrap IndexedDB Request in a Promise
const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TX)) {
        db.createObjectStore(STORE_TX, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- CORE UTILS ---

export const resetDB = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction([STORE_TX, STORE_SETTINGS], 'readwrite');
        tx.objectStore(STORE_TX).clear();
        tx.objectStore(STORE_SETTINGS).clear();
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    } catch (e) {
        console.error("DB Reset failed", e);
        return false;
    }
};

export const getMeta = async <T>(key: string): Promise<T | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const result = await promisifyRequest(store.get(key));
        return result ? result.value : null;
    } catch (e) {
        return null;
    }
};

export const saveMeta = async (key: string, value: any) => {
    const db = await initDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    store.put({ id: key, value });
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
    });
};

// --- TRANSACTION OPERATIONS ---

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await initDB();
  const tx = db.transaction(STORE_TX, 'readonly');
  const store = tx.objectStore(STORE_TX);
  return promisifyRequest(store.getAll());
};

export const saveTransaction = async (transaction: Transaction) => {
  const db = await initDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  const store = tx.objectStore(STORE_TX);
  store.put(transaction);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

export const deleteTxFromDB = async (id: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  const store = tx.objectStore(STORE_TX);
  store.delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

// Bulk save (useful for migration or batch updates)
export const bulkSaveTransactions = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return;
  const db = await initDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  const store = tx.objectStore(STORE_TX);
  transactions.forEach(t => store.put(t));
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

// --- SETTINGS OPERATIONS ---

export const getSettings = async (): Promise<AppSettings | null> => {
  const db = await initDB();
  const tx = db.transaction(STORE_SETTINGS, 'readonly');
  const store = tx.objectStore(STORE_SETTINGS);
  const result = await promisifyRequest(store.get('app-settings'));
  return result ? result.value : null;
};

export const saveSettingsToDB = async (settings: AppSettings) => {
  const db = await initDB();
  const tx = db.transaction(STORE_SETTINGS, 'readwrite');
  const store = tx.objectStore(STORE_SETTINGS);
  store.put({ id: 'app-settings', value: settings });
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

// --- MIGRATION HELPER ---
export const migrateLegacyData = async (legacyData: Transaction[]) => {
    if(!legacyData || legacyData.length === 0) return;
    try {
        await bulkSaveTransactions(legacyData);
        console.log("Migration successful: Moved " + legacyData.length + " items to IndexedDB.");
    } catch (e) {
        console.error("Migration failed", e);
    }
};
