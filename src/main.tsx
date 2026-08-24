import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/Toast.tsx';
import { initCsrfProtection } from './lib/csrf.ts';

// Initialize global CSRF protection headers for all write requests
initCsrfProtection();

// Gracefully handle development HMR WebSocket disconnection errors
if (typeof window !== 'undefined') {
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
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
