
import React, { useMemo } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

type KeyboardType = 'text' | 'number' | 'email';

export const useVirtualKeyboard = (
  type: KeyboardType = 'text',
  onChange?: (val: string) => void
) => {
  const { openKeyboard, closeKeyboard } = useKeyboard();

  // Memoize props to prevent unnecessary re-renders and focus thrashing
  return useMemo(() => ({
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
  }), [openKeyboard, closeKeyboard, type]);
};
