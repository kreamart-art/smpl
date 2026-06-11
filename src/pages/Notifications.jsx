import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Handle from '../components/Handle.jsx'
import KindBadge from '../components/KindBadge.jsx'
import { Btn } from '../components/ui.jsx'

function ago(ts) {
  const d = Date.now() - ts
  if (d < 0) return 'soon'
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return 'now'
}

function Row({ it, getUser }) {
  const navigate = useNavigate()
  const alias = it.userId ? getUser(it.userId)?.alias : null
  const stop = (e) => e.stopPropagation()
  const H = alias ? (
    <span onClick={stop}>
      <Handle alias={alias} className="text-ink" />
    </span>
  ) : null
  let body
  if (it.type === 'winner') body = <>{H} won <span className="text-ink">{it.title}</span></>
  else if (it.type === 'placement') body = <>{H} placed #{it.position} in <span className="text-ink">{it.title}</span></>
  else if (it.type === 'voting') body = <><span className="text-ink">{it.title}</span> is open for voting</>
  else if (it.type === 'signup') body = <><span className="text-ink">{it.title}</span> opened for signup</>
  else if (it.type === 'submission') body = <><span className="text-ink">{it.title}</span> — submissions open</>
  else body = <>New battle — <span className="text-ink">{it.title}</span></>

  return (
    <div
      onClick={() => navigate(`/battles/${it.battleId}`)}
      className="flex cursor-pointer items-start justify-between gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-panel sm:px-5"
    >
      <div className="flex items-start gap-3">
        <KindBadge kind={it.kind} size="sm" />
        <div className="font-mono text-[12px] leading-relaxed text-ink-dim">{body}</div>
      </div>
      <span className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {ago(it.ts)}
      </span>
    </div>
  )
}

export default function Notifications() {
  const { currentUser, fetchNotifications, markNotificationsSeen, getUser } = useApp()
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (!currentUser) return
    let alive = true
    fetchNotifications().then((r) => {
      if (alive && r.ok) setItems((r.notifications || []).filter((i) => !(i.type === 'placement' && i.position === 1)))
    })
    markNotificationsSeen()
    return () => {
      alive = false
    }
  }, [currentUser, fetchNotifications, markNotificationsSeen])

  return (
    <div className="mx-auto max-w-[680px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-baseline gap-4 border-b border-line pb-5 sm:gap-6">
        <span className="font-mono text-[13px] text-faint tnum">N0</span>
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">Your wire</div>
          <h1 className="font-sans text-[clamp(2rem,7vw,3.2rem)] font-bold uppercase leading-none tracking-tighter">
            Alerts
          </h1>
        </div>
      </div>

      {!currentUser ? (
        <div className="mt-10 border border-line bg-panel px-5 py-10 text-center">
          <p className="font-mono text-[12px] leading-relaxed text-muted">
            Log in to see alerts from battles and the makers you follow.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Btn to="/login" variant="solid">Login</Btn>
            <Btn to="/signup" variant="ghost">Sign up</Btn>
          </div>
        </div>
      ) : (
        <div className="mt-6 border border-line bg-bg">
          {items === null ? (
            <div className="px-5 py-10 text-center font-mono text-[12px] text-muted">Loading…</div>
          ) : items.length ? (
            items.map((it) => <Row key={it.id} it={it} getUser={getUser} />)
          ) : (
            <div className="px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
              Quiet. Follow makers on{' '}
              <Link to="/people" className="text-ink underline underline-offset-4">People</Link>{' '}
              to fill your alerts.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
