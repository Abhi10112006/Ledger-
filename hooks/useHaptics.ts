import { useCallback } from 'react';

/**
 * Priority-Based Haptic Hierarchy:
 *  - heavy      (Priority 1 - Critical): Destructive actions (delete, factory reset) — firm 28ms alert
 *  - success    (Priority 2 - Rewarding): Confirmations (save transaction, payment recorded, backup done)
 *  - warning    (Priority 3 - Alert): Validation error, invalid inputs
 *  - error      (Priority 3 - Alert): Operation failure
 *  - medium     (Priority 4 - Primary Action): Primary commit / FAB button press
 *  - double     (Priority 5 - Control Toggle): Toggle switch on/off (single crisp micro-click)
 *  - selection  (Priority 6 - Picker/Tabs): Theme color swatches, segmented tabs, currency pills (feather-light tick)
 *  - key        (Priority 7 - Keystrokes): Virtual keyboard typing (ultra-delicate 3ms micro-pulse, throttled)
 *  - light      (Low Priority): Subtle secondary touch
 *  - boot       (System Boot): Startup pulse
 */
export type HapticType =
  | 'light'
  | 'selection'
  | 'key'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'double'
  | 'boot';

let hapticsModule: any = null;
let lastHapticTime = 0;

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
  const now = performance.now();

  // Intelligent throttling to prevent motor stacking and user annoyance
  if (type === 'key') {
    if (now - lastHapticTime < 65) return; // Drop rapid key-repeat vibrations
  } else if (type === 'selection' || type === 'light') {
    if (now - lastHapticTime < 45) return; // Prevent swatch spamming
  }
  lastHapticTime = now;

  try {
    const mod = await getHaptics();

    if (mod) {
      const { Haptics, ImpactStyle, NotificationType } = mod;

      switch (type) {
        case 'key':
          // Feather micro-tick for typing (clean iOS-like keyboard feedback)
          if (Haptics.selectionChanged) {
            await Haptics.selectionChanged();
          } else {
            await Haptics.impact({ style: ImpactStyle.Light });
          }
          break;

        case 'selection':
          // Ultra-light selection tick (tabs, swatches, pills)
          if (Haptics.selectionChanged) {
            await Haptics.selectionChanged();
          } else {
            await Haptics.impact({ style: ImpactStyle.Light });
          }
          break;

        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'double':
          // Crisp toggle switch click (single snappy light impact, not an annoying double motor buzz)
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'medium':
          // Primary action (FAB, key actions)
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;

        case 'heavy':
          // Destructive confirmation (delete loan/profile, reset DB)
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;

        case 'success':
          // Positive outcome (transaction saved, payment recorded, backup done)
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case 'warning':
        case 'error':
          await Haptics.notification({ type: NotificationType.Warning });
          break;

        case 'boot':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
      return;
    }

    // Web / Fallback via navigator.vibrate with refined micro-durations
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (type) {
        case 'key':
          navigator.vibrate(3); // 3ms tiny micro-tick
          break;
        case 'selection':
          navigator.vibrate(5); // 5ms soft tick
          break;
        case 'light':
          navigator.vibrate(8); // 8ms light tick
          break;
        case 'double':
          navigator.vibrate(8); // 8ms single toggle click
          break;
        case 'medium':
          navigator.vibrate(15); // 15ms firm tap
          break;
        case 'heavy':
          navigator.vibrate(28); // 28ms deliberate alert
          break;
        case 'success':
          navigator.vibrate([10, 40, 15]); // Success double-tap
          break;
        case 'warning':
        case 'error':
          navigator.vibrate([20, 50, 20]);
          break;
        case 'boot':
          navigator.vibrate([10, 50, 12]);
          break;
      }
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
  return useCallback((type: HapticType) => {
    triggerHaptic(type);
  }, []);
};
