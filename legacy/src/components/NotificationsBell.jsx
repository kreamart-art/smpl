import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Handle from './Handle.jsx'

function ago(ts, t) {
  const d = Date.now() - ts
  if (d < 0) return t('nbell.soon')
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return t('nbell.now')
}

function Bell() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function line(it, getUser, t) {
  const alias = it.userId ? getUser(it.userId)?.alias : null
  if (it.type === 'winner') return { lead: alias, rest: t('nbell.won', { title: it.title }) }
  if (it.type === 'placement')
    return { lead: alias, rest: t('nbell.placed', { position: it.position, title: it.title }) }
  if (it.type === 'voting') return { rest: t('nbell.voting', { title: it.title }) }
  if (it.type === 'signup') return { rest: t('nbell.signup', { title: it.title }) }
  if (it.type === 'submission') return { rest: t('nbell.submission', { title: it.title }) }
  return { rest: t('nbell.announced', { title: it.title }) }
}

export default function NotificationsBell() {
  const { currentUser, unread, fetchNotifications, markNotificationsSeen, getUser } = useApp()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!currentUser) return null

  const toggle = async () => {
    const opening = !open
    setOpen(opening)
    if (opening) {
      const r = await fetchNotifications()
      if (r.ok) setItems((r.notifications || []).filter((i) => !(i.type === 'placement' && i.position === 1)))
      markNotificationsSeen()
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="notifications"
        className="relative flex h-9 w-9 items-center justify-center border border-line text-muted transition-colors hover:border-line-bright hover:text-ink"
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 min-w-[16px] border border-bg bg-ink px-1 text-center font-mono text-[9px] leading-[14px] text-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 border border-line-bright bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{t('nbell.title')}</span>
            <Link
              to="/feed"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:underline"
            >
              {t('common.feed')} ▸
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length ? (
              items.map((it) => {
                const ln = line(it, getUser, t)
                return (
                  <div key={it.id} className="border-b border-line px-3 py-2.5 font-mono text-[11px] leading-relaxed">
                    <div className="text-ink-dim">
                      {ln.lead ? <Handle alias={ln.lead} className="text-ink" /> : null}
                      {ln.rest}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <Link
                        to={`/battles/${it.battleId}`}
                        onClick={() => setOpen(false)}
                        className="uppercase tracking-[0.14em] text-muted hover:text-ink"
                      >
                        {it.kind === 'VERSES' ? 'verses' : 'beats'} ▸
                      </Link>
                      <span className="text-faint">{ago(it.ts, t)}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-3 py-6 text-center font-mono text-[11px] text-muted">
                {t('nbell.empty')}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
