package com.abhisledger.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.concurrent.Executor;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

@CapacitorPlugin(name = "NativeSecurity")
public class NativeSecurityPlugin extends Plugin {

    private static final String TAG = "NativeSecurityPlugin";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String PIN_KEY_ALIAS = "AbhiLedger_PinKey_v2";
    private static final String MASTER_BACKUP_KEY_ALIAS = "AbhiLedger_MasterBackupKey_v2";
    private static final String PREFS_NAME = "AbhiLedgerSecurityPrefs";
    private static final String PREF_PIN_HASH = "encrypted_pin_hash";
    private static final String PREF_PIN_SALT = "pin_salt";
    private static final String PREF_PIN_IV = "pin_iv";

    private static final int GCM_TAG_LENGTH = 128;
    private static final int PBKDF2_ITERATIONS = 100000;

    private boolean isAuthenticating = false;
    private long lastAuthDismissedTime = 0;

    // ─────────────────────────────────────────────────────────────
    // HARDWARE KEYSTORE INITIALIZATION & HELPERS
    // ─────────────────────────────────────────────────────────────

    private SecretKey getOrCreateKeystoreKey(String alias) throws Exception {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
        keyStore.load(null);

        if (!keyStore.containsAlias(alias)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                KeyGenerator keyGenerator = KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES,
                    ANDROID_KEYSTORE
                );
                keyGenerator.init(
                    new KeyGenParameterSpec.Builder(
                        alias,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
                    )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .build()
                );
                return keyGenerator.generateKey();
            }
        } else {
            return (SecretKey) keyStore.getKey(alias, null);
        }

        // Fallback for older devices or if keystore entry fails
        byte[] fallbackSeed = (alias + "_AbhiLedger_Safe_Seed").getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(fallbackSeed, 0, 16, "AES");
    }

    private byte[] derivePinHash(String pin, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(pin.toCharArray(), salt, PBKDF2_ITERATIONS, 256);
        return factory.generateSecret(spec).getEncoded();
    }

    // ─────────────────────────────────────────────────────────────
    // BIOMETRIC AUTHENTICATION (FACE + FINGERPRINT)
    // ─────────────────────────────────────────────────────────────

    @PluginMethod
    public void getBiometricStatus(PluginCall call) {
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int strongAuth = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            int weakAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
            );

            boolean hasStrong = (strongAuth == BiometricManager.BIOMETRIC_SUCCESS);
            boolean hasWeakOrStrong = (weakAuth == BiometricManager.BIOMETRIC_SUCCESS);

            JSObject ret = new JSObject();
            ret.put("isAvailable", hasWeakOrStrong || hasStrong);
            ret.put("hasFingerprint", hasStrong);
            ret.put("hasFaceLock", hasWeakOrStrong);
            ret.put("canUseWeakFace", hasWeakOrStrong && !hasStrong);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isAvailable", false);
            ret.put("hasFingerprint", false);
            ret.put("hasFaceLock", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticateBiometric(PluginCall call) {
        String title = call.getString("title", "Unlock Ledger");
        String subtitle = call.getString("subtitle", "Verify your identity to proceed");
        String negativeText = call.getString("negativeButtonText", "Use 6-Digit PIN");
        String mode = call.getString("mode", "any"); // "any", "fingerprint", "face"

        isAuthenticating = true;

        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                AppCompatActivity activity = (AppCompatActivity) getActivity();
                if (activity == null) {
                    isAuthenticating = false;
                    lastAuthDismissedTime = System.currentTimeMillis();
                    call.reject("Activity is not available");
                    return;
                }

                BiometricManager biometricManager = BiometricManager.from(activity);
                int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK;
                int canAuth = biometricManager.canAuthenticate(authenticators);

                if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
                    isAuthenticating = false;
                    lastAuthDismissedTime = System.currentTimeMillis();
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("cancelled", false);
                    ret.put("usePin", true);
                    ret.put("error", "Biometrics not enrolled or unavailable on this device");
                    call.resolve(ret);
                    return;
                }

                Executor executor = ContextCompat.getMainExecutor(activity);

                BiometricPrompt biometricPrompt = new BiometricPrompt(
                    activity,
                    executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            isAuthenticating = false;
                            lastAuthDismissedTime = System.currentTimeMillis();

                            boolean userCancelled = (
                                errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                                errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                                errorCode == BiometricPrompt.ERROR_CANCELED
                            );

                            JSObject ret = new JSObject();
                            ret.put("success", false);
                            ret.put("cancelled", userCancelled);
                            ret.put("usePin", errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON);
                            ret.put("error", errString.toString());
                            ret.put("errorCode", errorCode);
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            isAuthenticating = false;
                            lastAuthDismissedTime = System.currentTimeMillis();

                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                            // Keep listening until max attempts or user cancels
                        }
                    }
                );

                BiometricPrompt.PromptInfo.Builder promptBuilder = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle)
                    .setNegativeButtonText(negativeText)
                    .setAllowedAuthenticators(authenticators);

                // Enable instant Face Unlock dismissal on API 29+ without requiring extra button tap
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    promptBuilder.setConfirmationRequired(false);
                }

                BiometricPrompt.PromptInfo promptInfo = promptBuilder.build();
                biometricPrompt.authenticate(promptInfo);

            } catch (Exception e) {
                isAuthenticating = false;
                lastAuthDismissedTime = System.currentTimeMillis();
                Log.e(TAG, "BiometricPrompt authentication failed to launch", e);
                call.reject("Biometric launch failed: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void isAuthenticating(PluginCall call) {
        boolean activeOrRecent = isAuthenticating || (System.currentTimeMillis() - lastAuthDismissedTime < 3000);
        JSObject ret = new JSObject();
        ret.put("isAuthenticating", activeOrRecent);
        call.resolve(ret);
    }

    // ─────────────────────────────────────────────────────────────
    // PHASE 3.3: HARDWARE KEYSTORE WRAPPER FOR 6-DIGIT PIN
    // ─────────────────────────────────────────────────────────────

    @PluginMethod
    public void setSecurityPin(PluginCall call) {
        String pin = call.getString("pin");
        if (pin == null || pin.length() != 6) {
            call.reject("PIN must be exactly 6 digits");
            return;
        }

        new Thread(() -> {
            try {
                // 1. Generate cryptographically secure random salt
                byte[] salt = new byte[16];
                new SecureRandom().nextBytes(salt);

                // 2. Compute PBKDF2 SHA-256 hash
                byte[] rawHash = derivePinHash(pin, salt);

                // 3. Encrypt the hash using Hardware Android KeyStore AES-GCM
                SecretKey keystoreKey = getOrCreateKeystoreKey(PIN_KEY_ALIAS);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.ENCRYPT_MODE, keystoreKey);
                byte[] iv = cipher.getIV();
                byte[] cipherText = cipher.doFinal(rawHash);

                // 4. Save encrypted hash + salt + IV in private SharedPreferences
                SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit()
                    .putString(PREF_PIN_HASH, Base64.encodeToString(cipherText, Base64.NO_WRAP))
                    .putString(PREF_PIN_SALT, Base64.encodeToString(salt, Base64.NO_WRAP))
                    .putString(PREF_PIN_IV, Base64.encodeToString(iv, Base64.NO_WRAP))
                    .apply();

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("isEnrolled", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Failed to save security PIN in Keystore", e);
                call.reject("Failed to set PIN: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void verifySecurityPin(PluginCall call) {
        String pin = call.getString("pin");
        if (pin == null || pin.length() != 6) {
            call.reject("PIN must be 6 digits");
            return;
        }

        new Thread(() -> {
            try {
                SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String storedCipherBase64 = prefs.getString(PREF_PIN_HASH, null);
                String storedSaltBase64 = prefs.getString(PREF_PIN_SALT, null);
                String storedIvBase64 = prefs.getString(PREF_PIN_IV, null);

                if (storedCipherBase64 == null || storedSaltBase64 == null || storedIvBase64 == null) {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("isEnrolled", false);
                    ret.put("error", "No PIN enrolled yet");
                    call.resolve(ret);
                    return;
                }

                byte[] salt = Base64.decode(storedSaltBase64, Base64.DEFAULT);
                byte[] iv = Base64.decode(storedIvBase64, Base64.DEFAULT);
                byte[] expectedCipher = Base64.decode(storedCipherBase64, Base64.DEFAULT);

                // 1. Decrypt expected hash using Hardware Android KeyStore
                SecretKey keystoreKey = getOrCreateKeystoreKey(PIN_KEY_ALIAS);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
                cipher.init(Cipher.DECRYPT_MODE, keystoreKey, gcmSpec);
                byte[] expectedHash = cipher.doFinal(expectedCipher);

                // 2. Hash input PIN with stored salt
                byte[] inputHash = derivePinHash(pin, salt);

                // 3. Constant-time comparison to prevent timing attacks
                boolean matches = true;
                if (expectedHash.length != inputHash.length) {
                    matches = false;
                } else {
                    int diff = 0;
                    for (int i = 0; i < expectedHash.length; i++) {
                        diff |= expectedHash[i] ^ inputHash[i];
                    }
                    matches = (diff == 0);
                }

                JSObject ret = new JSObject();
                ret.put("success", matches);
                ret.put("isEnrolled", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Failed to verify PIN with Keystore", e);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        }).start();
    }

    @PluginMethod
    public void isPinEnrolled(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enrolled = prefs.contains(PREF_PIN_HASH);
        JSObject ret = new JSObject();
        ret.put("isEnrolled", enrolled);
        call.resolve(ret);
    }

    @PluginMethod
    public void removeSecurityPin(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(PREF_PIN_HASH)
            .remove(PREF_PIN_SALT)
            .remove(PREF_PIN_IV)
            .apply();

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("isEnrolled", false);
        call.resolve(ret);
    }

    // ─────────────────────────────────────────────────────────────
    // PHASE 3.3: HARDWARE KEYSTORE BACKUP MASTER KEY WRAPPER
    // ─────────────────────────────────────────────────────────────

    @PluginMethod
    public void getKeystoreMasterStatus(PluginCall call) {
        try {
            KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
            keyStore.load(null);
            boolean hasMasterKey = keyStore.containsAlias(MASTER_BACKUP_KEY_ALIAS);
            if (!hasMasterKey) {
                getOrCreateKeystoreKey(MASTER_BACKUP_KEY_ALIAS);
                hasMasterKey = true;
            }

            JSObject ret = new JSObject();
            ret.put("isHardwareBacked", true);
            ret.put("alias", MASTER_BACKUP_KEY_ALIAS);
            ret.put("ready", hasMasterKey);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isHardwareBacked", false);
            ret.put("ready", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void encryptWithMasterKey(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("Data cannot be null");
            return;
        }
        try {
            SecretKey key = getOrCreateKeystoreKey(MASTER_BACKUP_KEY_ALIAS);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = cipher.getIV();
            byte[] cipherText = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

            JSObject ret = new JSObject();
            ret.put("cipherText", Base64.encodeToString(cipherText, Base64.NO_WRAP));
            ret.put("iv", Base64.encodeToString(iv, Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Keystore encryption error: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void decryptWithMasterKey(PluginCall call) {
        String cipherTextBase64 = call.getString("cipherText");
        String ivBase64 = call.getString("iv");
        if (cipherTextBase64 == null || ivBase64 == null) {
            call.reject("Invalid parameters");
            return;
        }
        try {
            SecretKey key = getOrCreateKeystoreKey(MASTER_BACKUP_KEY_ALIAS);
            byte[] iv = Base64.decode(ivBase64, Base64.DEFAULT);
            byte[] cipherText = Base64.decode(cipherTextBase64, Base64.DEFAULT);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, spec);
            byte[] plainBytes = cipher.doFinal(cipherText);

            JSObject ret = new JSObject();
            ret.put("data", new String(plainBytes, StandardCharsets.UTF_8));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Keystore decryption error: " + e.getMessage(), e);
        }
    }
}
