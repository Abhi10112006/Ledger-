
import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';

type KeyboardLayout = 'text' | 'number' | 'email';

interface KeyboardContextType {
  isVisible: boolean;
  activeInput: HTMLInputElement | null;
  layout: KeyboardLayout;
  inputCallback: ((val: string) => void) | null;
  openKeyboard: (input: HTMLInputElement, layout?: KeyboardLayout, onInput?: (val: string) => void) => void;
  closeKeyboard: (immediate?: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const [layout, setLayout] = useState<KeyboardLayout>('text');
  const [inputCallback, setInputCallback] = useState<((val: string) => void) | null>(null);
  
  // Timer reference for debounce logic
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openKeyboard = useCallback((input: HTMLInputElement, type: KeyboardLayout = 'text', onInput?: (val: string) => void) => {
    // 1. Clear any pending close timer immediately
    if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
    }

    // 2. Open Keyboard with config
    setActiveInput(input);
    setLayout(type);
    if (onInput) {
      setInputCallback(() => onInput);
    } else {
      setInputCallback(null);
    }
    setIsVisible(true);

    // 3. Scroll input into view
    setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 300);
  }, []);

  const closeKeyboard = useCallback((immediate = false) => {
    if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
    }

    if (immediate) {
        document.body.style.overflow = '';
        setIsVisible(false);
        setActiveInput(null);
        setInputCallback(null);
    } else {
        closeTimerRef.current = setTimeout(() => {
            document.body.style.overflow = '';
            setIsVisible(false);
            setActiveInput(null);
            setInputCallback(null);
            closeTimerRef.current = null;
        }, 150);
    }
  }, []);

  return (
    <KeyboardContext.Provider value={{ 
      isVisible, 
      activeInput, 
      layout, 
      inputCallback,
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
