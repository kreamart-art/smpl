import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { Providers } from './context/AppContext.jsx'
import { PWAProvider } from './context/PWAContext.jsx'
import './index.css'

// Register the service worker in production so the app is installable + offline.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PWAProvider>
        <Providers>
          <App />
        </Providers>
      </PWAProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
