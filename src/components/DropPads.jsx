// /smpl/src/components/DropPads.jsx
//
// "Drop" — a skeuomorphic 4x4 beat-pad grid (MPC/Maschine style) for the daily
// DROP game in the hub. A playhead glow rolls across the columns like a
// sequencer running. A warm accent halo sits behind so the near-black pads read
// off SMPL's near-black panels (like the Vinyl). The pad chassis uses gradients
// + inset shadows — a sanctioned exception to the flat rule, same as the Vinyl
// and the VU meter.
const PATTERN = new Set([0, 5, 6, 8, 11, 13]) // lit pads for the static (reduced-motion) state

export default function DropPads({ size = 64, className = '' }) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Beat pads"
    >
      <div
        className="pointer-events-none absolute inset-[-22%]"
        style={{
          background:
            'radial-gradient(circle, rgba(229,52,31,0.34), rgba(229,52,31,0.10) 46%, rgba(229,52,31,0) 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative grid h-full w-full grid-cols-4" style={{ gap: Math.round(size * 0.09) }} aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`drop-pad${PATTERN.has(i) ? ' on' : ''}`}
            style={{ animationDelay: `${(i % 4) * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
