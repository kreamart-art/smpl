import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useI18n } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'

// The Guess-the-Sample LEAGUE: an all-time progression board. Players rank by
// levels cleared, then total points (sum of best scores), then who got there
// first. `refreshKey` re-fetches when it changes (e.g. after a level clears).
export default function LeagueBoard({ refreshKey = 0, limit = 20 }) {
  const { t } = useI18n()
  const [board, setBoard] = useState(null)

  const load = useCallback(async () => {
    const r = await api.get('/api/game/league')
    if (r.ok) setBoard(r)
  }, [])
  useEffect(() => {
    load()
  }, [load, refreshKey])

  if (!board) return null
  const { top = [], me, total = 0 } = board
  const rows = top.slice(0, limit)

  return (
    <div>
      <div className="flex items-end justify-between border-b border-line pb-3">
        <div>
          <h2 className="font-sans text-lg font-bold uppercase tracking-wide">{t('league.title')}</h2>
          <div className="mt-1 font-mono text-[11px] text-muted">{t('league.sub')}</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint tnum">{total}</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 border border-line bg-panel px-5 py-8 text-center font-mono text-[12px] text-muted">
          {t('league.empty')}
        </div>
      ) : (
        <div className="mt-4 border border-line bg-panel">
          <div className="grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem] gap-2 border-b border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            <span>{t('league.rankCol')}</span>
            <span>{t('league.player')}</span>
            <span className="text-right">{t('league.levelsCol')}</span>
            <span className="text-right">{t('league.pointsCol')}</span>
          </div>
          {rows.map((row) => {
            const mine = me && me.alias && row.alias === me.alias
            return (
              <div
                key={row.alias}
                className={`grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem] items-center gap-2 border-b border-line px-4 py-2.5 last:border-b-0 ${
                  mine ? 'bg-accent/10' : ''
                }`}
              >
                <span className={`font-mono text-[13px] tnum ${row.rank <= 3 ? 'text-accent' : 'text-muted'}`}>
                  {String(row.rank).padStart(2, '0')}
                </span>
                <Link to={`/profile/${encodeURIComponent(row.alias)}`} className="flex items-center gap-2.5 overflow-hidden">
                  <Avatar alias={row.alias} src={row.avatar} size={26} />
                  <span className="truncate font-mono text-[12px] text-ink">@{row.alias}</span>
                  {row.verified ? <VerifiedBadge size={12} /> : null}
                  {mine ? (
                    <span className="shrink-0 border border-accent px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-accent">
                      {t('league.you')}
                    </span>
                  ) : null}
                </Link>
                <span className="text-right font-mono text-[13px] text-ink tnum">{row.levels}</span>
                <span className="text-right font-mono text-[12px] text-muted tnum">{row.points}</span>
              </div>
            )
          })}
        </div>
      )}

      {me ? (
        <div className="mt-3 flex items-center justify-between border border-line-bright bg-bg px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('league.yourStanding')}</div>
          <div className="flex items-center gap-4 font-mono text-[12px]">
            <span className="text-accent tnum">#{me.rank}</span>
            <span className="text-faint">{t('league.outOf', { n: total })}</span>
            <span className="text-ink tnum">
              {me.levels} {t('league.levelsWord')}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
