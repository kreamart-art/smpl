import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'

// A transient banner near the top — currently fired when a new follower arrives
// (the AppContext poll detects it). Auto-dismisses; tap to open their profile.
export default function Toast() {
  const { toast, dismissToast } = useApp()
  const t = useT()

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(dismissToast, 4500)
    return () => clearTimeout(id)
  }, [toast, dismissToast])

  if (!toast) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
      style={{ top: 'calc(env(safe-area-inset-top) + 60px)' }}
    >
      <Link
        to={`/profile/${encodeURIComponent(toast.alias)}`}
        onClick={dismissToast}
        className="toast-in pointer-events-auto flex max-w-[440px] items-center gap-3 border border-line-bright bg-panel px-4 py-2.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)]"
      >
        <Avatar alias={toast.alias} src={toast.avatar} size={32} />
        <span className="font-mono text-[12px] text-ink">{t('notif.newFollower', { alias: `@${toast.alias}` })}</span>
      </Link>
    </div>
  )
}
