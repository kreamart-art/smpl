import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Handle from '../components/Handle.jsx'
import KindBadge from '../components/KindBadge.jsx'
import GameTeaser from '../components/GameTeaser.jsx'

function ago(ts, t) {
  const d = Date.now() - ts
  if (d < 0) return t('social.time.soon')
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return t('social.time.justNow')
}

// Render an activity phrase, substituting {handle}/{title} slots with JSX nodes
// (so the @handle link + the styled title keep their markup) and plain {vars}
// (position) inline. Splits the translated string on each placeholder in turn.
function phrase(t, key, vars, nodes) {
  let segs = [t(key, vars)]
  for (const name in nodes) {
    const tok = `{${name}}`
    const next = []
    for (const s of segs) {
      if (typeof s !== 'string') {
        next.push(s)
        continue
      }
      const bits = s.split(tok)
      bits.forEach((b, i) => {
        if (b) next.push(b)
        if (i < bits.length - 1) next.push(nodes[name])
      })
    }
    segs = next
  }
  return segs.map((s, i) => <span key={i}>{s}</span>)
}

function FeedRow({ it, getUser }) {
  const t = useT()
  const navigate = useNavigate()
  const alias = it.userId ? getUser(it.userId)?.alias : null
  const stop = (e) => e.stopPropagation()
  // wrap @handle so its link doesn't nest inside the row's click target
  const H = alias ? (
    <span onClick={stop}>
      <Handle alias={alias} className="text-ink" />
    </span>
  ) : null
  const TITLE = <span className="text-ink">{it.title}</span>
  let body
  if (it.type === 'winner')
    body = (
      <>
        {phrase(t, 'social.act.winner', { position: it.position }, { handle: H, title: TITLE })}{' '}
        <span className="text-faint">{t('social.act.votesSuffix', { votes: it.votes })}</span>
      </>
    )
  else if (it.type === 'placement')
    body = phrase(t, 'social.act.placement', { position: it.position }, { handle: H, title: TITLE })
  else if (it.type === 'voting') body = phrase(t, 'social.act.votingBlind', {}, { title: TITLE })
  else if (it.type === 'signup') body = phrase(t, 'social.act.signup', {}, { title: TITLE })
  else if (it.type === 'submission') body = phrase(t, 'social.act.submissionLong', {}, { title: TITLE })
  else body = phrase(t, 'social.act.announcedLong', {}, { title: TITLE })

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
        {ago(it.ts, t)}
        <div className="mt-1 text-muted transition-colors group-hover:text-ink">{t('social.row.open')}</div>
      </div>
    </div>
  )
}

export default function Feed() {
  const t = useT()
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

  // pull-to-refresh (app shell) re-fetches the feed
  useEffect(() => {
    const reload = () => fetchFeed().then((r) => r.ok && setItems(r.feed || []))
    window.addEventListener('smpl:refresh', reload)
    return () => window.removeEventListener('smpl:refresh', reload)
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
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('social.feed.eyebrow')}</div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
              {t('common.feed')}
            </h1>
          </div>
        </div>
        <div className="flex items-stretch border border-line">
          {['following', 'all'].map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === tabKey ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {tabKey === 'following' ? t('social.feed.tabFollowing') : t('social.feed.tabAll')}
            </button>
          ))}
        </div>
      </div>

      <GameTeaser className="mt-6" />

      <div className="mt-4 border border-line bg-bg">
        {items === null ? (
          <div className="px-5 py-10 text-center font-mono text-[12px] text-muted">{t('common.loading')}</div>
        ) : shown.length ? (
          shown.map((it) => <FeedRow key={it.id} it={it} getUser={getUser} />)
        ) : (
          <div className="px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
            {tab === 'following' ? (
              <>
                {t('social.feed.emptyFollowingPre')}{' '}
                <Link to="/people" className="text-ink underline underline-offset-4">
                  {t('common.people')}
                </Link>{' '}
                {t('social.feed.emptyFollowingPost')}
              </>
            ) : (
              t('social.feed.emptyAll')
            )}
          </div>
        )}
      </div>
    </div>
  )
}
