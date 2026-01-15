
import React, { useMemo, useRef } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

type KeyboardType = 'text' | 'number' | 'email';

export const useVirtualKeyboard = (
  type: KeyboardType = 'text',
  onChange?: (val: string) => void
) => {
  const { openKeyboard, closeKeyboard, isEnabled } = useKeyboard();
  
  // Generate a random ID for this input instance to prevent browser heuristics from
  // identifying the field (e.g. "name", "address") based on persistent IDs or Names.
  const fieldId = useRef(Math.random().toString(36).slice(2, 11)).current;

  // Memoize props to prevent unnecessary re-renders and focus thrashing
  return useMemo(() => {
    // If virtual keyboard is disabled (System Keyboard Mode)
    // We use strict privacy attributes to prevent "Save Password/Address/Payment" prompts
    if (!isEnabled) {
        const cleanProps = {
            // Randomize name and id so Chrome can't learn "friendName" or "amount"
            name: `field_${fieldId}`, 
            id: `field_${fieldId}`,
            
            // Standard autocomplete off
            autoComplete: 'off',
            
            // Point to a non-existent datalist to prevent history dropdowns
            list: 'autocompleteOff', 
            
            // ALWAYS use type="search". 
            // This is the strongest signal to browsers that this field is NOT for personal data.
            // We hide the search 'X' icon via CSS in index.html.
            type: 'search', 
            
            // inputMode determines the keypad layout (Numeric vs Text) independent of type="search"
            inputMode: type === 'number' ? 'decimal' : (type === 'email' ? 'email' : 'text'),
            
            // Additional hints
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
            'data-lpignore': 'true', // Ignore LastPass
            'data-1p-ignore': 'true', // Ignore 1Password
            'data-form-type': 'other' // Generic hint
        };

        return cleanProps;
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
  }, [openKeyboard, closeKeyboard, type, isEnabled, fieldId]);
};
