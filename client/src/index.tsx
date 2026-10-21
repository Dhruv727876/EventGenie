/**
 * @module EventGenie/Index
 * @description Application client bootstrap mounting React root to DOM container
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import ReactDOM from 'react-dom/client';

// --- Internal Modules ---
import { App } from './App';

// --- Styles ---
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
