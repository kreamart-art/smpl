import { useMemo } from 'react'
import { rng } from '../utils/wave.js'

// Fixed full-screen film grain. Pointer-events none, sits above content but
// below the nav/transport so UI stays crisp.
export function Grain() {
  return <div className="grain" aria-hidden="true" />
}

// Soft cinematic vignette framing the whole viewport.
export function Vignette() {
  return <div className="vignette" aria-hidden="true" />
}

// Extremely sparse drifting dust — used only inside the hero for atmosphere.
export function DustField({ count = 18, seed = 'dust' }) {
  const parts = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, () => ({
      left: r() * 100,
      delay: r() * 16,
      dur: 12 + r() * 16,
      size: 1 + Math.round(r() * 1.4),
      o: 0.12 + r() * 0.28,
      dx: Math.round((r() * 2 - 1) * 36),
    }))
  }, [count, seed])

  return (
    <div className="dust" aria-hidden="true">
      {parts.map((p, i) => (
        <span
          key={i}
          className="dust-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--o': p.o,
            '--dx': `${p.dx}px`,
          }}
        />
      ))}
    </div>
  )
}
