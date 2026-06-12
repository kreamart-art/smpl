import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconBell } from './icons.jsx'
import { pushSupported, pushPermission, enablePush } from '../lib/push.js'

// One-time nudge to enable browser notifications. Only appears once push is
// configured (VAPID set), the user is signed in, the browser supports it, and
// permission hasn't been decided yet. Dismiss lasts the session.
export default function PushPrompt() {
  const { currentUser, pushConfigured } = useApp()
  const t = useT()
  const [perm, setPerm] = useState('default')
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('smpl_push_dismissed') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    setPerm(pushPermission())
  }, [])

  if (!pushConfigured || !currentUser || dismissed) return null
  if (!pushSupported() || perm !== 'default') return null

  const enable = async () => {
    setBusy(true)
    await enablePush()
    setBusy(false)
    setPerm(pushPermission()) // hides the bar once the native prompt is answered
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
