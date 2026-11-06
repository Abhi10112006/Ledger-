import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { VersionInfo } from './version';
import { Transaction } from '../types';

export const CHANNEL_ID = 'debt_reminders';
export const CHANNEL_APP_UPDATES = 'app_updates';

export interface NativeRemindersPluginInterface {
  scheduleDebtReminders(options: {
    txId: string;
    friendName: string;
    amount: number;
    currency: string;
    returnDate: string;
    friendPhone?: string;
  }): Promise<{ success: boolean; txId: string; scheduledCount: number }>;
  cancelDebtReminders(options: { txId: string }): Promise<{ success: boolean; txId: string }>;
  testReminderNotification(options?: {
    friendName?: string;
    friendPhone?: string;
    amount?: number;
    currency?: string;
  }): Promise<{ success: boolean; notifId: number }>;
}

export const NativeReminders = registerPlugin<NativeRemindersPluginInterface>('NativeReminders');

/**
 * Initializes notification channels for high-priority heads-up banners, LED lights, and vibrations.
 */
export const initNotificationChannels = async () => {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Debt & Settlement Reminders',
      description: 'Heads-up alerts for upcoming settlements, due dates, and overdue follow-ups',
      importance: 5, // High importance (heads-up notification)
      visibility: 1, // Visible on secure lock screen
      vibration: true,
      lights: true,
      lightColor: '#10b981'
    });

    await LocalNotifications.createChannel({
      id: CHANNEL_APP_UPDATES,
      name: 'App Updates & Releases',
      description: 'Notifications when new versions of Abhi\'s Ledger are available',
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#0a84ff'
    });
  } catch (e) {
    console.warn('Notification channel init error:', e);
  }
};

/**
 * Requests notification display permission from the user (Android 13+ POST_NOTIFICATIONS)
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const result = await LocalNotifications.requestPermissions();
    if (result.display === 'granted') {
      await initNotificationChannels();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error requesting notification permissions', e);
    return false;
  }
};

/**
 * Hash helper for numeric notification IDs
 */
const getBaseNumericId = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % 100000;
};

/**
 * Comprehensive Multi-Stage Debt Reminder Engine (Phase 3.2):
 * - 4 Days Before (-4d, 10:00 AM)
 * - 2 Days Before (-2d, 10:00 AM)
 * - 1 Day Before (-1d, 10:00 AM)
 * - On Due Date Morning (Day 0, 9:00 AM)
 * - On Due Date Evening (Day 0, 6:00 PM)
 * - Overdue Sequence in multiples of 2 days (+2d, +4d, +6d, ..., +30d at 10:00 AM)
 */
export const scheduleDebtReminder = async (
  txId: string,
  name: string,
  amount: number,
  currency: string,
  dateStr: string,
  friendPhone?: string
) => {
  try {
    await initNotificationChannels();

    // 1. NATIVE ANDROID: Use Hardware AlarmManager with Exact Wakeup & Boot Recovery
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeReminders.scheduleDebtReminders({
          txId,
          friendName: name,
          amount,
          currency,
          returnDate: dateStr,
          friendPhone: friendPhone?.trim() || undefined
        });
        console.log(`[NativeReminders] Scheduled ${res.scheduledCount} multi-stage reminders for tx ${txId}`);
        return;
      } catch (nativeErr) {
        console.warn('[NativeReminders] Falling back to Capacitor LocalNotifications:', nativeErr);
      }
    }

    // 2. WEB / HYBRID FALLBACK: Compute the exact same multi-stage sequence via LocalNotifications
    const baseId = getBaseNumericId(txId);
    const dueDate = new Date(dateStr);
    if (isNaN(dueDate.getTime())) return;

    // Cancel existing
    await cancelDebtReminder(txId);

    const now = Date.now();
    const formattedAmount = `${currency}${amount.toLocaleString()}`;
    const dateFormatted = dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    const notificationsToSchedule: any[] = [];

    const makeDate = (offsetDays: number, hour24: number, min = 0) => {
      const d = new Date(dueDate);
      d.setDate(d.getDate() + offsetDays);
      d.setHours(hour24, min, 0, 0);
      return d;
    };

    // Stage 1: 4 Days Before
    const dMinus4 = makeDate(-4, 10, 0);
    if (dMinus4.getTime() > now) {
      notificationsToSchedule.push({
        id: baseId * 100 + 40,
        title: `⏳ Upcoming Settlement: ${name}`,
        body: `Payment of ${formattedAmount} from ${name} is due in 4 days (${dateFormatted}).`,
        channelId: CHANNEL_ID,
        schedule: { at: dMinus4, allowWhileIdle: true },
        extra: { txId, friendPhone }
      });
    }

    // Stage 2: 2 Days Before
    const dMinus2 = makeDate(-2, 10, 0);
    if (dMinus2.getTime() > now) {
      notificationsToSchedule.push({
        id: baseId * 100 + 20,
        title: `⏳ Payment Due in 2 Days: ${name}`,
        body: `${name}'s settlement of ${formattedAmount} is due in 2 days (${dateFormatted}).`,
        channelId: CHANNEL_ID,
        schedule: { at: dMinus2, allowWhileIdle: true },
        extra: { txId, friendPhone }
      });
    }

    // Stage 3: 1 Day Before
    const dMinus1 = makeDate(-1, 10, 0);
    if (dMinus1.getTime() > now) {
      notificationsToSchedule.push({
        id: baseId * 100 + 10,
        title: `🔔 Payment Due Tomorrow: ${name}`,
        body: `Tomorrow is the settlement date for ${name} (${formattedAmount}).`,
        channelId: CHANNEL_ID,
        schedule: { at: dMinus1, allowWhileIdle: true },
        extra: { txId, friendPhone }
      });
    }

    // Stage 4: Due Date Morning (9:00 AM)
    const dDueMorning = makeDate(0, 9, 0);
    if (dDueMorning.getTime() > now) {
      notificationsToSchedule.push({
        id: baseId * 100 + 1,
        title: `🚨 Settlement Due Today: ${name}`,
        body: `${name} has a scheduled payment of ${formattedAmount} due today! Tap to check details or call.`,
        channelId: CHANNEL_ID,
        schedule: { at: dDueMorning, allowWhileIdle: true },
        extra: { txId, friendPhone }
      });
    }

    // Stage 5: Due Date Evening (6:00 PM)
    const dDueEvening = makeDate(0, 18, 0);
    if (dDueEvening.getTime() > now) {
      notificationsToSchedule.push({
        id: baseId * 100 + 2,
        title: `⏰ End of Day Due Check: ${name}`,
        body: `Did ${name} complete their ${formattedAmount} settlement today? Tap to record payment.`,
        channelId: CHANNEL_ID,
        schedule: { at: dDueEvening, allowWhileIdle: true },
        extra: { txId, friendPhone }
      });
    }

    // Stage 6: Overdue Sequence (Every 2 days after due date up to 30 days)
    const overdueDays = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
    for (const daysLate of overdueDays) {
      const dOverdue = makeDate(daysLate, 10, 0);
      if (dOverdue.getTime() > now) {
        let title = `⚠️ Payment ${daysLate} Days Overdue: ${name}`;
        let body = `Settlement delay: ${name} is ${daysLate} days late for ${formattedAmount}.`;

        if (daysLate === 2) {
          title = `⚠️ Payment 2 Days Overdue: ${name}`;
          body = `${name}'s payment of ${formattedAmount} is 2 days late. Reach out to collect settlement.`;
        } else if (daysLate === 4) {
          title = `⚠️ Payment 4 Days Overdue: ${name}`;
          body = `${name} is 4 days late on their ${formattedAmount} payment.`;
        } else if (daysLate === 10) {
          title = `🚨 Urgent: 10 Days Overdue (${name})`;
          body = `${name} has not paid ${formattedAmount} after 10 days. Tap to call or export statement.`;
        } else if (daysLate === 14) {
          title = `🚨 2 Weeks Overdue: ${name}`;
          body = `${name} has been overdue for 2 weeks on ${formattedAmount}. Follow up needed.`;
        } else if (daysLate === 30) {
          title = `🚨 1 Month Overdue: ${name}`;
          body = `${name} is 30 days overdue on ${formattedAmount}. Review balance and deal history.`;
        }

        notificationsToSchedule.push({
          id: baseId * 100 + 50 + daysLate,
          title,
          body,
          channelId: CHANNEL_ID,
          schedule: { at: dOverdue, allowWhileIdle: true },
          extra: { txId, friendPhone, daysLate }
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`[Notification Engine] Scheduled ${notificationsToSchedule.length} local reminders for ${name}`);
    }
  } catch (e) {
    console.error('Failed to schedule debt reminder sequence', e);
  }
};

/**
 * Cancels all scheduled reminders (pre-due, due-date, and overdue) for a transaction.
 */
export const cancelDebtReminder = async (txId: string) => {
  try {
    // 1. Native Android cancellation
    if (Capacitor.isNativePlatform()) {
      try {
        await NativeReminders.cancelDebtReminders({ txId });
      } catch (nativeErr) {
        console.warn('[NativeReminders] Error in native cancel:', nativeErr);
      }
    }

    // 2. LocalNotifications fallback cancellation
    const baseId = getBaseNumericId(txId);
    const idsToCancel = [
      baseId * 100 + 40,
      baseId * 100 + 20,
      baseId * 100 + 10,
      baseId * 100 + 1,
      baseId * 100 + 2,
      ...[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(d => baseId * 100 + 50 + d)
    ];

    await LocalNotifications.cancel({
      notifications: idsToCancel.map(id => ({ id }))
    });
    console.log(`[Notification Engine] Cancelled reminders for tx: ${txId}`);
  } catch (e) {
    console.error('Failed to cancel notifications', e);
  }
};

/**
 * Reschedules / synchronizes reminders for all active (uncompleted) transactions.
 * Called on application boot, backup restore, or data sync.
 */
export const syncAllDebtReminders = async (transactions: Transaction[], currency: string) => {
  try {
    if (!transactions || transactions.length === 0) return;

    for (const tx of transactions) {
      if (tx.isCompleted) {
        await cancelDebtReminder(tx.id);
      } else {
        const remainingAmount = Math.max(0, tx.principalAmount - (tx.paidAmount || 0));
        if (remainingAmount > 0 && tx.returnDate) {
          await scheduleDebtReminder(
            tx.id,
            tx.friendName,
            remainingAmount,
            currency,
            tx.returnDate,
            tx.friendPhone
          );
        }
      }
    }
    console.log(`[Notification Engine] Synchronized reminders for ${transactions.length} transactions`);
  } catch (e) {
    console.warn('[Notification Engine] Failed to sync all debt reminders:', e);
  }
};

/**
 * Fires a system tray notification when an app update is available
 */
export const notifyNewAppVersionAvailable = async (updateInfo: VersionInfo) => {
  try {
    await initNotificationChannels();

    const notifId = 999901;
    const lastNotified = localStorage.getItem('last_notified_update_version');
    if (lastNotified === updateInfo.version) {
      return; // Already notified user for this version
    }

    const changelogSnippet = updateInfo.changelog?.[0] ? ` • ${updateInfo.changelog[0]}` : '';

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `⚡ Ledger Update: v${updateInfo.version}`,
          body: `${updateInfo.versionName} is ready.${changelogSnippet} Tap to install directly!`,
          id: notifId,
          channelId: CHANNEL_APP_UPDATES,
          schedule: { at: new Date(Date.now() + 1000) },
          extra: {
            isUpdate: true,
            version: updateInfo.version,
            apkUrl: updateInfo.apkUrl,
            downloadUrl: updateInfo.downloadUrl
          }
        }
      ]
    });

    localStorage.setItem('last_notified_update_version', updateInfo.version);
    console.log(`[Notification Engine] Sent update alert for v${updateInfo.version}`);
  } catch (e) {
    console.warn('[Notification Engine] Could not post update notification:', e);
  }
};

/**
 * Triggers an immediate test reminder heads-up notification to verify sounds, vibration, and call action.
 */
export const triggerTestReminderNotification = async (
  friendName = 'Vikram Sharma',
  phone = '9876543210',
  amount = 25000,
  currency = '₹'
): Promise<{ success: boolean; reason?: string; error?: string }> => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      return { success: false, reason: 'permission_denied' };
    }

    if (Capacitor.isNativePlatform()) {
      await NativeReminders.testReminderNotification({
        friendName,
        friendPhone: phone,
        amount,
        currency,
      });
      return { success: true };
    } else {
      const notifId = Math.floor(Math.random() * 100000);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `🚨 Settlement Due Today: ${friendName}`,
            body: `${friendName} has a scheduled payment of ${currency}${amount.toLocaleString()} due today! Tap to check details or call.`,
            id: notifId,
            channelId: CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 500) },
            extra: { txId: 'test_sample_tx', friendPhone: phone }
          }
        ]
      });
      return { success: true };
    }
  } catch (e: any) {
    console.error('Failed to trigger test reminder', e);
    return { success: false, error: e?.message || String(e) };
  }
};

