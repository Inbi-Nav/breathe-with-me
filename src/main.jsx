import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

function Root() {
  const [attempt, setAttempt] = useState(0);
  return (
    <ErrorBoundary onReset={() => setAttempt((n) => n + 1)}>
      <App key={attempt} />
    </ErrorBoundary>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
