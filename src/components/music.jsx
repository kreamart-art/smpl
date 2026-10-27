// Shared music building blocks: track rows that play as one list, release and
// track cards for grids, and the owner's visibility label.
import { Link } from 'react-router-dom'
import { usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { playableAudio } from '../utils/audio.js'
import { fmtTime } from '../utils/wave.js'
import { Cover, PlayButton } from './crate.jsx'

export const yearOf = (ms) => (ms ? new Date(ms).getFullYear() : '')

export function trackMeta(track, maker, album) {
  return {
    id: `track-${track.id}`,
    src: playableAudio(track.audioUrl) ? track.audioUrl : undefined,
    label: track.title,
    sub: maker ? `@${maker.alias}` : '',
    artist: maker?.alias,
    album,
    seed: track.id,
    duration: track.duration || 0,
    artwork: track.coverUrl || undefined,
    href: `/track/${track.id}`,
  }
}

export function VisibilityTag({ visibility }) {
  const t = useT()
  if (!visibility || visibility === 'public') return null
  return (
    <span className="border border-line-bright px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
      {t(`music.visibility.${visibility}`)}
    </span>
  )
}

// A numbered tracklist; playing a row starts the whole list as the queue.
export function TrackList({ tracks, maker, cover, album, showMaker = false }) {
  const t = useT()
  const { track: current, playing, playList } = usePlayback()
  const queue = tracks.map((tr) => trackMeta({ ...tr, coverUrl: tr.coverUrl || cover }, tr.maker || maker, album))
  return (
    <ol className="border-t border-line">
      {tracks.map((tr, i) => {
        const meta = queue[i]
        const on = current?.id === meta.id && playing
        return (
          <li key={tr.id} className="flex items-center gap-3 border-b border-line py-2.5">
            <span className="w-6 shrink-0 text-right font-mono text-[11px] text-faint tnum">{i + 1}</span>
            <PlayButton
              variant="line"
              size={36}
              playing={on}
              disabled={!meta.src}
              onClick={() => playList(queue, i)}
              label={on ? t('common.pause') : `${t('common.play')}: ${tr.title}`}
            />
            <div className="min-w-0 flex-1">
              <Link to={`/track/${tr.id}`} className={`block truncate font-sans text-[15px] ${on ? 'text-bright' : 'text-ink'} hover:underline`}>
                {tr.title}
              </Link>
              <div className="flex items-center gap-2 truncate font-mono text-[11px] text-muted">
                {showMaker && (tr.maker || maker) ? <span>@{(tr.maker || maker).alias}</span> : null}
                {tr.genre ? <span>{tr.genre}</span> : null}
                <VisibilityTag visibility={tr.visibility} />
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted tnum">{tr.duration ? fmtTime(tr.duration) : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function ReleaseCard({ release, maker, className = '' }) {
  const t = useT()
  return (
    <Link to={`/release/${release.id}`} className={`group block ${className}`}>
      <Cover src={release.coverUrl} title={release.title} id={release.id} kind={release.type} label={t(`music.type.${release.type}`)} />
      <div className="mt-2 flex items-center gap-2">
        <span className="truncate font-sans text-[14px] font-medium text-ink group-hover:underline">{release.title}</span>
        <VisibilityTag visibility={release.visibility} />
      </div>
      <div className="truncate font-mono text-[11px] text-muted">
        {t(`music.type.${release.type}`)}
        {release.releaseDate ? ` · ${yearOf(release.releaseDate)}` : ''}
        {maker ? ` · @${maker.alias}` : ''}
      </div>
    </Link>
  )
}

// A loose track in a grid, playable from the sleeve.
export function TrackCard({ track, maker, className = '' }) {
  const t = useT()
  const { track: current, playing, toggle } = usePlayback()
  const meta = trackMeta(track, maker)
  const on = current?.id === meta.id && playing
  return (
    <div className={className}>
      <div className="relative">
        <Link to={`/track/${track.id}`} aria-label={track.title}>
          <Cover src={track.coverUrl} title={track.title} id={track.id} kind="track" label={t('music.track')} />
        </Link>
        {meta.src ? (
          <PlayButton
            size={38}
            playing={on}
            onClick={() => toggle(meta)}
            label={on ? t('common.pause') : `${t('common.play')}: ${track.title}`}
            className="absolute bottom-2 left-2"
          />
        ) : null}
      </div>
      <Link to={`/track/${track.id}`} className="mt-2 block truncate font-sans text-[14px] font-medium text-ink hover:underline">
        {track.title}
      </Link>
      <div className="truncate font-mono text-[11px] text-muted">
        {maker ? `@${maker.alias}` : t('music.track')}
        {track.genre ? ` · ${track.genre}` : ''}
      </div>
    </div>
  )
}

// draft / unlisted / public, each with what it means
export function VisibilityPicker({ value, onChange }) {
  const t = useT()
  return (
    <div role="radiogroup" aria-label={t('music.visibility')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {['draft', 'unlisted', 'public'].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`border px-3 py-2.5 text-left transition-colors ${
            value === v ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
          }`}
        >
          <span className="block font-mono text-[11px] uppercase tracking-[0.12em]">{t(`music.visibility.${v}`)}</span>
          <span className={`mt-0.5 block font-sans text-[12px] leading-snug ${value === v ? 'text-bg/80' : 'text-muted'}`}>
            {t(`music.visibilityHint.${v}`)}
          </span>
        </button>
      ))}
    </div>
  )
}

export const canPublishMusic = (u) =>
  !!u && (u.role === 'producer' || u.role === 'artist' || !!u.dualRole || u.role === 'curator' || u.role === 'admin')
