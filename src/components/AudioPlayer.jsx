import { usePlayback } from '../context/AppContext.jsx'
import Waveform from './Waveform.jsx'
import { fmtTime } from '../utils/wave.js'
import { useT } from '../i18n/index.jsx'

// PlayGlyph / PauseGlyph — sharp, square, no rounded edges.
function Glyph({ playing }) {
  return playing ? (
    <span className="flex gap-[3px]">
      <span className="block w-[3px] h-3 bg-current" />
      <span className="block w-[3px] h-3 bg-current" />
    </span>
  ) : (
    <span
      className="block border-y-[6px] border-y-transparent border-l-[10px] border-l-current"
      style={{ marginLeft: 2 }}
    />
  )
}

// The always-visible sample player on the battle detail page.
export default function AudioPlayer({ meta, sealed = false }) {
  const { track, playing, elapsed, duration, toggle, playAt } = usePlayback()
  const t = useT()
  const isCurrent = track?.id === meta.id
  const isPlaying = isCurrent && playing
  const dur = (isCurrent && duration) || meta.duration
  const progress = isCurrent && dur ? elapsed / dur : 0

  return (
    <div className="border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {sealed ? t('audio.sealed') : t('audio.sample')}
        </div>
        <div className="font-mono text-[10px] text-muted tnum">
          {fmtTime(isCurrent ? elapsed : 0)} / {fmtTime(dur)}
        </div>
      </div>

      <div className="flex items-stretch">
        <button
          onClick={() => !sealed && toggle(meta)}
          disabled={sealed}
          aria-label={isPlaying ? 'pause' : 'play'}
          className={`flex min-h-[44px] w-16 shrink-0 touch-manipulation items-center justify-center border-r border-line text-ink transition-colors ${
            sealed ? 'opacity-30' : 'hover:bg-ink hover:text-bg'
          }`}
        >
          <Glyph playing={isPlaying} />
        </button>

        <div className="min-w-0 flex-1 px-4 py-3">
          {sealed ? (
            <div className="flex h-12 items-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {t('audio.revealedWhen')}
            </div>
          ) : (
            <Waveform
              seed={meta.seed}
              progress={progress}
              onSeek={(f) => playAt(meta, f)}
              height={48}
              bars={88}
            />
          )}
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="truncate font-sans text-sm text-ink">{meta.label}</div>
            <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {meta.sub}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Glyph }
