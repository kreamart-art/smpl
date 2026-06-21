import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'

// Season leaderboard for the prediction game, ranked by points (correct calls).
// Computed from the caller stats already on every user. Highlights your row.
export default function TopCallers({ limit = 5, className = '' }) {
  const { users, currentUser } = useApp()
  const t = useT()
  const ranked = useMemo(
    () =>
      users
        .filter((u) => (u.caller?.calls || 0) > 0 && u.alias !== 'SMPL' && u.role !== 'admin')
        .sort((a, b) => b.caller.points - a.caller.points || b.caller.correct - a.caller.correct)
        .slice(0, limit),
    [users, limit],
  )
  if (!ranked.length) return null

  return (
    <section className={className}>
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="font-sans text-lg font-bold uppercase tracking-tight">{t('callers.title')}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('callers.sub')}</span>
      </div>
      <div className="mt-2">
        {ranked.map((u, i) => {
          const c = u.caller
          const hit = Math.round((c.correct / c.calls) * 100)
          const me = currentUser?.id === u.id
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 border-b border-line py-2.5 font-mono text-[12px] last:border-b-0"
            >
              <span className={`w-6 font-sans text-sm font-bold ${i === 0 ? 'text-accent' : 'text-muted'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <Link
                to={`/profile/${encodeURIComponent(u.alias)}`}
                className="flex-1 truncate uppercase tracking-[0.1em] text-ink hover:underline"
              >
                @{u.alias}
                {me ? <span className="text-faint"> · {t('callers.you')}</span> : null}
              </Link>
              <span className="text-faint">{hit}%</span>
              <span className="w-12 text-right font-sans text-sm font-bold text-ink tnum">{c.points}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
