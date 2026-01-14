
import React from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

type KeyboardType = 'text' | 'number' | 'email';

export const useVirtualKeyboard = (type: KeyboardType = 'text') => {
  const { openKeyboard, closeKeyboard } = useKeyboard();

  return {
    readOnly: false, // Must be false to show cursor
    inputMode: 'none' as const, // Prevents native keyboard
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      openKeyboard(e.target, type);
    },
    onClick: (e: React.MouseEvent<HTMLInputElement>) => {
      openKeyboard(e.currentTarget, type);
    },
    // Close keyboard when focus is lost (e.g. clicking outside)
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        // We do NOT use a local setTimeout here because KeyboardContext already has a debounce.
        // Using double timeouts causes race conditions where the openKeyboard clears the
        // context timer, but then THIS local timer fires and calls closeKeyboard(), starting a new close timer.
        closeKeyboard();
    },
    className: 'cursor-pointer select-none' 
  };
};
