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
        "emerald", "violet", "blue", "rose", "amber", "platinum", "tokyo", "crimson", "aurora", "carbon"
    };

    @PluginMethod
    public void changeIcon(PluginCall call) {
        String rawTheme = call.getString("theme", "emerald");
        String theme = rawTheme != null ? rawTheme.toLowerCase().trim() : "emerald";

        // Validate theme or fallback to emerald
        boolean validTheme = false;
        for (String t : THEMES) {
            if (t.equals(theme)) {
                validTheme = true;
                break;
            }
        }
        if (!validTheme) {
            theme = "emerald";
        }

        Context context = getContext();
        PackageManager pm = context.getPackageManager();
        String packageName = context.getPackageName();

        try {
            // 1. Enable the new target activity-alias first with DONT_KILL_APP
            String targetAliasName = packageName + ".MainActivity" + capitalize(theme);
            ComponentName targetComponent = new ComponentName(packageName, targetAliasName);

            pm.setComponentEnabledSetting(
                targetComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );

            // 2. Disable all other activity-aliases (disabling the previous one) with DONT_KILL_APP
            for (String t : THEMES) {
                if (!t.equals(theme)) {
                    String otherAliasName = packageName + ".MainActivity" + capitalize(t);
                    ComponentName otherComponent = new ComponentName(packageName, otherAliasName);

                    int currentState = pm.getComponentEnabledSetting(otherComponent);
                    // Only disable if not already disabled
                    if (currentState != PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                        pm.setComponentEnabledSetting(
                            otherComponent,
                            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                            PackageManager.DONT_KILL_APP
                        );
                    }
                }
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
