package com.abhisledger.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeAppUpdate")
public class NativeAppUpdatePlugin extends Plugin {

    private static final String CHANNEL_ID = "app_updates";
    private static final int PROGRESS_NOTIFICATION_ID = 90211;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        super.load();
        createNotificationChannel();
        // Schedule periodic background check automatically
        AppUpdateBroadcastReceiver.schedulePeriodicCheck(getContext());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "App Updates & Releases",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Progress and notifications for Abhi's Ledger app updates");
                nm.createNotificationChannel(channel);
            }
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("opened", false);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Could not open install permission settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void scheduleBackgroundCheck(PluginCall call) {
        try {
            AppUpdateBroadcastReceiver.schedulePeriodicCheck(getContext());
            JSObject ret = new JSObject();
            ret.put("scheduled", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to schedule background check: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkNow(PluginCall call) {
        executor.execute(() -> {
            try {
                AppUpdateBroadcastReceiver.performUpdateCheck(getContext());
            } catch (Exception ignored) {}
        });
        JSObject ret = new JSObject();
        ret.put("checking", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("apkUrl");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("apkUrl is required");
            return;
        }

        String version = call.getString("version", "latest");
        Context context = getContext();

        executor.execute(() -> {
            HttpURLConnection conn = null;
            InputStream in = null;
            FileOutputStream out = null;
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            try {
                // Ensure updates directory exists
                File updatesDir = new File(context.getCacheDir(), "updates");
                if (!updatesDir.exists()) {
                    updatesDir.mkdirs();
                }

                File destinationFile = new File(updatesDir, "ledger-v" + version + ".apk");
                if (destinationFile.exists()) {
                    destinationFile.delete();
                }

                // Follow redirects (GitHub Releases redirect to AWS S3 CDN)
                String currentUrl = apkUrl;
                int responseCode = -1;
                for (int redirectCount = 0; redirectCount < 8; redirectCount++) {
                    URL u = new URL(currentUrl);
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "AbhisLedger-AppUpdate/4.0");
                    conn.setConnectTimeout(25000);
                    conn.setReadTimeout(35000);

                    responseCode = conn.getResponseCode();
                    if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP
                        || responseCode == HttpURLConnection.HTTP_MOVED_PERM
                        || responseCode == 307
                        || responseCode == 308) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location != null && !location.isEmpty()) {
                            currentUrl = location;
                            continue;
                        }
                    }
                    break;
                }

                if (responseCode != HttpURLConnection.HTTP_OK) {
                    throw new Exception("Server responded with HTTP " + responseCode + " when downloading APK");
                }

                int totalBytes = conn.getContentLength();
                in = conn.getInputStream();
                out = new FileOutputStream(destinationFile);

                byte[] buffer = new byte[8192];
                int bytesRead;
                int totalDownloaded = 0;
                int lastReportedPercent = -1;

                NotificationCompat.Builder notifBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(context.getApplicationInfo().icon)
                    .setContentTitle("Downloading Ledger Update (v" + version + ")")
                    .setOngoing(true)
                    .setOnlyAlertOnce(true)
                    .setPriority(NotificationCompat.PRIORITY_LOW);

                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalDownloaded += bytesRead;

                    int percent = totalBytes > 0 ? (int) ((totalDownloaded * 100L) / totalBytes) : -1;

                    if (percent != lastReportedPercent && (percent % 2 == 0 || percent == 100)) {
                        lastReportedPercent = percent;

                        // Emit progress event to WebView
                        JSObject progressObj = new JSObject();
                        progressObj.put("progress", percent);
                        progressObj.put("bytesDownloaded", totalDownloaded);
                        progressObj.put("totalBytes", totalBytes);
                        progressObj.put("status", "downloading");
                        notifyListeners("downloadProgress", progressObj);

                        // Update Android Notification drawer progress
                        if (nm != null) {
                            if (totalBytes > 0) {
                                notifBuilder.setProgress(100, percent, false);
                                notifBuilder.setContentText(percent + "% (" + (totalDownloaded / 1048576) + " MB / " + (totalBytes / 1048576) + " MB)");
                            } else {
                                notifBuilder.setProgress(0, 0, true);
                                notifBuilder.setContentText((totalDownloaded / 1048576) + " MB downloaded");
                            }
                            nm.notify(PROGRESS_NOTIFICATION_ID, notifBuilder.build());
                        }
                    }
                }

                out.flush();

                // Clear ongoing download notification
                if (nm != null) {
                    nm.cancel(PROGRESS_NOTIFICATION_ID);
                }

                // Emit downloaded / installing status
                JSObject completeObj = new JSObject();
                completeObj.put("progress", 100);
                completeObj.put("status", "installing");
                completeObj.put("filePath", destinationFile.getAbsolutePath());
                notifyListeners("downloadProgress", completeObj);

                // Launch package installer
                installApkFile(destinationFile);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filePath", destinationFile.getAbsolutePath());
                call.resolve(ret);

            } catch (Exception e) {
                if (nm != null) {
                    nm.cancel(PROGRESS_NOTIFICATION_ID);
                }

                JSObject errObj = new JSObject();
                errObj.put("status", "error");
                errObj.put("error", e.getMessage());
                notifyListeners("downloadProgress", errObj);

                call.reject("APK Download/Install failed: " + e.getMessage(), e);
            } finally {
                try {
                    if (out != null) out.close();
                    if (in != null) in.close();
                    if (conn != null) conn.disconnect();
                } catch (Exception ignored) {}
            }
        });
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String path = call.getString("filePath");
        String version = call.getString("version", "latest");
        File file;

        if (path != null && !path.isEmpty()) {
            file = new File(path);
        } else {
            file = new File(new File(getContext().getCacheDir(), "updates"), "ledger-v" + version + ".apk");
        }

        if (!file.exists()) {
            call.reject("APK file does not exist at path: " + file.getAbsolutePath());
            return;
        }

        try {
            installApkFile(file);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to launch package installer: " + e.getMessage(), e);
        }
    }

    private void installApkFile(File apkFile) {
        Context context = getContext();
        Uri apkUri = FileProvider.getUriForFile(
            context,
            context.getPackageName() + ".fileprovider",
            apkFile
        );

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }
}
