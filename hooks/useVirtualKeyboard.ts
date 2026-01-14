
import React from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

type KeyboardType = 'text' | 'number' | 'email';

export const useVirtualKeyboard = (
  type: KeyboardType = 'text', 
  onChange?: (val: string) => void
) => {
  const { openKeyboard, closeKeyboard } = useKeyboard();

  return {
    readOnly: false, 
    inputMode: 'none' as const, 
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      openKeyboard(e.target, type, onChange);
    },
    // Adding TouchStart ensures mobile devices trigger this before native focus/click quirks
    onTouchStart: (e: React.TouchEvent<HTMLInputElement>) => {
      // Don't prevent default to allow focus, but trigger keyboard logic
      openKeyboard(e.currentTarget, type, onChange);
    },
    onClick: (e: React.MouseEvent<HTMLInputElement>) => {
      openKeyboard(e.currentTarget, type, onChange);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        closeKeyboard();
    },
    className: 'cursor-pointer select-none' 
  };
};
