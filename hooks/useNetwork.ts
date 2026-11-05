
import { useState, useEffect } from 'react';

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState(true); // Default to true until checked
  const [offlineAt, setOfflineAt] = useState<number | null>(null);

  useEffect(() => {
    let networkListener: any;

    const initNetwork = async () => {
      try {
        const { Network } = await import('@capacitor/network');

        // Initial check
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        if (!status.connected) setOfflineAt(Date.now());

        // Listen for changes
        networkListener = await Network.addListener('networkStatusChange', (status) => {
          setIsOnline(status.connected);
          if (status.connected) {
            setOfflineAt(null);
          } else {
            setOfflineAt(Date.now());
          }
        });
      } catch (e) {
        console.warn('Network plugin failed, falling back to navigator', e);
        // Fallback
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => { setIsOnline(true); setOfflineAt(null); });
        window.addEventListener('offline', () => { setIsOnline(false); setOfflineAt(Date.now()); });
      }
    };

    initNetwork();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return { isOnline, offlineAt };
};
