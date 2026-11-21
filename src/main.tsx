import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/Toast.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { registerSW } from 'virtual:pwa-register';
import { initCsrfProtection } from './lib/csrf.ts';

// Promote non-blocking Google Fonts stylesheet once loaded
if (typeof document !== 'undefined') {
  const fontLink = document.getElementById('madecc-google-fonts') as HTMLLinkElement | null;
  if (fontLink) {
    fontLink.media = 'all';
  }
}

// Defer PWA service worker registration so initial render & LCP are unobstructed
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const scheduleSw = () => registerSW({ immediate: true });
  const triggerDeferredSw = () => {
    const win = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number };
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(scheduleSw, { timeout: 2500 });
    } else {
      window.setTimeout(scheduleSw, 1200);
    }
  };
  if (document.readyState === 'complete') {
    triggerDeferredSw();
  } else {
    window.addEventListener('load', triggerDeferredSw, { once: true });
  }
}

// Initialize global CSRF protection headers for all write requests
initCsrfProtection();

// Gracefully handle development HMR WebSocket disconnection errors in dev mode only
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('websocket') ||
      reasonStr.includes('WebSocket closed without opened') ||
      reasonStr.includes('failed to connect to websocket')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (event) => {
    const messageStr = String(event.message || event.error?.message || '');
    if (
      messageStr.includes('WebSocket') ||
      messageStr.includes('websocket') ||
      messageStr.includes('WebSocket closed without opened') ||
      messageStr.includes('failed to connect to websocket')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
