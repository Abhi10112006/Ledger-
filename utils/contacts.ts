import { Capacitor, registerPlugin } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

interface NativeContactsPluginInterface {
  pickContact: () => Promise<{ name: string; phone: string }>;
  getDeviceContacts: () => Promise<{ contacts: DeviceContact[] }>;
}

const NativeContacts = registerPlugin<NativeContactsPluginInterface>('NativeContacts');

export interface PickedContactResult {
  name: string;
  phone: string;
  cancelled: boolean;
  error?: string;
}

let cachedContactsList: DeviceContact[] | null = null;

/**
 * Fetch all contacts from device phonebook.
 * Uses native Android ContentResolver for ultra-fast performance.
 */
export const fetchDeviceContactsList = async (forceRefresh = false): Promise<DeviceContact[]> => {
  if (cachedContactsList && !forceRefresh) {
    return cachedContactsList;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeContacts.getDeviceContacts();
      if (res && Array.isArray(res.contacts)) {
        cachedContactsList = res.contacts;
        return res.contacts;
      }
    } catch (e: any) {
      console.warn('Native getDeviceContacts failed, attempting community fallback:', e);
    }
  }

  // Fallback to community plugin
  try {
    try {
      await Contacts.requestPermissions();
    } catch {}

    const result = await Contacts.getContacts({
      projection: { name: true, phones: true }
    });

    if (result && Array.isArray(result.contacts)) {
      const mapped: DeviceContact[] = [];
      const seen = new Set<string>();

      for (const c of result.contacts) {
        let name = c.name?.display;
        if (!name) {
          const given = c.name?.given || '';
          const family = c.name?.family || '';
          name = `${given} ${family}`.trim();
        }
        if (!name) continue;

        let phone = '';
        if (c.phones && c.phones.length > 0) {
          phone = (c.phones[0].number || '').replace(/[^\d+]/g, '');
        }

        const key = `${name.toLowerCase()}_${phone}`;
        if (!seen.has(key)) {
          seen.add(key);
          mapped.push({
            id: c.contactId || String(mapped.length),
            name,
            phone
          });
        }
      }

      cachedContactsList = mapped;
      return mapped;
    }
  } catch (e) {
    console.warn('Failed fetching contacts from community plugin:', e);
  }

  return [];
};

/**
 * Fallback native OS contact picker
 */
export const pickDeviceContact = async (): Promise<PickedContactResult> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await NativeContacts.pickContact();
      if (result && (result.name || result.phone)) {
        return {
          name: result.name || '',
          phone: result.phone || '',
          cancelled: false
        };
      }
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('user cancelled') || msg.includes('cancelled') || e?.code === 'USER_CANCELLED') {
        return { name: '', phone: '', cancelled: true };
      }
      console.warn('Native contact picker failed, falling back:', e);
    }
  }

  return { name: '', phone: '', cancelled: true };
};
