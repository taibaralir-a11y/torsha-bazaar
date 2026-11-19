import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register and update service worker safely
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('TORSHA BAZAAR updated in background.');
  },
  onOfflineReady() {
    console.info('TORSHA BAZAAR PWA offline shell ready.');
  },
});

if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistration()
    .then((existing) => {
      if (!existing) {
        return navigator.serviceWorker.register('/sw-ride-notifications.js', { scope: '/' });
      }
      return existing;
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);

