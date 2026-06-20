import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconBell } from './icons.jsx'
import { pushSupported, pushPermission, isPushSubscribed, enablePush } from '../lib/push.js'

// Nudge to enable browser notifications. Shows whenever push is configured, the
// user is signed in, the browser supports it, permission isn't denied, and there
// is NO active subscription yet — so it reappears when a subscription was lost
// (e.g. the move to usesmpl.com invalidated the old origin-bound one). If
// permission was already granted we re-subscribe silently and never nag.
// Mounted in both Layout branches, so it works in the app AND on the website.
export default function PushPrompt() {
  const { currentUser, pushConfigured } = useApp()
  const t = useT()
  const [perm, setPerm] = useState('default')
  const [subscribed, setSubscribed] = useState(true) // assume fine until checked (no flash)
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
      if (alive) setSubscribed(sub)
    })()
    return () => {
      alive = false
    }
  }, [pushConfigured])

  if (!pushConfigured || !currentUser || dismissed) return null
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
    <div className="border-b border-line-bright bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="flex items-center gap-2 font-mono text-[11px] text-ink">
          <IconBell size={14} />
          {t('push.prompt')}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={enable}
            disabled={busy}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline underline-offset-4 hover:text-bright disabled:opacity-50"
          >
            {busy ? t('push.enabling') : t('push.enable')}
          </button>
          <button onClick={dismiss} aria-label="dismiss" className="font-mono text-[12px] text-muted hover:text-ink">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
