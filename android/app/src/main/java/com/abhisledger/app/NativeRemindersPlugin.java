package com.abhisledger.app;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "NativeReminders")
public class NativeRemindersPlugin extends Plugin {

    private static final String TAG = "NativeRemindersPlugin";

    @Override
    public void load() {
        super.load();
        DebtReminderBroadcastReceiver.createNotificationChannel(getContext());
    }

    /**
     * Schedules the comprehensive multi-stage reminder sequence:
     * 1. 4 days before due date (10:00 AM)
     * 2. 2 days before due date (10:00 AM)
     * 3. 1 day before due date (10:00 AM)
     * 4. Due date morning (9:00 AM)
     * 5. Due date evening (6:00 PM)
     * 6. Overdue sequence: Every multiple of 2 days after due date (+2d, +4d, +6d, ..., +30d at 10:00 AM)
     */
    @PluginMethod
    public void scheduleDebtReminders(PluginCall call) {
        String txId = call.getString("txId");
        String friendName = call.getString("friendName", "Client");
        Double amount = call.getDouble("amount", 0.0);
        String currency = call.getString("currency", "₹");
        String returnDateStr = call.getString("returnDate");
        String friendPhone = call.getString("friendPhone", null);

        if (txId == null || returnDateStr == null) {
            call.reject("txId and returnDate are required");
            return;
        }

        Context context = getContext();

        new Thread(() -> {
            try {
                // 1. Cancel any existing reminders for this transaction to avoid duplicates
                DebtReminderBroadcastReceiver.cancelAlarmsForTransaction(context, txId);

                // 2. Parse due date
                Date dueDate = parseDate(returnDateStr);
                if (dueDate == null) {
                    call.reject("Invalid returnDate format");
                    return;
                }

                String formattedAmount = formatCurrency(amount, currency);
                SimpleDateFormat dateDisplayFormat = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault());
                String formattedDueDate = dateDisplayFormat.format(dueDate);

                int baseId = Math.abs(txId.hashCode() % 100000);
                long now = System.currentTimeMillis();
                int scheduledCount = 0;

                // ─── STAGE 1: 4 Days Before (10:00 AM) ───
                Calendar calMinus4 = createCalendarAtHour(dueDate, -4, 10, 0);
                if (calMinus4.getTimeInMillis() > now) {
                    int notifId = baseId * 100 + 40;
                    String title = "⏳ Upcoming Settlement: " + friendName;
                    String body = "Payment of " + formattedAmount + " from " + friendName + " is due in 4 days (" + formattedDueDate + ").";
                    DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calMinus4.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                    scheduledCount++;
                }

                // ─── STAGE 2: 2 Days Before (10:00 AM) ───
                Calendar calMinus2 = createCalendarAtHour(dueDate, -2, 10, 0);
                if (calMinus2.getTimeInMillis() > now) {
                    int notifId = baseId * 100 + 20;
                    String title = "⏳ Payment Due in 2 Days: " + friendName;
                    String body = friendName + "'s settlement of " + formattedAmount + " is due in 2 days (" + formattedDueDate + ").";
                    DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calMinus2.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                    scheduledCount++;
                }

                // ─── STAGE 3: 1 Day Before (10:00 AM) ───
                Calendar calMinus1 = createCalendarAtHour(dueDate, -1, 10, 0);
                if (calMinus1.getTimeInMillis() > now) {
                    int notifId = baseId * 100 + 10;
                    String title = "🔔 Payment Due Tomorrow: " + friendName;
                    String body = "Tomorrow is the settlement date for " + friendName + " (" + formattedAmount + ").";
                    DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calMinus1.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                    scheduledCount++;
                }

                // ─── STAGE 4: On Due Date Morning (9:00 AM) ───
                Calendar calDueMorning = createCalendarAtHour(dueDate, 0, 9, 0);
                if (calDueMorning.getTimeInMillis() > now) {
                    int notifId = baseId * 100 + 1;
                    String title = "🚨 Settlement Due Today: " + friendName;
                    String body = friendName + " has a scheduled payment of " + formattedAmount + " due today! Tap to check details or call.";
                    DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calDueMorning.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                    scheduledCount++;
                }

                // ─── STAGE 5: On Due Date Evening (6:00 PM) ───
                Calendar calDueEvening = createCalendarAtHour(dueDate, 0, 18, 0);
                if (calDueEvening.getTimeInMillis() > now) {
                    int notifId = baseId * 100 + 2;
                    String title = "⏰ End of Day Due Check: " + friendName;
                    String body = "Did " + friendName + " complete their " + formattedAmount + " settlement today? Tap to record payment.";
                    DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calDueEvening.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                    scheduledCount++;
                }

                // ─── STAGE 6: Overdue Sequence (Every 2 days after due date: +2d, +4d, +6d, ..., +30d at 10:00 AM) ───
                int[] overdueDays = new int[]{2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30};
                for (int daysLate : overdueDays) {
                    Calendar calOverdue = createCalendarAtHour(dueDate, daysLate, 10, 0);
                    if (calOverdue.getTimeInMillis() > now) {
                        int notifId = baseId * 100 + 50 + daysLate;
                        String title;
                        String body;

                        if (daysLate == 2) {
                            title = "⚠️ Payment 2 Days Overdue: " + friendName;
                            body = friendName + "'s payment of " + formattedAmount + " is 2 days late. Reach out to collect settlement.";
                        } else if (daysLate == 4) {
                            title = "⚠️ Payment 4 Days Overdue: " + friendName;
                            body = friendName + " is 4 days late on their " + formattedAmount + " payment.";
                        } else if (daysLate == 10) {
                            title = "🚨 Urgent: 10 Days Overdue (" + friendName + ")";
                            body = friendName + " has not paid " + formattedAmount + " after 10 days. Tap to call or export statement.";
                        } else if (daysLate == 14) {
                            title = "🚨 2 Weeks Overdue: " + friendName;
                            body = friendName + " has been overdue for 2 weeks on " + formattedAmount + ". Follow up needed.";
                        } else if (daysLate == 30) {
                            title = "🚨 1 Month Overdue: " + friendName;
                            body = friendName + " is 30 days overdue on " + formattedAmount + ". Review balance and deal history.";
                        } else {
                            title = "⚠️ Payment " + daysLate + " Days Overdue: " + friendName;
                            body = "Settlement delay: " + friendName + " is " + daysLate + " days late for " + formattedAmount + ".";
                        }

                        DebtReminderBroadcastReceiver.scheduleExactAlarm(context, calOverdue.getTimeInMillis(), txId, title, body, friendPhone, notifId);
                        scheduledCount++;
                    }
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("txId", txId);
                ret.put("scheduledCount", scheduledCount);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Error scheduling debt reminders", e);
                call.reject("Failed to schedule reminders: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void cancelDebtReminders(PluginCall call) {
        String txId = call.getString("txId");
        if (txId == null) {
            call.reject("txId is required");
            return;
        }

        new Thread(() -> {
            try {
                DebtReminderBroadcastReceiver.cancelAlarmsForTransaction(getContext(), txId);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("txId", txId);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Error cancelling debt reminders", e);
                call.reject("Failed to cancel reminders: " + e.getMessage(), e);
            }
        }).start();
    }

    @PluginMethod
    public void testReminderNotification(PluginCall call) {
        String friendName = call.getString("friendName", "Vikram Sharma");
        String phone = call.getString("friendPhone", "9876543210");
        Double amount = call.getDouble("amount", 25000.0);
        String currency = call.getString("currency", "₹");

        String formattedAmount = formatCurrency(amount, currency);
        int notifId = (int) (System.currentTimeMillis() % 1000000);

        DebtReminderBroadcastReceiver.showReminderNotification(
            getContext(),
            "test_sample_tx",
            "🚨 Settlement Due Today: " + friendName,
            friendName + " has a scheduled payment of " + formattedAmount + " due today! Tap to check details or call.",
            phone,
            notifId
        );

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("notifId", notifId);
        call.resolve(ret);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private Calendar createCalendarAtHour(Date baseDate, int dayOffset, int hour24, int minute) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(baseDate);
        cal.add(Calendar.DAY_OF_YEAR, dayOffset);
        cal.set(Calendar.HOUR_OF_DAY, hour24);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal;
    }

    private Date parseDate(String dateStr) {
        String[] patterns = new String[]{
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd"
        };
        for (String pattern : patterns) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(pattern, Locale.US);
                return sdf.parse(dateStr);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String formatCurrency(Double amount, String currencySymbol) {
        try {
            NumberFormat nf = NumberFormat.getInstance(Locale.getDefault());
            return currencySymbol + nf.format(amount != null ? amount.longValue() : 0);
        } catch (Exception e) {
            return currencySymbol + amount;
        }
    }
}
