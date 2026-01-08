
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 1. PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Explicitly using /sw.js to resolve to root
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('OFFLINE READY: ServiceWorker registered with scope: ', registration.scope);
    } catch (error) {
      console.warn('ServiceWorker registration note:', error);
      console.log('Note: If you are in a preview iframe, this error is expected and can be ignored.');
    }
  });
}

// 2. Request Persistent Storage
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    if (granted) {
      console.log("Storage will not be cleared except by explicit user action");
    } else {
      console.log("Storage may be cleared by the UA under storage pressure.");
    }
  });
}
