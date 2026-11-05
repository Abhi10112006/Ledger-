import { Transaction, AppSettings } from '../types';
import { Capacitor } from '@capacitor/core';
import { 
    initSQLiteDB, sqliteResetDB, sqliteGetMeta, sqliteSaveMeta, 
    sqliteGetAllTransactions, sqliteSaveTransaction, sqliteDeleteTx, 
    sqliteBulkSave, sqliteGetSettings, sqliteSaveSettings 
} from './sqlite';

const DB_NAME = 'AbhiLedgerDB';
const DB_VERSION = 1;
const STORE_TX = 'transactions';
const STORE_SETTINGS = 'settings';

const isNative = Capacitor.isNativePlatform();

// --- INDEXED DB DRIVER ---

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const initIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
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

const idbResetDB = async () => {
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

const idbSaveMeta = async (key: string, value: any) => {
    const db = await initIDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put({ id: key, value });
    return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

const idbGetAllTransactions = async (): Promise<Transaction[]> => {
  const db = await initIDB();
  return promisifyRequest(db.transaction(STORE_TX, 'readonly').objectStore(STORE_TX).getAll());
};

const idbSaveTransaction = async (transaction: Transaction) => {
  const db = await initIDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  tx.objectStore(STORE_TX).put(transaction);
  return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

const idbDeleteTx = async (id: string) => {
  const db = await initIDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  tx.objectStore(STORE_TX).delete(id);
  return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

const idbBulkSave = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return;
  const db = await initIDB();
  const tx = db.transaction(STORE_TX, 'readwrite');
  const store = tx.objectStore(STORE_TX);
  transactions.forEach(t => store.put(t));
  return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

const idbGetSettings = async (): Promise<AppSettings | null> => {
  const db = await initIDB();
  const result = await promisifyRequest(db.transaction(STORE_SETTINGS, 'readonly').objectStore(STORE_SETTINGS).get('app-settings'));
  return result ? result.value : null;
};

const idbSaveSettings = async (settings: AppSettings) => {
  const db = await initIDB();
  const tx = db.transaction(STORE_SETTINGS, 'readwrite');
  tx.objectStore(STORE_SETTINGS).put({ id: 'app-settings', value: settings });
  return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

// --- PROXY ROUTER (Native -> SQLite | Web -> IndexedDB) ---

let hasMigrated = false;
const ensureNativeMigration = async () => {
    if (!isNative || hasMigrated) return;
    try {
        await initSQLiteDB();
        const sqliteData = await sqliteGetAllTransactions();
        // If SQLite is empty, pull from IndexedDB to migrate
        if (sqliteData.length === 0) {
            const idbData = await idbGetAllTransactions();
            if (idbData.length > 0) {
                console.log('Migrating IndexedDB to SQLite...');
                await sqliteBulkSave(idbData);
                const idbSettings = await idbGetSettings();
                if (idbSettings) await sqliteSaveSettings(idbSettings);
                
                // Clear IDB to prevent double-migration in the future
                await idbResetDB();
            }
        }
        hasMigrated = true;
    } catch (e) {
        console.error("Migration failed", e);
    }
};

export const resetDB = async () => {
    if (isNative) { await ensureNativeMigration(); return sqliteResetDB(); }
    return idbResetDB();
};

export const getMeta = async <T>(key: string): Promise<T | null> => {
    if (isNative) { await ensureNativeMigration(); return sqliteGetMeta<T>(key); }
    return idbGetMeta<T>(key);
};

export const saveMeta = async (key: string, value: any) => {
    if (isNative) { await ensureNativeMigration(); return sqliteSaveMeta(key, value); }
    return idbSaveMeta(key, value);
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
    if (isNative) { await ensureNativeMigration(); return sqliteGetAllTransactions(); }
    return idbGetAllTransactions();
};

export const saveTransaction = async (transaction: Transaction) => {
    if (isNative) { await ensureNativeMigration(); return sqliteSaveTransaction(transaction); }
    return idbSaveTransaction(transaction);
};

export const deleteTxFromDB = async (id: string) => {
    if (isNative) { await ensureNativeMigration(); return sqliteDeleteTx(id); }
    return idbDeleteTx(id);
};

export const bulkSaveTransactions = async (transactions: Transaction[]) => {
    if (isNative) { await ensureNativeMigration(); return sqliteBulkSave(transactions); }
    return idbBulkSave(transactions);
};

export const getSettings = async (): Promise<AppSettings | null> => {
    if (isNative) { await ensureNativeMigration(); return sqliteGetSettings(); }
    return idbGetSettings();
};

export const saveSettingsToDB = async (settings: AppSettings) => {
    if (isNative) { await ensureNativeMigration(); return sqliteSaveSettings(settings); }
    return idbSaveSettings(settings);
};

export const migrateLegacyData = async (legacyData: Transaction[]) => {
    if(!legacyData || legacyData.length === 0) return;
    try {
        await bulkSaveTransactions(legacyData);
        console.log("Migration successful: Moved " + legacyData.length + " items to primary DB.");
    } catch (e) {
        console.error("Legacy Migration failed", e);
    }
};
