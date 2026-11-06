package com.abhisledger.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Phase 3.2: Native Debt & Settlement Reminder BroadcastReceiver.
 * Powered by Android AlarmManager.setExactAndAllowWhileIdle for 100% reliable alarms
 * across Android Doze mode, app termination, and device reboots (BOOT_COMPLETED).
 */
public class DebtReminderBroadcastReceiver extends BroadcastReceiver {

    public static final String TAG = "DebtReminderReceiver";
    public static final String ACTION_SHOW_REMINDER = "com.abhisledger.app.ACTION_SHOW_REMINDER";
    public static final String CHANNEL_DEBT_REMINDERS = "debt_reminders";
    public static final String PREFS_REMINDERS = "ledger_reminders_storage";
    public static final String KEY_PENDING_ALARMS = "pending_alarms_json";

    public static final String EXTRA_TX_ID = "EXTRA_TX_ID";
    public static final String EXTRA_TITLE = "EXTRA_TITLE";
    public static final String EXTRA_BODY = "EXTRA_BODY";
    public static final String EXTRA_PHONE = "EXTRA_PHONE";
    public static final String EXTRA_NOTIF_ID = "EXTRA_NOTIF_ID";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) || 
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            Log.d(TAG, "Device booted/updated: Rescheduling all stored debt alarms.");
            rescheduleAllStoredAlarms(context);
        } else if (ACTION_SHOW_REMINDER.equals(action)) {
            String txId = intent.getStringExtra(EXTRA_TX_ID);
            String title = intent.getStringExtra(EXTRA_TITLE);
            String body = intent.getStringExtra(EXTRA_BODY);
            String phone = intent.getStringExtra(EXTRA_PHONE);
            int notifId = intent.getIntExtra(EXTRA_NOTIF_ID, (int) (System.currentTimeMillis() % 1000000));

            Log.d(TAG, "Firing reminder notification for tx: " + txId + " (id: " + notifId + ")");
            showReminderNotification(context, txId, title, body, phone, notifId);

            // Remove this specific triggered alarm from stored list
            removeAlarmFromStorage(context, notifId);
        }
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_DEBT_REMINDERS,
                    "Debt & Settlement Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Heads-up alerts for upcoming settlements, due dates, and overdue follow-ups");
                channel.enableLights(true);
                channel.setLightColor(Color.parseColor("#10B981")); // Emerald
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 300, 150, 300});
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                channel.setShowBadge(true);
                nm.createNotificationChannel(channel);
            }
        }
    }

    public static void showReminderNotification(Context context, String txId, String title, String body, String phone, int notifId) {
        try {
            createNotificationChannel(context);
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. Primary tap action: Opens MainActivity and navigates to the transaction
            Intent mainIntent = new Intent(context, MainActivity.class);
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            mainIntent.putExtra("EXTRA_OPEN_TX_ID", txId);

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent contentIntent = PendingIntent.getActivity(context, notifId, mainIntent, pFlags);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_DEBT_REMINDERS)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle(title != null ? title : "Settlement Reminder")
                .setContentText(body != null ? body : "You have a payment due.")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setColor(Color.parseColor("#10B981"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

            // Action 1: Open Ledger
            builder.addAction(0, "Open Ledger", contentIntent);

            // Action 2: Direct Call button if phone number is present
            if (phone != null && !phone.trim().isEmpty()) {
                Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                dialIntent.setData(Uri.parse("tel:" + phone.trim()));
                PendingIntent dialPendingIntent = PendingIntent.getActivity(
                    context,
                    notifId + 500000,
                    dialIntent,
                    pFlags
                );
                builder.addAction(0, "Call Client", dialPendingIntent);
            }

            nm.notify(notifId, builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Error showing reminder notification", e);
        }
    }

    public static void scheduleExactAlarm(Context context, long triggerAtMillis, String txId, String title, String body, String phone, int notifId) {
        try {
            if (triggerAtMillis <= System.currentTimeMillis()) {
                return; // Past timestamps are skipped
            }

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, DebtReminderBroadcastReceiver.class);
            intent.setAction(ACTION_SHOW_REMINDER);
            intent.putExtra(EXTRA_TX_ID, txId);
            intent.putExtra(EXTRA_TITLE, title);
            intent.putExtra(EXTRA_BODY, body);
            intent.putExtra(EXTRA_PHONE, phone);
            intent.putExtra(EXTRA_NOTIF_ID, notifId);

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notifId, intent, pFlags);

            // Check exact alarm capability on Android 12+
            boolean canScheduleExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                canScheduleExact = alarmManager.canScheduleExactAlarms();
            }

            if (canScheduleExact) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            }

            // Persist alarm metadata in SharedPreferences for reboot recovery
            saveAlarmToStorage(context, triggerAtMillis, txId, title, body, phone, notifId);
            Log.d(TAG, "Successfully scheduled alarm ID " + notifId + " for tx " + txId + " at " + triggerAtMillis);
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarm ID " + notifId, e);
        }
    }

    public static void cancelAlarmsForTransaction(Context context, String txId) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            SharedPreferences prefs = context.getSharedPreferences(PREFS_REMINDERS, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_PENDING_ALARMS, "[]");
            JSONArray array = new JSONArray(rawJson);
            JSONArray remaining = new JSONArray();

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                String itemTxId = obj.optString("txId", "");
                int notifId = obj.optInt("notifId", 0);

                if (itemTxId.equals(txId)) {
                    // Cancel AlarmManager PendingIntent
                    if (alarmManager != null && notifId != 0) {
                        Intent intent = new Intent(context, DebtReminderBroadcastReceiver.class);
                        intent.setAction(ACTION_SHOW_REMINDER);
                        PendingIntent pi = PendingIntent.getBroadcast(context, notifId, intent, pFlags);
                        alarmManager.cancel(pi);
                        pi.cancel();
                    }
                    // Dismiss active status bar notification
                    if (nm != null && notifId != 0) {
                        nm.cancel(notifId);
                    }
                } else {
                    remaining.put(obj);
                }
            }

            prefs.edit().putString(KEY_PENDING_ALARMS, remaining.toString()).apply();
            Log.d(TAG, "Cancelled all alarms and notifications for tx: " + txId);
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling alarms for tx: " + txId, e);
        }
    }

    public static void rescheduleAllStoredAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_REMINDERS, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_PENDING_ALARMS, "[]");
            JSONArray array = new JSONArray(rawJson);
            JSONArray validAlarms = new JSONArray();
            long now = System.currentTimeMillis();

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                long triggerAt = obj.optLong("triggerAt", 0);
                String txId = obj.optString("txId", "");
                String title = obj.optString("title", "");
                String body = obj.optString("body", "");
                String phone = obj.optString("phone", "");
                int notifId = obj.optInt("notifId", 0);

                if (triggerAt > now && notifId != 0) {
                    scheduleExactAlarm(context, triggerAt, txId, title, body, phone, notifId);
                    validAlarms.put(obj);
                }
            }

            prefs.edit().putString(KEY_PENDING_ALARMS, validAlarms.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error in rescheduleAllStoredAlarms", e);
        }
    }

    private static synchronized void saveAlarmToStorage(Context context, long triggerAt, String txId, String title, String body, String phone, int notifId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_REMINDERS, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_PENDING_ALARMS, "[]");
            JSONArray array = new JSONArray(rawJson);

            // Deduplicate if already present
            JSONArray updated = new JSONArray();
            for (int i = 0; i < array.length(); i++) {
                JSONObject o = array.getJSONObject(i);
                if (o.optInt("notifId") != notifId) {
                    updated.put(o);
                }
            }

            JSONObject newObj = new JSONObject();
            newObj.put("notifId", notifId);
            newObj.put("txId", txId);
            newObj.put("triggerAt", triggerAt);
            newObj.put("title", title);
            newObj.put("body", body);
            newObj.put("phone", phone);
            updated.put(newObj);

            prefs.edit().putString(KEY_PENDING_ALARMS, updated.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error saving alarm to storage", e);
        }
    }

    private static synchronized void removeAlarmFromStorage(Context context, int notifId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_REMINDERS, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_PENDING_ALARMS, "[]");
            JSONArray array = new JSONArray(rawJson);
            JSONArray updated = new JSONArray();

            for (int i = 0; i < array.length(); i++) {
                JSONObject o = array.getJSONObject(i);
                if (o.optInt("notifId") != notifId) {
                    updated.put(o);
                }
            }
            prefs.edit().putString(KEY_PENDING_ALARMS, updated.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error removing alarm from storage", e);
        }
    }
}
