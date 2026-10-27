import { useMemo, useRef } from 'react'
import { genBars } from '../utils/wave.js'

// The recurring visual element. Bars left of the playhead read as "played".
// `animated` gives live tracks a very subtle breathing motion.
export default function Waveform({
  seed,
  progress = 0,
  bars = 72,
  onSeek,
  className = '',
  height = 48,
  playedClass = 'bg-ink',
  baseClass = 'bg-line-bright',
  animated = false,
}) {
  const heights = useMemo(() => genBars(seed, bars), [seed, bars])
  const ref = useRef(null)

  const handle = (e) => {
    if (!onSeek || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX ?? rect.left) - rect.left
    onSeek(Math.max(0, Math.min(1, x / rect.width)))
  }

  return (
    <div
      ref={ref}
      onClick={handle}
      className={`relative flex items-center gap-[2px] ${onSeek ? 'cursor-pointer' : ''} ${className}`}
      style={{ height }}
      role={onSeek ? 'slider' : 'img'}
      aria-label="waveform"
    >
      {heights.map((h, i) => {
        const played = i / bars <= progress
        return (
          <div
            key={i}
            className={`flex-1 ${played ? playedClass : baseClass} transition-[height,background-color] duration-300 ${
              animated ? 'wave-bar' : ''
            }`}
            style={{
              height: `${Math.round(h * 100)}%`,
              minWidth: 1,
              animationDelay: animated ? `${(i % 26) * 0.04}s` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
