import { STATUS, STATUS_LABEL } from '../data/status.js'

// Monochrome status chip. Differentiation is by fill / border / a live dot —
// never by colour, to keep the identity strictly black & off-white.
export default function StatusBadge({ status, size = 'md' }) {
  const label = STATUS_LABEL[status] || status
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
      {live ? <span className="block h-1.5 w-1.5 bg-ink pulse-dot" /> : null}
      {inverted ? <span className="font-bold">★</span> : null}
      {label}
    </span>
  )
}
