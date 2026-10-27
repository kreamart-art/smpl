import { Link } from 'react-router-dom'
import { usePlayback } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { useT } from '../i18n/index.jsx'
import { fmtTime } from '../utils/wave.js'
import { TAB_BAR_H } from './BottomTabBar.jsx'
import { Cover, PlayButton } from './crate.jsx'
import { IconClose, IconNext, IconPrev } from './icons.jsx'

// A thin, honest progress line on top of the player (no decorative waveform).
// Tall invisible hit area for thumbs; arrow keys step 5 seconds.
function ProgressLine({ progress, duration, onSeek, disabled, label }) {
  const pick = (e) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
  }
  const onKey = (e) => {
    if (disabled || !duration) return
    const step = 5 / duration
    if (e.key === 'ArrowRight') onSeek(Math.min(1, progress + step))
    else if (e.key === 'ArrowLeft') onSeek(Math.max(0, progress - step))
    else return
    e.preventDefault()
  }
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(progress * (duration || 0))}
      aria-valuetext={`${fmtTime(progress * (duration || 0))} / ${fmtTime(duration || 0)}`}
      onClick={pick}
      onKeyDown={onKey}
      className={`absolute inset-x-0 -top-[7px] h-[14px] ${disabled ? '' : 'cursor-pointer'}`}
    >
      <div className="absolute inset-x-0 top-[6px] h-[2px] bg-line">
        <div className="h-full bg-ink" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

// The one compact player docked at the bottom: whatever is playing, anywhere.
export default function TransportBar() {
  const { track, status, playing, elapsed, duration, toggle, playAt, stop, next, prev, hasNext, hasPrev } = usePlayback()
  const { standalone } = usePWA()
  const t = useT()
  if (!track) return null
  const progress = duration ? Math.min(1, elapsed / duration) : 0
  const note =
    status === 'loading'
      ? t('player.loading')
      : status === 'error'
        ? t('player.error')
        : status === 'unavailable'
          ? t('player.unavailable')
          : null
  const inList = hasNext || hasPrev

  const info = (
    <>
      <Cover src={track.artwork} title={track.sub || track.label} titleSize="xs" className="w-10 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate font-sans text-[14px] font-medium leading-tight text-ink">{track.label}</span>
        <span
          className={`mt-0.5 block truncate font-mono text-[11px] ${status === 'error' ? 'text-accent' : 'text-muted'}`}
          aria-live="polite"
        >
          {note || track.sub}
        </span>
      </span>
    </>
  )

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-line-bright bg-chrome backdrop-blur"
      style={{ bottom: standalone ? `calc(env(safe-area-inset-bottom) + ${TAB_BAR_H}px)` : 0 }}
    >
      <ProgressLine
        progress={progress}
        duration={duration}
        onSeek={(f) => playAt(track, f)}
        disabled={!track.src}
        label={t('player.seek')}
      />
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        {track.href ? (
          <Link to={track.href} className="flex min-w-0 flex-1 items-center gap-3">
            {info}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{info}</div>
        )}

        <span className="hidden shrink-0 font-mono text-[11px] text-muted tnum sm:block">
          {fmtTime(elapsed)} / {fmtTime(duration)}
        </span>

        {inList ? (
          <button
            type="button"
            onClick={prev}
            aria-label={t('player.prev')}
            className="flex h-10 w-9 shrink-0 items-center justify-center text-ink transition-colors hover:text-bright"
          >
            <IconPrev size={16} />
          </button>
        ) : null}
        <PlayButton
          size={40}
          playing={playing}
          onClick={() => toggle(track)}
          disabled={!track.src}
          label={playing ? t('common.pause') : t('common.play')}
        />
        {inList ? (
          <button
            type="button"
            onClick={next}
            disabled={!hasNext}
            aria-label={t('player.next')}
            className="flex h-10 w-9 shrink-0 items-center justify-center text-ink transition-colors hover:text-bright disabled:opacity-30"
          >
            <IconNext size={16} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={stop}
          aria-label={t('player.close')}
          className="flex h-10 w-9 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink"
        >
          <IconClose size={16} />
        </button>
      </div>
    </div>
  )
}
