import { STATUS } from '../data/status.js'
import { useT } from '../i18n/index.jsx'

// Status chip. Mostly mono (fill / border) — the one colour is the accent live
// dot for the voting (LIVE) phase, a deliberate live signal.
export default function StatusBadge({ status, size = 'md' }) {
  const t = useT()
  const label = t(`status.${status}`)
  const live = status === STATUS.VOTING_PHASE
  const inverted = status === STATUS.WINNER_DECLARED
  const sizes = {
    sm: 'text-[9px] px-2.5 py-[4px] gap-1.5',
    md: 'text-[10px] px-3 py-1.5 gap-2',
    lg: 'text-[11px] px-3.5 py-2 gap-2',
  }
  const base =
    'inline-flex items-center font-mono uppercase tracking-[0.2em] border whitespace-nowrap'
  const skin = inverted
    ? 'bg-ink text-bg border-ink'
    : live
      ? 'bg-transparent text-ink border-line-bright'
      : 'bg-transparent text-ink-dim border-line'

  return (
    <span className={`${base} ${sizes[size]} ${skin}`}>
      {live ? <span className="block h-1.5 w-1.5 bg-accent pulse-dot" /> : null}
      {inverted ? <span className="font-bold">★</span> : null}
      {label}
    </span>
  )
}
