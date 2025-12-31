
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
// Wrapped in try/catch and specific error logs to handle Preview Environment restrictions
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Explicitly using ./sw.js to resolve relative to current path
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      console.log('OFFLINE READY: ServiceWorker registered with scope: ', registration.scope);
    } catch (error) {
      // This error often happens in Preview environments (like AI Studio) due to cross-origin frames.
      // It does NOT affect the final deployed APK or Netlify site.
      console.warn('ServiceWorker registration note:', error);
      console.log('Note: If you are in a preview iframe, this error is expected and can be ignored.');
    }
  });
}

// 2. Request Persistent Storage
// This tells the Browser/OS: "This is a critical app, do not auto-delete my localStorage if space is low."
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    if (granted) {
      console.log("Storage will not be cleared except by explicit user action");
    } else {
      console.log("Storage may be cleared by the UA under storage pressure.");
    }
  });
}
