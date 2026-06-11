import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Handle from '../components/Handle.jsx'
import KindBadge from '../components/KindBadge.jsx'

function ago(ts) {
  const d = Date.now() - ts
  if (d < 0) return 'soon'
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function FeedRow({ it, getUser }) {
  const navigate = useNavigate()
  const alias = it.userId ? getUser(it.userId)?.alias : null
  const stop = (e) => e.stopPropagation()
  // wrap @handle so its link doesn't nest inside the row's click target
  const H = alias ? (
    <span onClick={stop}>
      <Handle alias={alias} className="text-ink" />
    </span>
  ) : null
  let body
  if (it.type === 'winner')
    body = (
      <>
        {H} won <span className="text-ink">{it.title}</span>{' '}
        <span className="text-faint">· {it.votes} votes</span>
      </>
    )
  else if (it.type === 'placement')
    body = (
      <>
        {H} placed #{it.position} in <span className="text-ink">{it.title}</span>
      </>
    )
  else if (it.type === 'voting')
    body = (
      <>
        <span className="text-ink">{it.title}</span> is open for voting — judge it blind
      </>
    )
  else if (it.type === 'signup')
    body = (
      <>
        <span className="text-ink">{it.title}</span> opened for signup
      </>
    )
  else if (it.type === 'submission')
    body = (
      <>
        <span className="text-ink">{it.title}</span> — submissions are open
      </>
    )
  else
    body = (
      <>
        New battle announced — <span className="text-ink">{it.title}</span>
      </>
    )

  return (
    <div
      onClick={() => navigate(`/battles/${it.battleId}`)}
      className="group flex cursor-pointer items-start justify-between gap-4 border-b border-line px-5 py-5 transition-colors hover:bg-panel"
    >
      <div className="flex items-start gap-4">
        <KindBadge kind={it.kind} size="sm" />
        <div className="font-mono text-[13px] leading-relaxed text-ink-dim">{body}</div>
      </div>
      <div className="shrink-0 pt-0.5 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {ago(it.ts)}
        <div className="mt-1 text-muted transition-colors group-hover:text-ink">open ▸</div>
      </div>
    </div>
  )
}

export default function Feed() {
  const { currentUser, fetchFeed, getUser } = useApp()
  const [items, setItems] = useState(null)
  const [tab, setTab] = useState(currentUser ? 'following' : 'all')

  useEffect(() => {
    let alive = true
    fetchFeed().then((r) => {
      if (alive && r.ok) setItems(r.feed || [])
    })
    return () => {
      alive = false
    }
  }, [fetchFeed])

  const shown = useMemo(() => {
    if (!items) return []
    const f = items.filter((i) => !(i.type === 'placement' && i.position === 1))
    return tab === 'following' ? f.filter((i) => i.personal) : f
  }, [items, tab])

  return (
    <div className="mx-auto max-w-[820px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono text-[13px] text-faint tnum">F0</span>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">The wire</div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
              Feed
            </h1>
          </div>
        </div>
        <div className="flex items-stretch border border-line">
          {['following', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === t ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 border border-line bg-bg">
        {items === null ? (
          <div className="px-5 py-10 text-center font-mono text-[12px] text-muted">Loading…</div>
        ) : shown.length ? (
          shown.map((it) => <FeedRow key={it.id} it={it} getUser={getUser} />)
        ) : (
          <div className="px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
            {tab === 'following' ? (
              <>
                Quiet here. Follow makers on{' '}
                <Link to="/people" className="text-ink underline underline-offset-4">
                  People
                </Link>{' '}
                to fill your wire.
              </>
            ) : (
              'No activity yet.'
            )}
          </div>
        )}
      </div>
    </div>
  )
}
