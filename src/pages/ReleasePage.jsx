import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp, usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Cover, Kicker, DisplayTitle, PlayButton, SectionHead, Tape, EmptyState } from '../components/crate.jsx'
import { TrackList, VisibilityTag, trackMeta, yearOf } from '../components/music.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import ShareSheet from '../components/ShareSheet.jsx'
import { IconBack } from '../components/icons.jsx'

// A single / EP / album: the sleeve, who made it, the tracklist (plays as one list).
export default function ReleasePage() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { fetchRelease, deleteRelease, currentUser } = useApp()
  const { track, playing, playList, toggle } = usePlayback()
  const [data, setData] = useState(null)

  const load = useCallback(() => {
    fetchRelease(id).then((r) => setData(r.ok ? r : { error: true }))
  }, [fetchRelease, id])
  useEffect(load, [load])

  if (!data) return <div className="px-4 py-24 text-center font-mono text-[12px] text-muted">{t('common.loading')}</div>
  if (data.error)
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('music.notFound')} />
      </div>
    )

  const { release, maker, tracks } = data
  const own = currentUser?.id === release.userId
  const typeLabel = t(`music.type.${release.type}`)
  const queue = tracks.map((tr) => trackMeta({ ...tr, coverUrl: tr.coverUrl || release.coverUrl }, maker, release.title))
  const listOn = !!track && queue.some((m) => m.id === track.id) && playing
  const playAll = () => {
    if (track && queue.some((m) => m.id === track.id)) toggle(track)
    else if (queue.length) playList(queue, 0)
  }
  const onDelete = async () => {
    if (!window.confirm(t('music.confirmDelete'))) return
    const r = await deleteRelease(release.id)
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
          <Cover src={release.coverUrl} title={release.title} id={release.id} kind={release.type} label={typeLabel} titleSize="lg" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Kicker>
              {typeLabel}
              {release.releaseDate ? ` · ${yearOf(release.releaseDate)}` : ''}
              {' · '}
              {tracks.length === 1 ? t('music.trackOne') : t('music.tracks', { n: tracks.length })}
            </Kicker>
            <VisibilityTag visibility={release.visibility} />
          </div>
          <DisplayTitle as="h1" size="md" className="mt-2 text-ink">
            {release.title}
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayButton size={52} playing={listOn} disabled={!queue.some((m) => m.src)} onClick={playAll} label={t('music.playAll')} />
            <ShareSheet className="h-11 w-11" title={release.title} text={maker ? `${release.title} · @${maker.alias}` : release.title} />
            {own ? (
              <>
                <Link
                  to={`/create/release/${release.id}`}
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

      <section className="mt-10">
        <SectionHead title={t('release.pick')} />
        {tracks.length ? (
          <TrackList tracks={tracks} maker={maker} cover={release.coverUrl} album={release.title} />
        ) : (
          <EmptyState className="mt-4" title={t('profile.music.empty')} />
        )}
      </section>

      {release.description ? (
        <section className="mt-10">
          <SectionHead title={t('release.about')} />
          <p className="mt-3 max-w-prose whitespace-pre-line font-sans text-[16px] leading-relaxed text-ink-dim">
            {release.description}
          </p>
        </section>
      ) : null}
    </div>
  )
}
