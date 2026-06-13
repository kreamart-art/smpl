import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { Providers } from './context/AppContext.jsx'
import { PWAProvider } from './context/PWAContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LangProvider } from './i18n/index.jsx'
import { isNative, initNative } from './lib/native.js'
import './index.css'

// Native shell (Capacitor): lock portrait, set the status bar, hide the splash.
initNative()

// Register the service worker in production (web only — the native app bundles
// its own assets and doesn't want a SW intercepting requests).
if (!isNative && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PWAProvider>
        <ThemeProvider>
          <LangProvider>
            <Providers>
              <App />
            </Providers>
          </LangProvider>
        </ThemeProvider>
      </PWAProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
