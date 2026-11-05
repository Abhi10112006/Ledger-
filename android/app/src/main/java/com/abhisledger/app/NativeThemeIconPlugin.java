package com.abhisledger.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeThemeIcon")
public class NativeThemeIconPlugin extends Plugin {

    private static final String[] THEMES = {
        "emerald", "violet", "blue", "rose", "amber", "tokyo", "aurora", "carbon"
    };

    @PluginMethod
    public void changeIcon(PluginCall call) {
        String theme = call.getString("theme", "emerald").toLowerCase();
        Context context = getContext();
        PackageManager pm = context.getPackageManager();
        String packageName = context.getPackageName();

        try {
            for (String t : THEMES) {
                String aliasName = packageName + ".MainActivity" + capitalize(t);
                ComponentName componentName = new ComponentName(packageName, aliasName);

                int newState = t.equals(theme)
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

                pm.setComponentEnabledSetting(
                    componentName,
                    newState,
                    PackageManager.DONT_KILL_APP
                );
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("activeTheme", theme);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to change app icon: " + e.getMessage(), e);
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
