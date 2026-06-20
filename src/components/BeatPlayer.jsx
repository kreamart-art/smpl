import { Link } from 'react-router-dom'
import { usePlayback } from '../context/AppContext.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import Waveform from './Waveform.jsx'
import { Glyph } from './AudioPlayer.jsx'
import { fmtTime } from '../utils/wave.js'

// A single beat row. Shows the producer's @handle (linked to profile) when
// revealed — from the voting phase on, so people vote for their favourite.
export default function BeatPlayer({
  meta,
  index,
  noun = 'BEAT',
  revealed = false,
  alias,
  verified = false,
  votes,
  showVotes = false,
  isWinner = false,
  rank,
  rightSlot,
}) {
  const { track, playing, elapsed, duration, toggle, playAt } = usePlayback()
  const isCurrent = track?.id === meta.id
  const isPlaying = isCurrent && playing
  const dur = (isCurrent && duration) || meta.duration
  const progress = isCurrent && dur ? elapsed / dur : 0

  return (
    <div
      className={`border ${
        isWinner ? 'border-accent' : 'border-line'
      } ${isWinner ? 'bg-accent text-accent-ink' : 'bg-panel text-ink'}`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          isWinner ? 'border-black/30' : 'border-line'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {typeof rank === 'number' ? (
            <span className="font-mono text-[11px] tnum opacity-70">
              {String(rank).padStart(2, '0')}
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em]">
            {revealed && alias ? (
              <>
                <Link
                  to={`/profile/${encodeURIComponent(alias)}`}
                  className="truncate underline-offset-4 hover:underline"
                >
                  @{alias}
                </Link>
                {verified ? <VerifiedBadge size={11} /> : null}
              </>
            ) : (
              `${noun} #${index}`
            )}
          </span>
          {isWinner ? <span className="font-mono text-[10px] font-bold">★ WINNER</span> : null}
        </div>
        <div className="flex items-center gap-3">
          {showVotes ? (
            <span className="font-mono text-[11px] tnum">
              {votes} {votes === 1 ? 'vote' : 'votes'}
            </span>
          ) : null}
          <span className="font-mono text-[10px] tnum opacity-70">
            {fmtTime(isCurrent ? elapsed : 0)}/{fmtTime(dur)}
          </span>
        </div>
      </div>

      <div className="flex items-stretch">
        <button
          onClick={() => toggle(meta)}
          aria-label={isPlaying ? 'pause' : 'play'}
          className={`flex min-h-[44px] w-12 shrink-0 touch-manipulation items-center justify-center border-r transition-colors ${
            isWinner
              ? 'border-black/25 hover:bg-accent-ink hover:text-accent'
              : 'border-line hover:bg-ink hover:text-bg'
          }`}
        >
          <Glyph playing={isPlaying} />
        </button>
        <div className="flex-1 overflow-hidden px-3 py-2 min-w-0">
          <Waveform
            seed={meta.seed}
            progress={progress}
            onSeek={(f) => playAt(meta, f)}
            height={34}
            bars={48}
            playedClass={isWinner ? 'bg-accent-ink' : 'bg-ink'}
            baseClass={isWinner ? 'bg-black/25' : 'bg-line-bright'}
          />
        </div>
        {rightSlot ? (
          <div className={`flex items-center border-l px-3 ${isWinner ? 'border-black/30' : 'border-line'}`}>
            {rightSlot}
          </div>
        ) : null}
      </div>
    </div>
  )
}
