import { useEffect, useState } from 'react'
import { breakdown, pad2 } from '../utils/wave.js'

function useTick(active = true) {
  const [, setN] = useState(0)
  useEffect(() => {
    if (!active) return
    const i = setInterval(() => setN((n) => n + 1), 1000)
    return () => clearInterval(i)
  }, [active])
}

// Compact inline countdown for cards.
export function CountdownInline({ to, className = '' }) {
  useTick(!!to)
  if (!to) return <span className={`font-mono text-muted ${className}`}>—</span>
  const { d, h, m, s, done } = breakdown(to - Date.now())
  if (done) return <span className={`font-mono ${className}`}>00:00:00</span>
  const main = d > 0 ? `${d}d ${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  return <span className={`font-mono tnum ${className}`}>{main}</span>
}

// Big segmented countdown for the battle detail header.
export function CountdownBlocks({ to, label }) {
  useTick(!!to)
  const { d, h, m, s, done } = breakdown((to || 0) - Date.now())
  const segs = [
    { v: d, l: 'DAYS' },
    { v: h, l: 'HRS' },
    { v: m, l: 'MIN' },
    { v: s, l: 'SEC' },
  ]
  return (
    <div>
      {label ? (
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {to && !done ? label : 'CLOSED'}
        </div>
      ) : null}
      <div className="flex gap-2">
        {segs.map((seg) => (
          <div key={seg.l} className="border border-line px-3 py-2 text-center min-w-[58px]">
            <div className="font-mono text-2xl tnum leading-none">
              {to ? pad2(seg.v) : '--'}
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.18em] text-muted">{seg.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
