package com.abhisledger.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeDatabase")
public class NativeDatabasePlugin extends Plugin {

    private static final String TAG = "NativeDatabasePlugin";
    private static final String DATABASE_NAME = "AbhiLedgerNative.db";
    private static final int DATABASE_VERSION = 1;

    private DatabaseHelper dbHelper;

    private static class DatabaseHelper extends SQLiteOpenHelper {

        DatabaseHelper(Context context) {
            super(context, DATABASE_NAME, null, DATABASE_VERSION);
        }

        @Override
        public void onConfigure(SQLiteDatabase db) {
            super.onConfigure(db);
            db.setForeignKeyConstraintsEnabled(true);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE IF NOT EXISTS transactions (" +
                    "id TEXT PRIMARY KEY NOT NULL, " +
                    "profile_id TEXT NOT NULL, " +
                    "friend_name TEXT NOT NULL, " +
                    "friend_phone TEXT, " +
                    "principal_amount REAL NOT NULL, " +
                    "paid_amount REAL NOT NULL, " +
                    "start_date TEXT NOT NULL, " +
                    "return_date TEXT NOT NULL, " +
                    "notes TEXT, " +
                    "interest_type TEXT DEFAULT 'none', " +
                    "interest_rate REAL DEFAULT 0, " +
                    "is_completed INTEGER DEFAULT 0, " +
                    "has_time INTEGER DEFAULT 0, " +
                    "interest_free INTEGER DEFAULT 0" +
                    ");");

            db.execSQL("CREATE INDEX IF NOT EXISTS idx_tx_profile ON transactions(profile_id);");
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_tx_friend_name ON transactions(friend_name);");
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_tx_completed ON transactions(is_completed);");
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_tx_return_date ON transactions(return_date);");

            db.execSQL("CREATE TABLE IF NOT EXISTS repayments (" +
                    "id TEXT PRIMARY KEY NOT NULL, " +
                    "transaction_id TEXT NOT NULL, " +
                    "amount REAL NOT NULL, " +
                    "date TEXT NOT NULL, " +
                    "FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE" +
                    ");");

            db.execSQL("CREATE INDEX IF NOT EXISTS idx_rep_tx ON repayments(transaction_id);");

            db.execSQL("CREATE TABLE IF NOT EXISTS settings (" +
                    "key TEXT PRIMARY KEY NOT NULL, " +
                    "value TEXT NOT NULL" +
                    ");");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            // Future schema migrations
        }
    }

    @Override
    public void load() {
        super.load();
        try {
            dbHelper = new DatabaseHelper(getContext());
            // Pre-open DB to verify integrity
            SQLiteDatabase db = dbHelper.getWritableDatabase();
            Log.d(TAG, "NativeDatabase SQLite initialized successfully at: " + db.getPath());
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize native SQLite database", e);
        }
    }

    private SQLiteDatabase getDB() {
        if (dbHelper == null) {
            dbHelper = new DatabaseHelper(getContext());
        }
        return dbHelper.getWritableDatabase();
    }

    @PluginMethod
    public void getAllTransactions(PluginCall call) {
        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();

                // 1. Fetch all repayments grouped by transaction_id in a single pass
                HashMap<String, JSArray> repaymentsMap = new HashMap<>();
                Cursor repCursor = db.rawQuery("SELECT id, transaction_id, amount, date FROM repayments ORDER BY date ASC", null);
                if (repCursor != null) {
                    while (repCursor.moveToNext()) {
                        String repId = repCursor.getString(0);
                        String txId = repCursor.getString(1);
                        double amount = repCursor.getDouble(2);
                        String date = repCursor.getString(3);

                        JSObject repObj = new JSObject();
                        repObj.put("id", repId);
                        repObj.put("amount", amount);
                        repObj.put("date", date);

                        if (!repaymentsMap.containsKey(txId)) {
                            repaymentsMap.put(txId, new JSArray());
                        }
                        repaymentsMap.get(txId).put(repObj);
                    }
                    repCursor.close();
                }

                // 2. Fetch all transactions
                JSArray txList = new JSArray();
                Cursor txCursor = db.rawQuery("SELECT id, profile_id, friend_name, friend_phone, principal_amount, " +
                        "paid_amount, start_date, return_date, notes, interest_type, interest_rate, " +
                        "is_completed, has_time, interest_free FROM transactions ORDER BY start_date DESC", null);

                if (txCursor != null) {
                    while (txCursor.moveToNext()) {
                        String txId = txCursor.getString(0);
                        JSObject txObj = new JSObject();
                        txObj.put("id", txId);
                        txObj.put("profileId", txCursor.getString(1));
                        txObj.put("friendName", txCursor.getString(2));
                        txObj.put("friendPhone", txCursor.getString(3) != null ? txCursor.getString(3) : "");
                        txObj.put("principalAmount", txCursor.getDouble(4));
                        txObj.put("paidAmount", txCursor.getDouble(5));
                        txObj.put("startDate", txCursor.getString(6));
                        txObj.put("returnDate", txCursor.getString(7));
                        txObj.put("notes", txCursor.getString(8) != null ? txCursor.getString(8) : "");
                        txObj.put("interestType", txCursor.getString(9) != null ? txCursor.getString(9) : "none");
                        txObj.put("interestRate", txCursor.getDouble(10));
                        txObj.put("isCompleted", txCursor.getInt(11) == 1);
                        txObj.put("hasTime", txCursor.getInt(12) == 1);
                        txObj.put("interestFreeIfPaidByDueDate", txCursor.getInt(13) == 1);

                        JSArray reps = repaymentsMap.get(txId);
                        txObj.put("repayments", reps != null ? reps : new JSArray());

                        txList.put(txObj);
                    }
                    txCursor.close();
                }

                JSObject ret = new JSObject();
                ret.put("transactions", txList);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Error fetching transactions", e);
                call.reject("Failed to query native transactions: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void saveTransaction(PluginCall call) {
        JSObject tx = call.getObject("transaction");
        if (tx == null) {
            call.reject("Transaction object is required");
            return;
        }

        new Thread(() -> {
            SQLiteDatabase db = getDB();
            db.beginTransaction();
            try {
                String txId = tx.getString("id");
                if (txId == null || txId.isEmpty()) {
                    db.endTransaction();
                    call.reject("Transaction id is required");
                    return;
                }

                ContentValues values = new ContentValues();
                values.put("id", txId);
                values.put("profile_id", tx.optString("profileId", ""));
                values.put("friend_name", tx.optString("friendName", "Unknown"));
                values.put("friend_phone", tx.optString("friendPhone", ""));
                values.put("principal_amount", tx.optDouble("principalAmount", 0.0));
                values.put("paid_amount", tx.optDouble("paidAmount", 0.0));
                values.put("start_date", tx.optString("startDate", ""));
                values.put("return_date", tx.optString("returnDate", ""));
                values.put("notes", tx.optString("notes", ""));
                values.put("interest_type", tx.optString("interestType", "none"));
                values.put("interest_rate", tx.optDouble("interestRate", 0.0));
                values.put("is_completed", tx.optBoolean("isCompleted", false) ? 1 : 0);
                values.put("has_time", tx.optBoolean("hasTime", false) ? 1 : 0);
                values.put("interest_free", tx.optBoolean("interestFreeIfPaidByDueDate", false) ? 1 : 0);

                db.insertWithOnConflict("transactions", null, values, SQLiteDatabase.CONFLICT_REPLACE);

                // Replace repayments
                db.delete("repayments", "transaction_id = ?", new String[]{txId});
                JSONArray repayments = tx.optJSONArray("repayments");
                if (repayments != null) {
                    for (int i = 0; i < repayments.length(); i++) {
                        JSONObject r = repayments.getJSONObject(i);
                        ContentValues rVals = new ContentValues();
                        rVals.put("id", r.optString("id", txId + "_rep_" + i));
                        rVals.put("transaction_id", txId);
                        rVals.put("amount", r.optDouble("amount", 0.0));
                        rVals.put("date", r.optString("date", ""));
                        db.insertWithOnConflict("repayments", null, rVals, SQLiteDatabase.CONFLICT_REPLACE);
                    }
                }

                db.setTransactionSuccessful();
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Error saving transaction", e);
                call.reject("Failed to save transaction: " + e.getMessage(), e);
            } finally {
                db.endTransaction();
            }
        }).start();
    }

    @PluginMethod
    public void bulkSaveTransactions(PluginCall call) {
        JSArray txArray = call.getArray("transactions");
        if (txArray == null) {
            call.reject("Transactions array is required");
            return;
        }

        new Thread(() -> {
            SQLiteDatabase db = getDB();
            db.beginTransaction();
            try {
                for (int i = 0; i < txArray.length(); i++) {
                    JSONObject tx = txArray.getJSONObject(i);
                    String txId = tx.optString("id");
                    if (txId == null || txId.isEmpty()) continue;

                    ContentValues values = new ContentValues();
                    values.put("id", txId);
                    values.put("profile_id", tx.optString("profileId", ""));
                    values.put("friend_name", tx.optString("friendName", "Unknown"));
                    values.put("friend_phone", tx.optString("friendPhone", ""));
                    values.put("principal_amount", tx.optDouble("principalAmount", 0.0));
                    values.put("paid_amount", tx.optDouble("paidAmount", 0.0));
                    values.put("start_date", tx.optString("startDate", ""));
                    values.put("return_date", tx.optString("returnDate", ""));
                    values.put("notes", tx.optString("notes", ""));
                    values.put("interest_type", tx.optString("interestType", "none"));
                    values.put("interest_rate", tx.optDouble("interestRate", 0.0));
                    values.put("is_completed", tx.optBoolean("isCompleted", false) ? 1 : 0);
                    values.put("has_time", tx.optBoolean("hasTime", false) ? 1 : 0);
                    values.put("interest_free", tx.optBoolean("interestFreeIfPaidByDueDate", false) ? 1 : 0);

                    db.insertWithOnConflict("transactions", null, values, SQLiteDatabase.CONFLICT_REPLACE);

                    db.delete("repayments", "transaction_id = ?", new String[]{txId});
                    JSONArray repayments = tx.optJSONArray("repayments");
                    if (repayments != null) {
                        for (int j = 0; j < repayments.length(); j++) {
                            JSONObject r = repayments.getJSONObject(j);
                            ContentValues rVals = new ContentValues();
                            rVals.put("id", r.optString("id", txId + "_rep_" + j));
                            rVals.put("transaction_id", txId);
                            rVals.put("amount", r.optDouble("amount", 0.0));
                            rVals.put("date", r.optString("date", ""));
                            db.insertWithOnConflict("repayments", null, rVals, SQLiteDatabase.CONFLICT_REPLACE);
                        }
                    }
                }

                db.setTransactionSuccessful();
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("count", txArray.length());
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Error bulk saving transactions", e);
                call.reject("Failed to bulk save transactions: " + e.getMessage(), e);
            } finally {
                db.endTransaction();
            }
        }).start();
    }

    @PluginMethod
    public void deleteTransaction(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("Transaction id is required");
            return;
        }

        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                db.delete("repayments", "transaction_id = ?", new String[]{id});
                db.delete("transactions", "id = ?", new String[]{id});
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to delete transaction: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void getSettings(PluginCall call) {
        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                Cursor cursor = db.rawQuery("SELECT value FROM settings WHERE key = ?", new String[]{"app-settings"});
                if (cursor != null && cursor.moveToFirst()) {
                    String jsonStr = cursor.getString(0);
                    cursor.close();
                    JSObject ret = new JSObject();
                    ret.put("settings", new JSObject(jsonStr));
                    call.resolve(ret);
                    return;
                }
                if (cursor != null) cursor.close();
                JSObject ret = new JSObject();
                ret.put("settings", null);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to get settings: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void saveSettings(PluginCall call) {
        JSObject settingsObj = call.getObject("settings");
        if (settingsObj == null) {
            call.reject("Settings object is required");
            return;
        }

        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                ContentValues values = new ContentValues();
                values.put("key", "app-settings");
                values.put("value", settingsObj.toString());
                db.insertWithOnConflict("settings", null, values, SQLiteDatabase.CONFLICT_REPLACE);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to save settings: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void getMeta(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Key is required");
            return;
        }

        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                Cursor cursor = db.rawQuery("SELECT value FROM settings WHERE key = ?", new String[]{key});
                if (cursor != null && cursor.moveToFirst()) {
                    String val = cursor.getString(0);
                    cursor.close();
                    JSObject ret = new JSObject();
                    ret.put("value", val);
                    call.resolve(ret);
                    return;
                }
                if (cursor != null) cursor.close();
                JSObject ret = new JSObject();
                ret.put("value", null);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to get meta: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void saveMeta(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null) {
            call.reject("Key is required");
            return;
        }

        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                ContentValues cv = new ContentValues();
                cv.put("key", key);
                cv.put("value", value != null ? value : "");
                db.insertWithOnConflict("settings", null, cv, SQLiteDatabase.CONFLICT_REPLACE);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to save meta: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void resetDatabase(PluginCall call) {
        new Thread(() -> {
            try {
                SQLiteDatabase db = getDB();
                db.execSQL("DELETE FROM repayments;");
                db.execSQL("DELETE FROM transactions;");
                db.execSQL("DELETE FROM settings;");
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to reset database: " + e.getMessage(), e);
            }
        }).start();
    }
}
