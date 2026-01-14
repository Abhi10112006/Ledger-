
import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';

type KeyboardLayout = 'text' | 'number' | 'email';

interface KeyboardContextType {
  isVisible: boolean;
  activeInput: HTMLInputElement | null;
  layout: KeyboardLayout;
  openKeyboard: (input: HTMLInputElement, layout?: KeyboardLayout) => void;
  closeKeyboard: (immediate?: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const [layout, setLayout] = useState<KeyboardLayout>('text');
  
  // Timer reference for debounce logic
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openKeyboard = useCallback((input: HTMLInputElement, type: KeyboardLayout = 'text') => {
    // 1. Clear any pending close timer immediately
    // This handles the case where focus shifts from Input A -> Input B
    // Input A's blur triggers closeKeyboard (delayed), but Input B's focus fires this immediately after
    if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
    }

    // 2. Open Keyboard
    setActiveInput(input);
    setLayout(type);
    setIsVisible(true);

    // 3. Scroll input into view (slight delay for animation)
    setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 300);
  }, []);

  const closeKeyboard = useCallback((immediate = false) => {
    // Clear existing timer if any
    if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
    }

    if (immediate) {
        document.body.style.overflow = '';
        setIsVisible(false);
        setActiveInput(null);
    } else {
        // Debounce close to prevent flickering on focus switch
        closeTimerRef.current = setTimeout(() => {
            document.body.style.overflow = '';
            setIsVisible(false);
            setActiveInput(null);
            closeTimerRef.current = null;
        }, 150);
    }
  }, []);

  return (
    <KeyboardContext.Provider value={{ 
      isVisible, 
      activeInput, 
      layout, 
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
