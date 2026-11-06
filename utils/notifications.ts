import { LocalNotifications } from '@capacitor/local-notifications';
import { VersionInfo } from './version';

const CHANNEL_ID = 'debt_reminders';
export const CHANNEL_APP_UPDATES = 'app_updates';

export const initNotificationChannels = async () => {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Debt & Settlement Reminders',
      description: 'Alerts when scheduled loans and repayments are due',
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
      importance: 4, // High importance
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
 * Fires a system tray notification when an update is detected
 */
export const notifyNewAppVersionAvailable = async (updateInfo: VersionInfo) => {
  try {
    await initNotificationChannels();

    const notifId = 999901;
    // Check if we already notified for this exact version in localStorage
    const lastNotified = localStorage.getItem('last_notified_update_version');
    if (lastNotified === updateInfo.version) {
      return; // Already notified the user
    }

    const changelogSnippet = updateInfo.changelog?.[0] ? ` • ${updateInfo.changelog[0]}` : '';

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `⚡ Ledger v${updateInfo.version} Available`,
          body: `${updateInfo.versionName} is ready.${changelogSnippet} Tap to install directly!`,
          id: notifId,
          channelId: CHANNEL_APP_UPDATES,
          schedule: { at: new Date(Date.now() + 1000) }, // 1s from now
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

export const requestNotificationPermissions = async () => {
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

export const scheduleDebtReminder = async (
  txId: string,
  name: string,
  amount: number,
  currency: string,
  dateStr: string
) => {
  try {
    // Ensure channel exists
    await initNotificationChannels();

    // Generate a positive numeric ID from string UUID
    let numericId = 0;
    for (let i = 0; i < txId.length; i++) {
      numericId = (numericId + txId.charCodeAt(i) * 31) % 1000000;
    }

    const dueDate = new Date(dateStr);
    dueDate.setHours(9, 0, 0, 0); // Trigger at 9:00 AM on the due date

    // Cancel existing reminder if it exists before scheduling a new one
    await cancelDebtReminder(txId);

    // Don't schedule past events
    if (dueDate.getTime() <= Date.now()) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 Settlement Due Today",
          body: `${name} has a scheduled settlement of ${currency}${amount.toLocaleString()} due today.`,
          id: numericId,
          channelId: CHANNEL_ID,
          schedule: {
            at: dueDate,
            allowWhileIdle: true // Executes even in battery saver / Android Doze mode
          },
          extra: { txId },
          actionTypeId: "DEBT_ACTIONS"
        }
      ]
    });
    console.log(`[Notification Engine] Scheduled reminder for ${name} at ${dueDate.toISOString()} with allowWhileIdle: true`);
  } catch (e) {
    console.error('Failed to schedule notification', e);
  }
};

export const cancelDebtReminder = async (txId: string) => {
  try {
    let numericId = 0;
    for (let i = 0; i < txId.length; i++) {
      numericId = (numericId + txId.charCodeAt(i) * 31) % 1000000;
    }
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
  } catch (e) {
    console.error('Failed to cancel notification', e);
  }
};
