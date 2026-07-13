import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept global fetch to transparently redirect localhost:5000 requests in production
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.includes('http://localhost:5000')) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      input = input.replace('http://localhost:5000', window.location.origin);
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
