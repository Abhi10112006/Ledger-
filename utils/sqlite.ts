import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Transaction, AppSettings } from '../types';

const DB_NAME = 'AbhiLedgerSQLite';

let sqlite: SQLiteConnection;
let db: SQLiteDBConnection;
let isInitialized = false;

export const initSQLiteDB = async () => {
    if (isInitialized) return;
    try {
        sqlite = new SQLiteConnection(CapacitorSQLite);
        
        // Create/Open connection
        db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
        await db.open();

        // Create tables
        const schema = `
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY NOT NULL,
                data TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY NOT NULL,
                data TEXT NOT NULL
            );
        `;
        await db.execute(schema);
        isInitialized = true;
        console.log("SQLite DB Initialized Successfully");
    } catch (error) {
        console.error("SQLite Initialization failed:", error);
    }
};

export const sqliteResetDB = async () => {
    if (!isInitialized) await initSQLiteDB();
    await db.execute(`DELETE FROM transactions; DELETE FROM settings;`);
    return true;
};

export const sqliteGetMeta = async <T>(key: string): Promise<T | null> => {
    if (!isInitialized) await initSQLiteDB();
    const res = await db.query(`SELECT data FROM settings WHERE id = ?`, [key]);
    if (res.values && res.values.length > 0) {
        return JSON.parse(res.values[0].data);
    }
    return null;
};

export const sqliteSaveMeta = async (key: string, value: any) => {
    if (!isInitialized) await initSQLiteDB();
    const dataStr = JSON.stringify(value);
    await db.run(`INSERT OR REPLACE INTO settings (id, data) VALUES (?, ?)`, [key, dataStr]);
    return true;
};

export const sqliteGetAllTransactions = async (): Promise<Transaction[]> => {
    if (!isInitialized) await initSQLiteDB();
    const res = await db.query(`SELECT data FROM transactions`);
    if (res.values && res.values.length > 0) {
        return res.values.map(row => JSON.parse(row.data));
    }
    return [];
};

export const sqliteSaveTransaction = async (transaction: Transaction) => {
    if (!isInitialized) await initSQLiteDB();
    const dataStr = JSON.stringify(transaction);
    await db.run(`INSERT OR REPLACE INTO transactions (id, data) VALUES (?, ?)`, [transaction.id, dataStr]);
    return true;
};

export const sqliteDeleteTx = async (id: string) => {
    if (!isInitialized) await initSQLiteDB();
    await db.run(`DELETE FROM transactions WHERE id = ?`, [id]);
    return true;
};

export const sqliteBulkSave = async (transactions: Transaction[]) => {
    if (!isInitialized) await initSQLiteDB();
    if (transactions.length === 0) return true;
    
    // SQLite bulk insert optimization
    let sql = `INSERT OR REPLACE INTO transactions (id, data) VALUES `;
    let values: any[] = [];
    transactions.forEach((t, i) => {
        sql += `(?, ?)`;
        if (i < transactions.length - 1) sql += `, `;
        values.push(t.id, JSON.stringify(t));
    });
    
    await db.run(sql, values);
    return true;
};

export const sqliteGetSettings = async (): Promise<AppSettings | null> => {
    return sqliteGetMeta('app-settings');
};

export const sqliteSaveSettings = async (settings: AppSettings) => {
    return sqliteSaveMeta('app-settings', settings);
};
