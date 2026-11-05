package com.abhisledger.app;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

@CapacitorPlugin(name = "NativeBackup")
public class NativeBackupPlugin extends Plugin {

    private static final String HEADER_V2 = "ABHI_LEDGER_ENCRYPTED_V2:";
    private static final String MASTER_SECRET = "AbhiLedgerMasterEncryptedV2_#9871!";
    private static final byte[] FIXED_SALT = "AbhiLedgerAppSalt_2026_Secure".getBytes(StandardCharsets.UTF_8);
    private static final int GCM_IV_LENGTH = 12; // 96 bits recommended for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bit auth tag

    private SecretKey deriveKey() throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(MASTER_SECRET.toCharArray(), FIXED_SALT, 65536, 256);
        SecretKey tmp = factory.generateSecret(spec);
        return new SecretKeySpec(tmp.getEncoded(), "AES");
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        String plainText = call.getString("data");
        if (plainText == null || plainText.isEmpty()) {
            call.reject("Data to encrypt is empty");
            return;
        }

        try {
            SecretKey secretKey = deriveKey();

            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Package IV + CipherText
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            String encoded = HEADER_V2 + Base64.encodeToString(combined, Base64.NO_WRAP);

            JSObject ret = new JSObject();
            ret.put("encryptedData", encoded);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Encryption failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String encryptedData = call.getString("encryptedData");
        if (encryptedData == null || encryptedData.isEmpty()) {
            call.reject("Encrypted data is empty");
            return;
        }

        try {
            String payload = encryptedData.trim();
            if (!payload.startsWith(HEADER_V2)) {
                call.reject("Invalid file format. Not an encrypted Ledger backup file.");
                return;
            }

            String base64Content = payload.substring(HEADER_V2.length());
            byte[] combined = Base64.decode(base64Content, Base64.DEFAULT);

            if (combined.length <= GCM_IV_LENGTH) {
                call.reject("Corrupted backup payload: truncated data");
                return;
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);

            int cipherTextLength = combined.length - GCM_IV_LENGTH;
            byte[] cipherText = new byte[cipherTextLength];
            System.arraycopy(combined, GCM_IV_LENGTH, cipherText, 0, cipherTextLength);

            SecretKey secretKey = deriveKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            byte[] decrypted = cipher.doFinal(cipherText);
            String plainText = new String(decrypted, StandardCharsets.UTF_8);

            JSObject ret = new JSObject();
            ret.put("data", plainText);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Decryption failed. File may be corrupted or created by another app: " + e.getMessage(), e);
        }
    }
}
