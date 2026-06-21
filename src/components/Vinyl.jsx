import { useId } from 'react'

// "De Plaat" — a skeuomorphic spinning record. A vinyl is a physical object, so
// it uses radial gradients, dense grooves and a static specular sheen (a
// sanctioned exception to the flat/no-gradient rule, like the ambient blooms).
// A soft warm halo sits BEHIND the disc so the near-black record reads against
// SMPL's near-black panels (it was nearly invisible before). The disc spins; the
// halo and the light reflection stay put, like a record turning under a lamp.
export default function Vinyl({ size = 168, spin = true, className = '' }) {
  const uid = useId().replace(/[:]/g, '')
  const disc = `d${uid}`
  const lab = `l${uid}`
  const sheen = `s${uid}`
  const grooves = []
  for (let r = 92; r >= 38; r -= 2.3) grooves.push(r)

  return (
    <div
      className={`relative block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Vinyl record"
    >
      {/* halo — accent-red glow so the dark disc pops off a dark panel */}
      <div
        className="pointer-events-none absolute inset-[-26%]"
        style={{ background: 'radial-gradient(circle, rgba(229,52,31,0.40), rgba(229,52,31,0.12) 45%, rgba(229,52,31,0) 68%)' }}
        aria-hidden="true"
      />

      {/* the spinning disc */}
      <svg viewBox="0 0 200 200" width={size} height={size} className={`relative block ${spin ? 'record-spin' : ''}`} aria-hidden="true">
        <defs>
          <radialGradient id={disc} cx="38%" cy="33%" r="80%">
            <stop offset="0%" stopColor="#2c2823" />
            <stop offset="34%" stopColor="#161310" />
            <stop offset="100%" stopColor="#050403" />
          </radialGradient>
          <radialGradient id={lab} cx="40%" cy="35%" r="72%">
            <stop offset="0%" stopColor="#f4efe4" />
            <stop offset="100%" stopColor="#d6cdba" />
          </radialGradient>
        </defs>
        {/* disc with depth */}
        <circle cx="100" cy="100" r="97" fill={`url(#${disc})`} stroke="#000" strokeWidth="1" />
        {/* edge bevel catching light */}
        <circle cx="100" cy="100" r="96" fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="0.6" />
        {/* fine grooves */}
        {grooves.map((r, i) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={i % 2 ? 0.035 : 0.075}
            strokeWidth="0.5"
          />
        ))}
        {/* a couple of brighter rings for sheen */}
        <circle cx="100" cy="100" r="74" fill="none" stroke="#ffffff" strokeOpacity="0.17" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#ffffff" strokeOpacity="0.13" strokeWidth="0.5" />
        {/* label */}
        <circle cx="100" cy="100" r="33" fill={`url(#${lab})`} stroke="rgba(0,0,0,0.42)" strokeWidth="1" />
        <circle cx="100" cy="100" r="33" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
        <text
          x="100"
          y="86"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          fontSize="9"
          letterSpacing="2.5"
          fill="#15120d"
        >
          SMPL
        </text>
        <text
          x="100"
          y="120"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          fontSize="5.5"
          letterSpacing="1.5"
          fill="#6b655c"
        >
          45 RPM
        </text>
        {/* spindle hole with depth */}
        <circle cx="100" cy="100" r="3.6" fill="#050403" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="3.6" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.4" />
      </svg>

      {/* static specular reflection — a light streak that doesn't spin */}
      <svg viewBox="0 0 200 200" width={size} height={size} className="pointer-events-none absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id={sheen} x1="0.1" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="26%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="78%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="97" fill={`url(#${sheen})`} />
      </svg>
    </div>
  )
}
