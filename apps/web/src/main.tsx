import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);

// Register the hand-written offline service worker (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement; ignore failures */
    });
  });
}
