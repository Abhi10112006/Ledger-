package com.abhisledger.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Background BroadcastReceiver that periodically checks for new APK releases
 * on GitHub and notifies the user via system tray notification.
 * Also reschedules itself on device boot (RECEIVE_BOOT_COMPLETED).
 */
public class AppUpdateBroadcastReceiver extends BroadcastReceiver {
    public static final String ACTION_CHECK_UPDATE = "com.abhisledger.app.ACTION_CHECK_UPDATE";
    public static final String CHANNEL_ID = "app_updates";
    public static final String VERSION_URL = "https://raw.githubusercontent.com/Abhi10112006/Ledger-/main/public/version.json";
    public static final int NOTIFICATION_ID = 90210;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            // Reschedule background alarm after device reboot
            schedulePeriodicCheck(context);
        } else if (ACTION_CHECK_UPDATE.equals(action) || action == null) {
            // Perform check on background thread
            new Thread(() -> performUpdateCheck(context)).start();
        }
    }

    public static void schedulePeriodicCheck(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(context, AppUpdateBroadcastReceiver.class);
            intent.setAction(ACTION_CHECK_UPDATE);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 1001, intent, flags);

            // Inexact repeating alarm: every 12 hours
            long interval = 12 * 60 * 60 * 1000L;
            long triggerAt = System.currentTimeMillis() + (30 * 60 * 1000L); // First trigger in 30 minutes

            if (alarmManager != null) {
                alarmManager.setInexactRepeating(
                    AlarmManager.RTC_WAKEUP,
                    triggerAt,
                    interval,
                    pendingIntent
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void performUpdateCheck(Context context) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(VERSION_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "AbhisLedger-AppUpdate/3.0");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);

            if (conn.getResponseCode() != 200) return;

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            JSONObject json = new JSONObject(sb.toString());
            String remoteVersion = json.optString("version", "");
            String remoteName = json.optString("versionName", "New Release");
            String downloadUrl = json.optString("downloadUrl", "https://github.com/Abhi10112006/Ledger-/releases/latest");
            String apkUrl = json.optString("apkUrl", "");
            if (apkUrl.isEmpty()) {
                apkUrl = "https://github.com/Abhi10112006/Ledger-/releases/download/v" + remoteVersion + "/app-release.apk";
            }

            PackageManager pm = context.getPackageManager();
            PackageInfo pInfo = pm.getPackageInfo(context.getPackageName(), 0);
            String localVersion = pInfo.versionName;

            if (isNewerVersion(localVersion, remoteVersion)) {
                StringBuilder changelogPreview = new StringBuilder();
                JSONArray changelog = json.optJSONArray("changelog");
                if (changelog != null) {
                    for (int i = 0; i < Math.min(2, changelog.length()); i++) {
                        changelogPreview.append("• ").append(changelog.getString(i)).append("\n");
                    }
                }

                showUpdateNotification(context, remoteVersion, remoteName, changelogPreview.toString().trim(), apkUrl, downloadUrl);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private static boolean isNewerVersion(String local, String remote) {
        if (local == null || remote == null) return false;
        try {
            String[] lParts = local.split("\\.");
            String[] rParts = remote.split("\\.");
            int length = Math.max(lParts.length, rParts.length);
            for (int i = 0; i < length; i++) {
                int l = i < lParts.length ? Integer.parseInt(lParts[i].replaceAll("[^0-9]", "")) : 0;
                int r = i < rParts.length ? Integer.parseInt(rParts[i].replaceAll("[^0-9]", "")) : 0;
                if (r > l) return true;
                if (l > r) return false;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static void showUpdateNotification(Context context, String version, String versionName, String previewText, String apkUrl, String downloadUrl) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "App Updates & Releases",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifications when new versions of Abhi's Ledger are available");
                channel.enableLights(true);
                channel.enableVibration(true);
                nm.createNotificationChannel(channel);
            }

            Intent notifyIntent = new Intent(context, MainActivity.class);
            notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            notifyIntent.putExtra("EXTRA_UPDATE_AVAILABLE", true);
            notifyIntent.putExtra("EXTRA_UPDATE_VERSION", version);
            notifyIntent.putExtra("EXTRA_UPDATE_APK_URL", apkUrl);
            notifyIntent.putExtra("EXTRA_UPDATE_PAGE_URL", downloadUrl);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 1002, notifyIntent, flags);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle("⚡ Ledger Update: v" + version)
                .setContentText(versionName + " is ready. Tap to install directly!")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

            if (previewText != null && !previewText.isEmpty()) {
                builder.setStyle(new NotificationCompat.BigTextStyle()
                    .bigText(versionName + "\n\n" + previewText + "\n\nTap to download and update directly inside Abhi's Ledger."));
            }

            nm.notify(NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
