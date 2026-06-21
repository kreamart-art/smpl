import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconBell } from './icons.jsx'
import Portal from './Portal.jsx'
import { pushSupported, pushPermission, isPushSubscribed, enablePush } from '../lib/push.js'

// Notification opt-in popup. When a signed-in member opens the app/site with
// notifications still off (no active subscription, permission not denied), this
// pops a modal asking them to turn them on. It re-appears each session until they
// enable or block. If permission was already granted but the subscription was
// lost (e.g. the usesmpl.com move), we re-subscribe silently and never nag.
// Mounted in both Layout branches, so it works in the app AND on the website.
export default function PushPrompt() {
  const { currentUser, pushConfigured } = useApp()
  const t = useT()
  const [perm, setPerm] = useState('default')
  const [subscribed, setSubscribed] = useState(true) // assume fine until checked (no flash)
  const [ready, setReady] = useState(false) // small delay so it pops after the app settles
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('smpl_push_dismissed') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    let alive = true
    let timer
    ;(async () => {
      if (!pushSupported()) {
        if (alive) setSubscribed(true)
        return
      }
      const p = pushPermission()
      if (alive) setPerm(p)
      let sub = await isPushSubscribed()
      // self-heal: permission already granted but the subscription is gone
      // (domain move / SW reset) → quietly re-subscribe, no user gesture needed.
      if (!sub && p === 'granted' && pushConfigured) {
        const r = await enablePush()
        sub = !!r.ok
      }
      if (!alive) return
      setSubscribed(sub)
      timer = setTimeout(() => alive && setReady(true), 1200)
    })()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [pushConfigured])

  if (!pushConfigured || !currentUser || dismissed || !ready) return null
  if (!pushSupported() || perm === 'denied' || subscribed) return null

  const enable = async () => {
    setBusy(true)
    const r = await enablePush()
    setBusy(false)
    setPerm(pushPermission())
    if (r.ok) setSubscribed(true)
  }
  const dismiss = () => {
    try {
      sessionStorage.setItem('smpl_push_dismissed', '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
        onClick={dismiss}
      >
        <div className="w-full max-w-sm border border-line-bright bg-panel p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-line-bright text-ink">
              <IconBell size={18} />
            </span>
            <div className="font-sans text-lg font-bold uppercase tracking-tight">{t('push.modalTitle')}</div>
          </div>
          <p className="mt-4 font-mono text-[12px] leading-relaxed text-ink-dim">{t('push.modalBody')}</p>
          <button
            onClick={enable}
            disabled={busy}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-ink bg-ink font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright disabled:opacity-50"
          >
            <IconBell size={14} />
            {busy ? t('push.enabling') : t('push.enable')}
          </button>
          <button
            onClick={dismiss}
            className="mt-2 h-10 w-full border border-line font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
          >
            {t('push.notNow')}
          </button>
        </div>
      </div>
    </Portal>
  )
}
