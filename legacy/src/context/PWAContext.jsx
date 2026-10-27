import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Tracks whether SMPL is running as an installed app (standalone) vs in a
// browser, and brokers the "install" prompt. `?app=1` / `?app=0` force the
// app shell on/off for testing in the preview.
const PWACtx = createContext(null)
export const usePWA = () => useContext(PWACtx)

function forcedFlag() {
  try {
    return localStorage.getItem('smpl_app')
  } catch {
    return null
  }
}

function detectStandalone() {
  const forced = forcedFlag()
  if (forced === '1') return true
  if (forced === '0') return false
  return (
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator?.standalone === true
  )
}

const detectIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent || '') ||
  // iPadOS reports as Mac with touch
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function PWAProvider({ children }) {
  const [standalone, setStandalone] = useState(detectStandalone)
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    // honour the ?app= override and persist it
    const sp = new URLSearchParams(window.location.search)
    if (sp.has('app')) {
      try {
        if (sp.get('app') === '0') localStorage.removeItem('smpl_app')
        else localStorage.setItem('smpl_app', '1')
      } catch {
        /* ignore */
      }
      setStandalone(detectStandalone())
    }

    const onBIP = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMQ = () => setStandalone(detectStandalone())
    mq?.addEventListener?.('change', onMQ)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', onMQ)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return { ok: false }
    deferred.prompt()
    const choice = await deferred.userChoice.catch(() => null)
    setDeferred(null)
    return { ok: choice?.outcome === 'accepted' }
  }, [deferred])

  const setAppMode = useCallback((on) => {
    try {
      if (on) localStorage.setItem('smpl_app', '1')
      else localStorage.setItem('smpl_app', '0')
    } catch {
      /* ignore */
    }
    setStandalone(!!on)
  }, [])

  const value = {
    standalone,
    canInstall: !!deferred,
    promptInstall,
    setAppMode,
    isIOS: detectIOS(),
  }
  return <PWACtx.Provider value={value}>{children}</PWACtx.Provider>
}
