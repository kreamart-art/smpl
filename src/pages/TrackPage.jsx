import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp, usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { fmtTime } from '../utils/wave.js'
import { Cover, Kicker, DisplayTitle, MetaTag, PlayButton, SectionHead, Tape, EmptyState } from '../components/crate.jsx'
import { VisibilityTag, trackMeta, yearOf } from '../components/music.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import ShareSheet from '../components/ShareSheet.jsx'
import { IconBack, IconChevronRight } from '../components/icons.jsx'

// One recording: sleeve, maker, tags, where it came from (a battle) and which
// releases carry it.
export default function TrackPage() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { fetchTrack, deleteTrack, currentUser } = useApp()
  const { track: current, playing, toggle } = usePlayback()
  const [data, setData] = useState(null)

  const load = useCallback(() => {
    fetchTrack(id).then((r) => {
      setData(r.ok ? r : { error: true })
      if (r.ok) document.title = `${r.track.title}${r.maker ? ` by @${r.maker.alias}` : ''}: SMPL`
    })
  }, [fetchTrack, id])
  useEffect(load, [load])

  if (!data) return <div className="px-4 py-24 text-center font-mono text-[12px] text-muted">{t('common.loading')}</div>
  if (data.error)
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('music.notFound')} />
      </div>
    )

  const { track, maker, releases, source } = data
  const own = currentUser?.id === track.userId
  const meta = trackMeta(track, maker)
  const on = current?.id === meta.id && playing
  const onDelete = async () => {
    if (!window.confirm(t('music.confirmDelete'))) return
    const r = await deleteTrack(track.id)
    if (r.ok) navigate(maker ? `/profile/${encodeURIComponent(maker.alias)}` : '/home')
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink"
      >
        <IconBack size={14} />
        {t('common.back')}
      </button>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,360px)_1fr] md:items-end md:gap-10">
        <div className="relative">
          <Tape className="-top-2 left-6" rotate={-5} />
          <Cover src={track.coverUrl} title={track.title} id={track.id} kind="track" label={t('music.track')} titleSize="lg" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Kicker>
              {t('music.track')}
              {track.publishedAt ? ` · ${yearOf(track.publishedAt)}` : ''}
              {track.duration ? ` · ${fmtTime(track.duration)}` : ''}
            </Kicker>
            <VisibilityTag visibility={track.visibility} />
          </div>
          <DisplayTitle as="h1" size="md" className="mt-2 text-ink">
            {track.title}
          </DisplayTitle>
          {maker ? (
            <Link
              to={`/profile/${encodeURIComponent(maker.alias)}`}
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[13px] text-ink-dim hover:text-ink"
            >
              @{maker.alias}
              {maker.verified ? <VerifiedBadge size={12} /> : null}
            </Link>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {track.genre ? <MetaTag>{track.genre}</MetaTag> : null}
            {track.bpm ? <MetaTag>{track.bpm} BPM</MetaTag> : null}
            {track.musicalKey ? <MetaTag>{track.musicalKey}</MetaTag> : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayButton size={52} playing={on} disabled={!meta.src} onClick={() => toggle(meta)} label={on ? t('common.pause') : t('common.play')} />
            <ShareSheet className="h-11 w-11" title={track.title} text={maker ? `${track.title} · @${maker.alias}` : track.title} />
            {own ? (
              <>
                <Link
                  to={`/create/track/${track.id}`}
                  className="inline-flex h-11 items-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-bg"
                >
                  {t('music.edit')}
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex h-11 items-center px-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink"
                >
                  {t('music.delete')}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {source || releases.length ? (
        <section className="mt-10">
          {source ? (
            <Link
              to={`/battles/${source.battleId}`}
              className="group flex items-center justify-between gap-3 border-b border-t border-line py-3 font-sans text-[15px] text-ink hover:bg-panel"
            >
              <span className="truncate">{t('music.fromBattle', { title: source.battleTitle })}</span>
              <IconChevronRight size={16} className="shrink-0 text-muted group-hover:text-ink" />
            </Link>
          ) : null}
          {releases.map((r) => (
            <Link
              key={r.id}
              to={`/release/${r.id}`}
              className="group flex items-center gap-3 border-b border-line py-3 hover:bg-panel"
            >
              <Cover src={r.coverUrl} title={r.title} id={r.id} titleSize="xs" className="w-12 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-sans text-[15px] text-ink">
                {t('music.onRelease', { title: r.title })}
              </span>
              <span className="font-mono text-[11px] uppercase text-muted">{t(`music.type.${r.type}`)}</span>
              <IconChevronRight size={16} className="shrink-0 text-muted group-hover:text-ink" />
            </Link>
          ))}
        </section>
      ) : null}

      {track.description ? (
        <section className="mt-10">
          <SectionHead title={t('upload.description')} />
          <p className="mt-3 max-w-prose whitespace-pre-line font-sans text-[16px] leading-relaxed text-ink-dim">
            {track.description}
          </p>
        </section>
      ) : null}
    </div>
  )
}
