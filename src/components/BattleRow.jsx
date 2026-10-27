import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS, countdownTarget } from '../data/status.js'
import { CountdownInline } from './Countdown.jsx'
import { Cover } from './crate.jsx'
import { IconChevronRight } from './icons.jsx'

export const kindKey = (kind) => `kind.long.${kind === 'VERSES' ? 'VERSES' : 'BEATS'}`

// What deserves the front: live voting, then open entries, then signups, then
// announcements; within a phase the sooner real (scheduled) deadline first.
const PRIORITY = {
  [STATUS.VOTING_PHASE]: 0,
  [STATUS.SUBMISSION_PHASE]: 1,
  [STATUS.OPEN_FOR_SIGNUP]: 2,
  [STATUS.ANNOUNCED]: 3,
}
export function rankBattles(battles) {
  return battles
    .filter((b) => b.status in PRIORITY)
    .sort((a, b) => {
      const p = PRIORITY[a.status] - PRIORITY[b.status]
      if (p) return p
      return (countdownTarget(a).ts ?? Infinity) - (countdownTarget(b).ts ?? Infinity)
    })
}

// The honest "when": a real countdown for scheduled battles, "curator's call"
// for manual ones, the phase otherwise.
export function When({ battle, className = '' }) {
  const t = useT()
  const { ts, manual } = countdownTarget(battle)
  if (manual) return <span className={`text-muted ${className}`}>{t('battles.card.cd.manualValue')}</span>
  if (!ts) return <span className={`text-muted ${className}`}>{t(`status.${battle.status}`)}</span>
  return <CountdownInline to={ts} className={`text-accent ${className}`} />
}

// Public, real numbers only: slots while signing up, entries after, the winner at the end.
function RowCount({ battle }) {
  const t = useT()
  const { battleSubmissions, getUser } = useApp()
  if (battle.status === STATUS.WINNER_DECLARED) {
    const win = battle.winnerSubmissionId
      ? battleSubmissions(battle.id).find((s) => s.id === battle.winnerSubmissionId)
      : null
    const alias = win ? getUser(win.producerId)?.alias : null
    return alias ? <span className="truncate text-ink-dim">@{alias}</span> : null
  }
  if (battle.status === STATUS.ANNOUNCED || battle.status === STATUS.OPEN_FOR_SIGNUP) {
    return (
      <span className="tnum text-ink-dim">
        {battle.signups.length}/{battle.maxProducers}
      </span>
    )
  }
  const n = battleSubmissions(battle.id).length
  return n ? <span className="tnum text-ink-dim">{t('home.entries', { n })}</span> : null
}

export function BattleRow({ battle, showCount = true }) {
  const t = useT()
  const kindLabel = t(kindKey(battle.kind))
  return (
    <Link
      to={`/battles/${battle.id}`}
      className="group flex items-center gap-4 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-panel"
    >
      <Cover src={battle.cover} title={battle.title} id={battle.id} kind={battle.kind} label={kindLabel} titleSize="xs" className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[16px] font-medium text-ink">{battle.title}</div>
        <div className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {kindLabel}
          {battle.genre ? ` · ${battle.genre}` : ''}
        </div>
        <div className="mt-1 font-mono text-[11px]">
          <When battle={battle} />
        </div>
      </div>
      {showCount ? (
        <div className="max-w-[30%] shrink-0 text-right font-mono text-[11px]">
          <RowCount battle={battle} />
        </div>
      ) : null}
      <IconChevronRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
    </Link>
  )
}
