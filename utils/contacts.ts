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

  const sanitizeAndSort = (rawContacts: any[]): DeviceContact[] => {
    const mapped: DeviceContact[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rawContacts.length; i++) {
      const c = rawContacts[i];
      if (!c) continue;
      const rawName = typeof c.name === 'string' ? c.name : (c.name?.display || c.displayName || '');
      const name = (rawName || '').trim();
      if (!name) continue;

      let phone = '';
      if (typeof c.phone === 'string') {
        phone = c.phone.trim();
      } else if (Array.isArray(c.phones) && c.phones.length > 0) {
        phone = (c.phones[0]?.number || '').trim();
      }

      const key = `${name.toLowerCase()}_${phone.replace(/[^\d+]/g, '')}`;
      if (!seen.has(key)) {
        seen.add(key);
        mapped.push({
          id: c.id ? String(c.id) : `contact_${i}`,
          name,
          phone
        });
      }
    }

    // Default alphabetical sorting A-Z
    mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return mapped;
  };

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeContacts.getDeviceContacts();
      if (res && Array.isArray(res.contacts) && res.contacts.length > 0) {
        const sorted = sanitizeAndSort(res.contacts);
        cachedContactsList = sorted;
        return sorted;
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
      const sorted = sanitizeAndSort(result.contacts);
      cachedContactsList = sorted;
      return sorted;
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
