package com.abhisledger.app;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "NativeTypography")
public class NativeTypographyPlugin extends Plugin {

    @PluginMethod
    public void getSystemFontInfo(PluginCall call) {
        try {
            Context context = getContext();
            Configuration config = context.getResources().getConfiguration();
            float fontScale = config.fontScale;
            String locale = Locale.getDefault().toLanguageTag();
            float density = context.getResources().getDisplayMetrics().density;

            JSObject ret = new JSObject();
            ret.put("fontScale", fontScale);
            ret.put("locale", locale);
            ret.put("density", density);
            ret.put("androidVersion", Build.VERSION.RELEASE);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to query system typography: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void applyTextRenderingOptimizations(PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        WebSettings settings = webView.getSettings();
                        settings.setTextZoom(100);
                        settings.setStandardFontFamily("sans-serif");
                        settings.setSansSerifFontFamily("sans-serif");
                        settings.setSerifFontFamily("serif");
                        settings.setFixedFontFamily("monospace");

                        // Enable hardware rendering acceleration for crisp font typography
                        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    }
                    JSObject ret = new JSObject();
                    ret.put("optimized", true);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to apply rendering optimizations: " + e.getMessage(), e);
                }
            }
        });
    }
}
