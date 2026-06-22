// /smpl/src/components/WaveformClips.jsx
//
// Instagram-style SQUARE grid of a producer's saved waveform clips (their battle
// flips as shareable videos). Compact square thumbnails (3 across on mobile) with
// a small play marker; tapping opens the clip's own page. The vertical clip is
// centre-cropped into the square, like an IG profile grid. Black, mono, no emoji.
import { Link } from 'react-router-dom'
import { IconPlay } from './icons.jsx'
import { mediaUrl } from '../api.js'

// Square grid of saved clips. Tap one to open its page, where the owner gets a
// ⋯ menu to remove it (delete lives on the post, IG-style — not on the grid).
export default function WaveformClips({ clips = [] }) {
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
        </div>
      ))}
    </div>
  )
}
