package com.abhisledger.app;

import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

@CapacitorPlugin(name = "NativeBackup")
public class NativeBackupPlugin extends Plugin {

    private static final String HEADER_V3 = "ABHI_LEDGER_ENCRYPTED_V3:";
    private static final String HEADER_V2 = "ABHI_LEDGER_ENCRYPTED_V2:";
    private static final String MASTER_SECRET = "AbhiLedgerMasterEncryptedV2_#9871!";
    private static final byte[] FIXED_SALT = "AbhiLedgerAppSalt_2026_Secure".getBytes(StandardCharsets.UTF_8);
    private static final int GCM_IV_LENGTH = 12; // 96 bits recommended for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bit auth tag
    private static final String KEYSTORE_ALIAS = "AbhiLedgerMasterKeyAlias_v3";

    private SecretKey getOrCreateKeystoreKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    KeyGenerator keyGen = KeyGenerator.getInstance(
                        android.security.keystore.KeyProperties.KEY_ALGORITHM_AES,
                        "AndroidKeyStore"
                    );
                    keyGen.init(
                        new android.security.keystore.KeyGenParameterSpec.Builder(
                            KEYSTORE_ALIAS,
                            android.security.keystore.KeyProperties.PURPOSE_ENCRYPT | android.security.keystore.KeyProperties.PURPOSE_DECRYPT
                        )
                        .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .setRandomizedEncryptionRequired(false)
                        .build()
                    );
                    return keyGen.generateKey();
                }
            } else {
                return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEYSTORE_ALIAS, null)).getSecretKey();
            }
        } catch (Exception e) {
            // Fallback to PBKDF2 deterministic master key for portable compatibility
        }
        return null;
    }

    private SecretKey derivePortableKey() throws Exception {
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
            // Portable PBKDF2-derived AES-256-GCM key ensures backups can be restored across devices
            SecretKey secretKey = derivePortableKey();

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

            String encoded = HEADER_V3 + Base64.encodeToString(combined, Base64.NO_WRAP);

            JSObject ret = new JSObject();
            ret.put("encryptedData", encoded);
            ret.put("version", 3);
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
            String base64Content;
            if (payload.startsWith(HEADER_V3)) {
                base64Content = payload.substring(HEADER_V3.length());
            } else if (payload.startsWith(HEADER_V2)) {
                base64Content = payload.substring(HEADER_V2.length());
            } else {
                call.reject("Invalid file format. Not an encrypted Ledger backup file.");
                return;
            }

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

            SecretKey secretKey = derivePortableKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            byte[] decrypted = cipher.doFinal(cipherText);
            String plainText = new String(decrypted, StandardCharsets.UTF_8);

            JSObject ret = new JSObject();
            ret.put("data", plainText);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Decryption failed. File may be corrupted or created with another key: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveToLedgerFolder(PluginCall call) {
        String fileName = call.getString("fileName");
        String subfolder = call.getString("subfolder", "Documents");
        String base64Data = call.getString("base64Data");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (fileName == null || fileName.isEmpty()) {
            call.reject("File name is required");
            return;
        }
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("File data is required");
            return;
        }

        try {
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            String relativeSubDir = "Ledger/" + subfolder;
            String publicDisplayPath = "Documents/" + relativeSubDir + "/" + fileName;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/" + relativeSubDir);

                Uri collection = MediaStore.Files.getContentUri("external");
                Uri itemUri = getContext().getContentResolver().insert(collection, values);

                if (itemUri != null) {
                    try (OutputStream os = getContext().getContentResolver().openOutputStream(itemUri)) {
                        if (os != null) {
                            os.write(fileBytes);
                            os.flush();
                        }
                    }
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("uri", itemUri.toString());
                    ret.put("path", publicDisplayPath);
                    call.resolve(ret);
                    return;
                }
            }

            // Fallback for API < 29 or if MediaStore insert returns null
            File docsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
            File ledgerSubDir = new File(docsDir, relativeSubDir);
            if (!ledgerSubDir.exists()) {
                ledgerSubDir.mkdirs();
            }
            File destFile = new File(ledgerSubDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(destFile)) {
                fos.write(fileBytes);
                fos.flush();
            }

            // Trigger system MediaScanner so file appears instantly in Files / File Manager apps
            MediaScannerConnection.scanFile(
                getContext(),
                new String[]{destFile.getAbsolutePath()},
                new String[]{mimeType},
                null
            );

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("uri", Uri.fromFile(destFile).toString());
            ret.put("path", publicDisplayPath);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to save file to Ledger storage: " + e.getMessage(), e);
        }
    }
}
