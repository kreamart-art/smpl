// The crate grid shown on a profile — the beats/verses this person saved from
// battles. Each row plays inline and links to the maker + the battle. Items
// from a battle still in voting are private (the server only sends them to the
// owner) and marked "result pending".
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { IconPlay, IconPause } from './icons.jsx'
import { mediaUrl } from '../api.js'
import { useT } from '../i18n/index.jsx'

function CrateRow({ item }) {
  const t = useT()
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (a.paused) {
      a.play()
      setPlaying(true)
    } else {
      a.pause()
      setPlaying(false)
    }
  }
  const prod = item.producer
  return (
    <div className="flex items-center gap-3 border border-line bg-panel px-4 py-3">
      {item.audioUrl ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t('common.pause') : t('common.play')}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors hover:bg-ink hover:text-bg"
        >
          {playing ? <IconPause size={15} /> : <IconPlay size={14} />}
          <audio ref={ref} src={mediaUrl(item.audioUrl)} onEnded={() => setPlaying(false)} preload="none" />
        </button>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-faint">
          <IconPlay size={14} />
        </div>
      )}
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
  return (
    <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((it) => (
        <CrateRow key={it.id} item={it} />
      ))}
    </div>
  )
}
