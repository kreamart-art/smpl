import { kindCopy } from '../data/kind.js'

// Monochrome battle-type chip — SMPL // BEATS or SMPL // VERSES.
export default function KindBadge({ kind, size = 'md', brand = false }) {
  const c = kindCopy(kind)
  const sizes = {
    sm: 'text-[9px] px-2 py-[3px] gap-1.5',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-[11px] px-3 py-1.5 gap-2',
  }
  return (
    <span
      className={`inline-flex items-center border border-line-bright font-mono uppercase tracking-[0.2em] text-ink-dim ${sizes[size]}`}
    >
      <span aria-hidden className="text-ink">{c.glyph}</span>
      {brand ? c.brand : c.label}
    </span>
  )
}
