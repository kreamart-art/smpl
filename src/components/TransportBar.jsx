import { usePlayback } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import Waveform from './Waveform.jsx'
import { Glyph } from './AudioPlayer.jsx'
import { fmtTime } from '../utils/wave.js'

// Fixed DAW-style transport at the bottom — shows whatever is playing.
export default function TransportBar() {
  const { track, playing, elapsed, toggle, playAt, stop } = usePlayback()
  const { standalone } = usePWA()
  if (!track) return null
  const progress = elapsed / track.duration

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-line-bright bg-black/95 backdrop-blur"
      style={{ bottom: standalone ? 'calc(env(safe-area-inset-bottom) + 76px)' : 0 }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2 sm:gap-4 sm:px-6">
        <button
          onClick={() => toggle(track)}
          aria-label={playing ? 'pause' : 'play'}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink hover:bg-ink hover:text-bg"
        >
          <Glyph playing={playing} />
        </button>

        <div className="hidden w-44 shrink-0 sm:block">
          <div className="truncate font-sans text-sm text-ink">{track.label}</div>
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {track.sub}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <Waveform seed={track.seed} progress={progress} onSeek={(f) => playAt(track, f)} height={30} bars={120} />
        </div>

        <div className="shrink-0 font-mono text-[11px] text-muted tnum">
          {fmtTime(elapsed)} / {fmtTime(track.duration)}
        </div>

        <button
          onClick={stop}
          aria-label="stop"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-muted hover:border-ink hover:text-ink"
        >
          <span className="block h-2.5 w-2.5 bg-current" />
        </button>
      </div>
    </div>
  )
}
