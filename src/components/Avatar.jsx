import { hashStr } from '../utils/wave.js'

// Square avatar: an uploaded photo if present, else a monogram block.
export default function Avatar({ alias, src, size = 48, className = '' }) {
  const a = String(alias || '?')
  const initials = a.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={a}
        className={`shrink-0 border border-line-bright object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const tone = hashStr(a) % 3
  const bg = tone === 0 ? 'bg-ink text-bg' : tone === 1 ? 'bg-panel-2 text-ink' : 'bg-black text-ink'
  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-line-bright font-mono font-bold tracking-tight ${bg} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden
    >
      {initials}
    </div>
  )
}
