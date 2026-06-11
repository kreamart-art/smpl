import { useState } from 'react'
import { usePWA } from '../context/PWAContext.jsx'
import { IconDownload, IconShare } from './icons.jsx'

function isMobileBrowser() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(max-width: 820px)')?.matches ||
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
  )
}

// Shown only on the website (not standalone): "Get the SMPL app".
export default function InstallBanner() {
  const { standalone, canInstall, promptInstall, isIOS } = usePWA()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('smpl_install_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [howTo, setHowTo] = useState(false)
  const mobile = isMobileBrowser()

  // Worth showing where install is possible (native prompt) or on phones.
  if (standalone || dismissed || !(canInstall || mobile)) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem('smpl_install_dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  const onGet = async () => {
    if (canInstall) {
      const r = await promptInstall()
      if (r.ok) close()
    } else {
      setHowTo(true)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-bright bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/icon-192.png" alt="" className="h-10 w-10 border border-line-bright" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="font-sans text-sm font-bold uppercase tracking-tight">Get the SMPL app</div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Add to home screen · feed · battles · alerts
            </div>
          </div>
          <button
            onClick={onGet}
            className="flex h-10 shrink-0 items-center gap-2 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright"
          >
            <IconDownload size={15} />
            Install
          </button>
          <button
            onClick={close}
            aria-label="dismiss"
            className="flex h-10 w-9 shrink-0 items-center justify-center border border-line font-mono text-muted hover:border-line-bright hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>

      {howTo ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setHowTo(false)}
        >
          <div
            className="w-full max-w-sm border border-line-bright bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="" className="h-9 w-9 border border-line-bright" aria-hidden />
              <div className="font-sans text-lg font-bold uppercase tracking-tight">Install SMPL</div>
            </div>
            {isIOS ? (
              <ol className="mt-5 space-y-3 font-mono text-[12px] leading-relaxed text-ink-dim">
                <li className="flex items-center gap-3">
                  <IconShare size={18} className="shrink-0 text-ink" /> Tap <span className="text-ink">Share</span> in Safari
                </li>
                <li><span className="text-ink">2 ·</span> Choose “Add to Home Screen”</li>
                <li><span className="text-ink">3 ·</span> Open SMPL from your home screen — full app.</li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-3 font-mono text-[12px] leading-relaxed text-ink-dim">
                <li><span className="text-ink">1 ·</span> Open the browser menu (⋮)</li>
                <li><span className="text-ink">2 ·</span> Tap “Install app” / “Add to Home screen”</li>
                <li><span className="text-ink">3 ·</span> Open SMPL from your home screen — full app.</li>
              </ol>
            )}
            <button
              onClick={() => setHowTo(false)}
              className="mt-6 h-11 w-full border border-line-bright font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-bg"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
