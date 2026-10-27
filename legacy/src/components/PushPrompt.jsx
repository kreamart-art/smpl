import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconBell } from './icons.jsx'
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

  // A slim bottom bar, same shape as the "Get the SMPL app" install banner — so
  // it sits in the app/site itself rather than interrupting as a modal. The
  // install banner already yields to this via its topBannerShowing() check.
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-bright bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink">
          <IconBell size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-sm font-bold uppercase tracking-tight">{t('push.modalTitle')}</div>
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('push.bannerSub')}</div>
        </div>
        <button
          onClick={enable}
          disabled={busy}
          className="flex h-10 shrink-0 items-center gap-2 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright disabled:opacity-50"
        >
          <IconBell size={14} />
          {busy ? t('push.enabling') : t('push.enable')}
        </button>
        <button
          onClick={dismiss}
          aria-label={t('push.notNow')}
          className="flex h-10 w-9 shrink-0 items-center justify-center border border-line font-mono text-muted hover:border-line-bright hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
