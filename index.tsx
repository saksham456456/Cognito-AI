import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// We're grabbing the 'root' element from the HTML where the app will be rendered.
const rootElement = document.getElementById('root');
if (!rootElement) {
  // If the 'root' element isn't found, we're throwing an error.
  throw new Error("Could not find root element to mount to");
}

// Using React 18's new root API.
const root = ReactDOM.createRoot(rootElement);
// We're rendering the App component.
// React.StrictMode highlights potential problems during development.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
