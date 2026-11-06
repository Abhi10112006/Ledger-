package com.abhisledger.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDatabasePlugin.class);
        registerPlugin(NativeContactsPlugin.class);
        registerPlugin(NativeBackupPlugin.class);
        registerPlugin(NativeThemeIconPlugin.class);
        registerPlugin(NativeTypographyPlugin.class);
        registerPlugin(NativeSecurityPlugin.class);
        super.onCreate(savedInstanceState);
        disableOverScroll();
    }

    @Override
    public void onStart() {
        super.onStart();
        disableOverScroll();
    }

    @Override
    public void onResume() {
        super.onResume();
        disableOverScroll();
    }

    private void disableOverScroll() {
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setOverScrollMode(WebView.OVER_SCROLL_NEVER);
            }
        } catch (Exception e) {
            // Ignore if webview not yet attached
        }
    }
}
