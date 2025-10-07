
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// HTML se 'root' element ko pakad rahe hain jahan app render hoga.
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Agar 'root' element nahi mila to error throw kar rahe hain.
  throw new Error("Could not find root element to mount to");
}

// React 18 ka naya root API use kar rahe hain.
const root = ReactDOM.createRoot(rootElement);
// App component ko render kar rahe hain.
// React.StrictMode development ke time potential problems ko highlight karta hai.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);