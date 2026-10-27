// /smpl/src/components/WinnerBadge.jsx
//
// Battle-winner badge: a small ember-red chip with a trophy + the number of
// battles won, shown next to a winner's handle. Distinct in shape from the
// (red seal) verified badge so the two read clearly side by side. Renders
// nothing for users who have not won a battle.
import { IconTrophy } from './icons.jsx'

export default function WinnerBadge({ wins = 0, size = 14, className = '', title = 'Battle winner' }) {
  if (!wins) return null
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-1 border border-accent/45 px-1.5 py-0.5 align-middle leading-none text-accent ${className}`}
    >
      <IconTrophy size={size} />
      <span className="font-mono text-[11px] font-bold tnum">{wins}</span>
    </span>
  )
}
