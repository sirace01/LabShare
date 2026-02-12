import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is temporarily disabled to prevent double-firing of WebRTC connection logic in development
  // In a production environment with proper cleanup, StrictMode is fine, but for this demo, it simplifies signaling.
  <App />
);