import { Link } from 'react-router-dom'

// @handle that links to a profile.
export default function Handle({ alias, at = true, className = '' }) {
  if (!alias) return null
  return (
    <Link
      to={`/profile/${encodeURIComponent(alias)}`}
      className={`underline-offset-4 transition-colors hover:text-ink hover:underline ${className}`}
    >
      {at ? '@' : ''}
      {alias}
    </Link>
  )
}

// Linkify @mentions inside free text (bios etc.).
export function Mentions({ text, className = '' }) {
  if (!text) return null
  const parts = String(text).split(/(@[A-Za-z0-9_.]+)/g)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p[0] === '@' ? (
          <Handle key={i} alias={p.slice(1)} className="text-ink" />
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}
