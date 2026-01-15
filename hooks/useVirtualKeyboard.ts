
import React, { useMemo } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

type KeyboardType = 'text' | 'number' | 'email';

export const useVirtualKeyboard = (
  type: KeyboardType = 'text',
  onChange?: (val: string) => void
) => {
  const { openKeyboard, closeKeyboard, isEnabled } = useKeyboard();

  // Memoize props to prevent unnecessary re-renders and focus thrashing
  return useMemo(() => {
    // If virtual keyboard is disabled, return native-friendly props
    // We add standard attributes to disable autocomplete/suggestions on the system keyboard
    if (!isEnabled) {
        const cleanProps = {
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
            'data-lpignore': 'true' // Hint for password managers to ignore
        };

        if (type === 'number') {
            return {
                ...cleanProps,
                inputMode: 'decimal' as const, // Triggers numeric keypad on mobile
                type: 'text', // Prevents browser spinners
            };
        }
        return cleanProps; // Default native behavior with disabled suggestions
    }

    // Virtual Keyboard Active Props
    return {
      inputMode: 'none' as const,
      autoComplete: 'off',
      autoCorrect: 'off',
      autoCapitalize: 'off',
      spellCheck: false,
      'data-vk': type, // Store type in DOM for robust detection
      
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        openKeyboard(e.currentTarget as HTMLInputElement, type);
      },
      
      onTouchStart: (e: React.TouchEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Trigger open on touch to bypass some mobile behaviors
        openKeyboard(e.currentTarget as HTMLInputElement, type);
      },
      
      onClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        openKeyboard(e.currentTarget as HTMLInputElement, type);
      },
      
      onBlur: () => {
        closeKeyboard();
      },
      
      className: 'cursor-pointer select-none'
    };
  }, [openKeyboard, closeKeyboard, type, isEnabled]);
};
