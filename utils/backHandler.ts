import { useEffect } from 'react';

type BackHandlerCallback = () => boolean | void;

const backHandlerStack: BackHandlerCallback[] = [];

/**
 * Registers a handler to be executed when the hardware or gesture Back button is pressed.
 * Handlers operate in LIFO (Last-In-First-Out) order, exactly matching native Android navigation.
 */
export const registerBackHandler = (handler: BackHandlerCallback): (() => void) => {
  backHandlerStack.push(handler);
  return () => {
    const idx = backHandlerStack.lastIndexOf(handler);
    if (idx !== -1) {
      backHandlerStack.splice(idx, 1);
    }
  };
};

/**
 * Executes the topmost back handler.
 * Returns true if a handler was found and executed; false if the stack was empty.
 */
export const executeTopBackHandler = (): boolean => {
  if (backHandlerStack.length === 0) return false;
  const topHandler = backHandlerStack.pop();
  if (topHandler) {
    try {
      const result = topHandler();
      // If handler explicitly returned false, delegate to the next handler below it
      if (result === false) {
        return executeTopBackHandler();
      }
      return true;
    } catch (e) {
      console.error('Error executing back handler:', e);
      return false;
    }
  }
  return false;
};

export const getBackHandlersCount = (): number => backHandlerStack.length;

/**
 * React hook to register a back handler while a screen or modal is active.
 */
export const useBackHandler = (isActive: boolean, handler: BackHandlerCallback) => {
  useEffect(() => {
    if (!isActive) return;
    return registerBackHandler(handler);
  }, [isActive, handler]);
};
