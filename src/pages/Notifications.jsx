import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Handle from '../components/Handle.jsx'
import KindBadge from '../components/KindBadge.jsx'
import { Btn } from '../components/ui.jsx'

function ago(ts, t) {
  const d = Date.now() - ts
  if (d < 0) return t('social.time.soon')
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return t('social.time.now')
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

function Row({ it, getUser }) {
  const t = useT()
  const navigate = useNavigate()
  const alias = it.userId ? getUser(it.userId)?.alias : null
  const stop = (e) => e.stopPropagation()
  const H = alias ? (
    <span onClick={stop}>
      <Handle alias={alias} className="text-ink" />
    </span>
  ) : null
  const TITLE = <span className="text-ink">{it.title}</span>
  let body
  if (it.type === 'winner') body = phrase(t, 'social.act.winner', {}, { handle: H, title: TITLE })
  else if (it.type === 'placement') body = phrase(t, 'social.act.placement', { position: it.position }, { handle: H, title: TITLE })
  else if (it.type === 'voting') body = phrase(t, 'social.act.voting', {}, { title: TITLE })
  else if (it.type === 'signup') body = phrase(t, 'social.act.signup', {}, { title: TITLE })
  else if (it.type === 'submission') body = phrase(t, 'social.act.submission', {}, { title: TITLE })
  else body = phrase(t, 'social.act.announced', {}, { title: TITLE })

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
        {ago(it.ts, t)}
      </span>
    </div>
  )
}

export default function Notifications() {
  const t = useT()
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
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('social.alerts.eyebrow')}</div>
          <h1 className="font-sans text-[clamp(2rem,7vw,3.2rem)] font-bold uppercase leading-none tracking-tighter">
            {t('common.alerts')}
          </h1>
        </div>
      </div>

      {!currentUser ? (
        <div className="mt-10 border border-line bg-panel px-5 py-10 text-center">
          <p className="font-mono text-[12px] leading-relaxed text-muted">
            {t('social.alerts.loggedOut')}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Btn to="/login" variant="solid">{t('common.login')}</Btn>
            <Btn to="/signup" variant="ghost">{t('common.signup')}</Btn>
          </div>
        </div>
      ) : (
        <div className="mt-6 border border-line bg-bg">
          {items === null ? (
            <div className="px-5 py-10 text-center font-mono text-[12px] text-muted">{t('common.loading')}</div>
          ) : items.length ? (
            items.map((it) => <Row key={it.id} it={it} getUser={getUser} />)
          ) : (
            <div className="px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
              {t('social.alerts.emptyPre')}{' '}
              <Link to="/people" className="text-ink underline underline-offset-4">{t('common.people')}</Link>{' '}
              {t('social.alerts.emptyPost')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
