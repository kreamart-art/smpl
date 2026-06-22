// /smpl/src/components/WaveformClips.jsx
//
// Instagram-style SQUARE grid of a producer's saved waveform clips (their battle
// flips as shareable videos). Compact square thumbnails (3 across on mobile) with
// a small play marker; tapping opens the clip's own page. The vertical clip is
// centre-cropped into the square, like an IG profile grid. Black, mono, no emoji.
import { Link } from 'react-router-dom'
import { IconPlay, IconTrash } from './icons.jsx'
import { mediaUrl } from '../api.js'
import { useT } from '../i18n/index.jsx'

export default function WaveformClips({ clips = [], self = false, onDelete }) {
  const t = useT()
  return (
    <div className="mt-8 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-1.5 lg:grid-cols-5">
      {clips.map((v) => (
        <div key={v.id} className="group relative">
          <Link
            to={`/clip/${v.id}`}
            className="relative block aspect-square overflow-hidden border border-line bg-black transition-colors hover:border-line-bright"
          >
            <video
              src={mediaUrl(v.url)}
              poster={v.poster ? mediaUrl(v.poster) : undefined}
              muted
              playsInline
              preload="metadata"
              tabIndex={-1}
              className="pointer-events-none h-full w-full object-cover"
            />
            {/* small play marker, like a reel thumbnail */}
            <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-black/45 text-white backdrop-blur">
              <IconPlay size={13} />
            </span>
          </Link>
          {self ? (
            // Always visible (no hover) so it's reachable on touch, with a confirm
            // so a clip is never removed by an accidental tap.
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                if (window.confirm(t('profile.clips.removeConfirm'))) onDelete?.(v.id)
              }}
              aria-label={t('profile.clips.remove')}
              title={t('profile.clips.remove')}
              className="absolute bottom-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center border border-line-bright bg-black/70 text-muted backdrop-blur transition-colors hover:text-ink active:text-ink"
            >
              <IconTrash size={13} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
