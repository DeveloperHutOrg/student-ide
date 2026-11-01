import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Configure Monaco Editor to load local bundled monaco-editor (100% offline, no CDN)
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

loader.config({ monaco });

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary fallbackTitle="Student IDE Encountered an Unexpected Error">
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
