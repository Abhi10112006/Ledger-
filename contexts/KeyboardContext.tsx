
import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';

type KeyboardLayout = 'text' | 'number' | 'email';

interface KeyboardContextType {
  isVisible: boolean;
  activeInput: HTMLInputElement | HTMLTextAreaElement | null;
  layout: KeyboardLayout;
  isPhysicalKeyboard: boolean;
  isEnabled: boolean; // Control flag
  setEnabled: (enabled: boolean) => void;
  openKeyboard: (input: HTMLInputElement | HTMLTextAreaElement, layout?: KeyboardLayout) => void;
  closeKeyboard: (immediate?: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [layout, setLayout] = useState<KeyboardLayout>('text');
  const [isPhysicalKeyboard, setIsPhysicalKeyboard] = useState(false);
  const [isEnabled, setEnabled] = useState(false); // Default to disabled until synced

  // Timer reference for debounce logic
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openKeyboard = useCallback((input: HTMLInputElement | HTMLTextAreaElement, type?: KeyboardLayout) => {
    // Check global enabled state
    if (!isEnabled) return;

    // 0. Filter out non-text inputs
    const inputType = input.getAttribute('type');
    const ignoredTypes = ['file', 'checkbox', 'radio', 'submit', 'button', 'image', 'range', 'color', 'hidden', 'date', 'time', 'datetime-local'];
    if (inputType && ignoredTypes.includes(inputType)) return;

    // 1. Clear any pending close timer immediately
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    // 2. Open Keyboard with config
    setActiveInput(input);

    // Auto-detect layout logic
    let targetLayout = type;
    
    if (!targetLayout) {
      // Priority Check: Look for data-vk attribute from useVirtualKeyboard hook
      // This solves race conditions where global focusin overrides specific hook configs
      const explicitType = input.getAttribute('data-vk') as KeyboardLayout | null;
      
      if (explicitType === 'number' || explicitType === 'text' || explicitType === 'email') {
        targetLayout = explicitType;
      } else {
        // Fallback Heuristics
        const inputMode = input.getAttribute('inputmode');

        if (inputType === 'number' || inputMode === 'numeric' || inputMode === 'decimal') {
          targetLayout = 'number';
        } else if (inputType === 'email' || inputMode === 'email') {
          targetLayout = 'email';
        } else {
          targetLayout = 'text';
        }
      }
    }

    setLayout(targetLayout || 'text');
    setIsVisible(true);

    // 3. Scroll input into view
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 300);
  }, [isEnabled]);

  const closeKeyboard = useCallback((immediate = false) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (immediate) {
      document.body.style.overflow = '';
      setIsVisible(false);
      setActiveInput(null);
    } else {
      closeTimerRef.current = setTimeout(() => {
        document.body.style.overflow = '';
        setIsVisible(false);
        setActiveInput(null);
        closeTimerRef.current = null;
      }, 150);
    }
  }, []);

  // --- GLOBAL AUTO-DETECTION ---
  useEffect(() => {
    // If disabled globally, do not attach listeners or open keyboard
    if (!isEnabled) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Check if target is input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const el = target as HTMLInputElement | HTMLTextAreaElement;
        if (el.readOnly || el.disabled) return;

        // Filter ignored types early
        const type = el.getAttribute('type');
        const ignoredTypes = ['file', 'checkbox', 'radio', 'submit', 'button', 'image', 'range', 'color', 'hidden', 'date', 'time', 'datetime-local'];
        if (type && ignoredTypes.includes(type)) return;

        // Prevent native keyboard
        try {
          // Only force inputMode none if we haven't already handled it via hook
          if (!el.hasAttribute('data-vk')) {
              el.inputMode = 'none';
              el.autocomplete = 'off';
          }
        } catch (e) { }

        openKeyboard(el);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect actual typing (ignore modifiers, nav keys)
      // If a user types a character, we assume they have a physical KB
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setIsPhysicalKeyboard(true);
      }
    };

    // We use capture phase to detect it early
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [openKeyboard, isEnabled]);

  // Click handling to focus inputs that might not trigger focusin if already focused
  useEffect(() => {
    if (!isEnabled) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        openKeyboard(target as HTMLInputElement);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openKeyboard, isEnabled]);

  // --- APP RESUME HANDLING ---
  // Fixes issue where native keyboard appears when minimizing and restoring app
  useEffect(() => {
    if (!isEnabled) return;
    const handleResume = () => {
      // Small delay to allow browser to complete focus restoration
      setTimeout(() => {
        const el = document.activeElement as HTMLElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            const input = el as HTMLInputElement | HTMLTextAreaElement;
            const type = input.getAttribute('type');
            const ignoredTypes = ['file', 'checkbox', 'radio', 'submit', 'button', 'image', 'range', 'color', 'hidden', 'date', 'time', 'datetime-local'];
            if (type && ignoredTypes.includes(type)) return;

            // Enforce inputMode to kill native keyboard
            input.inputMode = 'none';
            
            // Re-open our virtual keyboard if it should be there
            openKeyboard(input);
        }
      }, 100);
    };

    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            handleResume();
        }
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
        window.removeEventListener('focus', handleResume);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [openKeyboard, isEnabled]);

  return (
    <KeyboardContext.Provider value={{
      isVisible: isEnabled && isVisible, // Force hidden if disabled
      activeInput,
      layout,
      isPhysicalKeyboard,
      isEnabled,
      setEnabled,
      openKeyboard,
      closeKeyboard
    }}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};
