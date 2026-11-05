import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'debt_reminders';

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
  } catch (e) {
    console.warn('Notification channel init error:', e);
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
