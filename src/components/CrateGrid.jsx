// The crate grid shown on a profile: the beats/verses this person saved from
// battles. Rows play through the shared player as one list (next/prev walk the
// crate) and link to the maker + the battle. Items from a battle still in
// voting are private (the server only sends them to the owner) and marked
// "result pending".
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { PlayButton } from './crate.jsx'
import { usePlayback } from '../context/AppContext.jsx'
import { playableAudio } from '../utils/audio.js'
import { useT } from '../i18n/index.jsx'

function CrateRow({ item, queue, index }) {
  const t = useT()
  const { track, playing, playList } = usePlayback()
  const meta = queue[index]
  const isPlaying = track?.id === meta.id && playing
  const prod = item.producer
  return (
    <div className="flex items-center gap-3 border border-line bg-panel px-4 py-3">
      <PlayButton
        variant="line"
        size={40}
        playing={isPlaying}
        disabled={!meta.src}
        onClick={() => playList(queue, index)}
        label={isPlaying ? t('common.pause') : t('common.play')}
      />
      <div className="min-w-0 flex-1">
        {prod ? (
          <Link
            to={`/profile/${encodeURIComponent(prod.alias)}`}
            className="flex items-center gap-1.5 font-mono text-[12px] text-ink transition-colors hover:text-muted"
          >
            <Avatar alias={prod.alias} src={prod.avatar} size={20} />
            <span className="truncate">@{prod.alias}</span>
            {prod.verified ? <VerifiedBadge size={11} /> : null}
          </Link>
        ) : (
          <span className="font-mono text-[12px] text-muted">{item.pending ? t('crate.pending') : t('crate.anon')}</span>
        )}
        <Link
          to={`/battles/${item.battleId}`}
          className="mt-1 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition-colors hover:text-muted"
        >
          {item.battleTitle}
        </Link>
      </div>
      {item.pending ? (
        <span className="shrink-0 border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          {t('crate.pending')}
        </span>
      ) : null}
    </div>
  )
}

export default function CrateGrid({ items = [] }) {
  const t = useT()
  // same track ids as the battle page, so a beat playing there shows as playing here
  const queue = items.map((it) => ({
    id: `beat-${it.submissionId || it.id}`,
    src: playableAudio(it.audioUrl) ? it.audioUrl : undefined,
    label: it.producer ? it.producer.alias : it.pending ? t('crate.pending') : t('crate.anon'),
    sub: it.battleTitle,
    seed: it.submissionId || it.id,
    duration: 0,
    href: `/battles/${it.battleId}`,
  }))
  return (
    <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((it, i) => (
        <CrateRow key={it.id} item={it} queue={queue} index={i} />
      ))}
    </div>
  )
}
