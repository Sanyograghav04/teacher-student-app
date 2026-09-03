import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent accidental pinch-to-zoom and multi-touch gestures on mobile
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

