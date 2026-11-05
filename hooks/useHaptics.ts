
import { useCallback } from 'react';

/**
 * Haptic types with distinct tactile signatures:
 *  - light      → Normal taps, nav items, close modals
 *  - medium     → Primary actions like FAB, profile navigation
 *  - heavy      → Destructive actions (delete, reset) — wake-up vibration
 *  - success    → Positive outcomes (save, payment received, backup done)
 *  - warning    → Errors, warnings, invalid inputs
 *  - selection  → Picking an option (theme, tab switch, density)
 *  - double     → Toggle switches (on/off pulse)
 *  - boot       → System boot complete — a triumphant single pulse
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection' | 'double' | 'boot';

let hapticsModule: any = null;

// Lazy-load the Capacitor Haptics module once
const getHaptics = async () => {
  if (hapticsModule) return hapticsModule;
  try {
    const mod = await import('@capacitor/haptics');
    hapticsModule = mod;
    return mod;
  } catch {
    return null;
  }
};

export const triggerHaptic = async (type: HapticType): Promise<void> => {
  try {
    const mod = await getHaptics();
    if (!mod) return;

    const { Haptics, ImpactStyle, NotificationType } = mod;

    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;

      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;

      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;

      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;

      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;

      case 'selection':
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
        break;

      case 'double':
        // Double-light pulse for toggles — feels like a satisfying click
        await Haptics.impact({ style: ImpactStyle.Light });
        await new Promise(r => setTimeout(r, 80));
        await Haptics.impact({ style: ImpactStyle.Light });
        break;

      case 'boot':
        // Boot complete: medium → pause → success
        await Haptics.impact({ style: ImpactStyle.Medium });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.notification({ type: NotificationType.Success });
        break;

      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    // Silently fail on web or unsupported devices
  }
};

/**
 * Hook version for use inside React components.
 * Returns a memoized triggerHaptic function.
 */
export const useHaptics = () => {
  const haptic = useCallback((type: HapticType) => {
    triggerHaptic(type);
  }, []);

  return haptic;
};
