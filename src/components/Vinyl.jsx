// "De Plaat" — the spinning record. Rendered as inline SVG on purpose: SMPL's
// global `* { border-radius: 0 !important }` would square off a CSS circle, but
// SVG geometry ignores it. A vinyl is a physical object, so its colours are
// hardcoded (never theme-inverted) — a black disc with a cream label in both
// light and dark, matching the skill's "physical scenes" rule.
export default function Vinyl({ size = 168, spin = true, className = '' }) {
  const grooves = [86, 80, 74, 68, 62, 56, 50, 44]
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Vinyl record"
      className={`block shrink-0 ${spin ? 'record-spin' : ''} ${className}`}
    >
      <title>Vinyl record</title>
      {/* disc */}
      <circle cx="100" cy="100" r="96" fill="#0c0b0a" stroke="#322e28" strokeWidth="1" />
      {/* grooves */}
      {grooves.map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {/* a single faint sheen groove for life */}
      <circle cx="100" cy="100" r="71" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.5" />
      {/* label */}
      <circle cx="100" cy="100" r="33" fill="#e8e2d5" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      <text
        x="100" y="86" textAnchor="middle"
        fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="9" letterSpacing="2.5"
        fill="#15120d"
      >
        SMPL
      </text>
      <text
        x="100" y="120" textAnchor="middle"
        fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="5.5" letterSpacing="1.5"
        fill="#6b655c"
      >
        45 RPM
      </text>
      {/* spindle hole */}
      <circle cx="100" cy="100" r="3.4" fill="#0c0b0a" />
    </svg>
  )
}
