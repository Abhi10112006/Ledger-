package com.abhisledger.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.HashSet;

@CapacitorPlugin(
    name = "NativeContacts",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_CONTACTS }, alias = "contacts")
    }
)
public class NativeContactsPlugin extends Plugin {

    @PluginMethod
    public void getDeviceContacts(PluginCall call) {
        try {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionForAlias("contacts", call, "contactsPermCallback");
                return;
            }
            fetchAndReturnContacts(call);
        } catch (Exception e) {
            call.reject("Error fetching device contacts: " + e.getMessage(), e);
        }
    }

    @PermissionCallback
    private void contactsPermCallback(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            fetchAndReturnContacts(call);
        } else {
            call.reject("Permission denied", "PERMISSION_DENIED");
        }
    }

    private void fetchAndReturnContacts(PluginCall call) {
        JSArray contactsList = new JSArray();
        HashSet<String> seen = new HashSet<>();

        String[] projection = new String[]{
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        };

        String sortOrder = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " COLLATE NOCASE ASC";

        try (Cursor cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
        )) {
            if (cursor != null) {
                int idIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (cursor.moveToNext()) {
                    String name = nameIdx >= 0 ? cursor.getString(nameIdx) : "";
                    String rawNum = numIdx >= 0 ? cursor.getString(numIdx) : "";
                    if (name == null || name.trim().isEmpty()) continue;

                    String cleanedNum = rawNum != null ? rawNum.replaceAll("[^\\d+]", "") : "";
                    String key = name.trim().toLowerCase() + "_" + cleanedNum;
                    if (seen.contains(key)) continue;
                    seen.add(key);

                    JSObject item = new JSObject();
                    item.put("id", idIdx >= 0 ? cursor.getString(idIdx) : String.valueOf(seen.size()));
                    item.put("name", name.trim());
                    item.put("phone", cleanedNum.length() > 0 ? cleanedNum : (rawNum != null ? rawNum.trim() : ""));
                    contactsList.put(item);
                }
            }
        } catch (Exception e) {
            call.reject("Failed reading contacts cursor: " + e.getMessage(), e);
            return;
        }

        JSObject res = new JSObject();
        res.put("contacts", contactsList);
        call.resolve(res);
    }

    @PluginMethod
    public void pickContact(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
            startActivityForResult(call, intent, "pickContactResult");
        } catch (Exception e) {
            call.reject("Could not launch contact picker: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void pickContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri contactUri = result.getData().getData();
            if (contactUri == null) {
                call.reject("No contact data returned");
                return;
            }

            String[] projection = new String[]{
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            };

            try (Cursor cursor = getContext().getContentResolver().query(contactUri, projection, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                    int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                    String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                    String rawPhone = numberIndex >= 0 ? cursor.getString(numberIndex) : "";

                    String cleanedPhone = rawPhone != null ? rawPhone.replaceAll("[^\\d+]", "") : "";

                    JSObject ret = new JSObject();
                    ret.put("name", name != null ? name.trim() : "");
                    ret.put("phone", cleanedPhone.length() > 0 ? cleanedPhone : (rawPhone != null ? rawPhone.trim() : ""));
                    call.resolve(ret);
                    return;
                }
            } catch (Exception e) {
                call.reject("Failed to read contact: " + e.getMessage(), e);
                return;
            }

            call.reject("Contact was empty");
        } else if (result.getResultCode() == Activity.RESULT_CANCELED) {
            call.reject("User cancelled", "USER_CANCELLED");
        } else {
            call.reject("Selection failed");
        }
    }
}
