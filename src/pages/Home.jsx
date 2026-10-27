import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import { playableAudio } from '../utils/audio.js'
import { Cover, SectionHead, PlayButton, EmptyState } from '../components/crate.jsx'
import BattleHero from '../components/BattleHero.jsx'
import { BattleRow, rankBattles, kindKey } from '../components/BattleRow.jsx'
import WaveformClips from '../components/WaveformClips.jsx'
import SuggestedPeople from '../components/SuggestedPeople.jsx'
import GameTeaser from '../components/GameTeaser.jsx'
import { FeedRow } from './Feed.jsx'
import { ReleaseCard, TrackCard } from '../components/music.jsx'

const LIVE = new Set([STATUS.VOTING_PHASE, STATUS.SUBMISSION_PHASE])

// A finished battle's winning entry, playable right here: the "listen" step.
function ResultCard({ battle }) {
  const t = useT()
  const { battleSubmissions, getUser } = useApp()
  const { track, playing, toggle } = usePlayback()
  const win = battleSubmissions(battle.id).find((s) => s.id === battle.winnerSubmissionId)
  const maker = win ? getUser(win.producerId) : null
  if (!win || !maker) return null
  const meta = {
    id: `beat-${win.id}`,
    label: maker.alias,
    sub: battle.title,
    duration: win.duration || 0,
    seed: win.id,
    src: playableAudio(win.audioUrl) ? win.audioUrl : undefined,
    href: `/battles/${battle.id}`,
  }
  const isPlaying = track?.id === meta.id && playing
  return (
    <div className="w-[46vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none">
      <div className="relative">
        <Link to={`/battles/${battle.id}`} aria-label={battle.title}>
          <Cover src={battle.cover} title={battle.title} id={battle.id} kind={battle.kind} label={t(kindKey(battle.kind))} />
        </Link>
        {meta.src ? (
          <PlayButton
            size={40}
            playing={isPlaying}
            onClick={() => toggle(meta)}
            label={`${t('home.listen')}: @${maker.alias}`}
            className="absolute bottom-2 left-2"
          />
        ) : null}
      </div>
      <Link to={`/battles/${battle.id}`} className="mt-2 block truncate font-sans text-[14px] font-medium text-ink hover:underline">
        {battle.title}
      </Link>
      <Link
        to={`/profile/${encodeURIComponent(maker.alias)}`}
        className="block truncate font-mono text-[11px] text-muted hover:text-ink"
      >
        {t('home.wonBy', { alias: maker.alias })}
      </Link>
    </div>
  )
}

const TABS = ['forYou', 'battles', 'music']

export default function Home() {
  const t = useT()
  const { battles, getUser, currentUser, fetchFeed, fetchLatestClips, fetchLatestMusic } = useApp()
  const [tab, setTab] = useState('forYou')
  const [clips, setClips] = useState(null)
  const [feed, setFeed] = useState(null)
  const [drops, setDrops] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      fetchLatestClips(9).then((r) => alive && setClips(r.ok ? r.videos || [] : []))
      fetchFeed().then((r) => alive && setFeed(r.ok ? r.feed || [] : []))
      fetchLatestMusic(8).then((r) => alive && setDrops(r.ok ? r : { releases: [], tracks: [] }))
    }
    load()
    window.addEventListener('smpl:refresh', load)
    return () => {
      alive = false
      window.removeEventListener('smpl:refresh', load)
    }
  }, [fetchFeed, fetchLatestClips, fetchLatestMusic])

  const ranked = useMemo(() => rankBattles(battles), [battles])
  const featured = ranked[0] || null
  const live = ranked.filter((b) => LIVE.has(b.status) && b.id !== featured?.id)
  const upcoming = ranked.filter((b) => !LIVE.has(b.status) && b.id !== featured?.id)
  const results = useMemo(
    () =>
      battles
        .filter((b) => b.status === STATUS.WINNER_DECLARED && b.winnerSubmissionId)
        .sort((a, b) => (b.voteEnd || 0) - (a.voteEnd || 0))
        .slice(0, 8),
    [battles],
  )
  const community = (feed || []).filter((i) => !(i.type === 'placement' && i.position === 1)).slice(0, 5)

  const show = (section) =>
    tab === 'forYou' ||
    (tab === 'battles' && ['featured', 'live', 'upcoming', 'results'].includes(section)) ||
    (tab === 'music' && ['drops', 'results', 'clips'].includes(section))

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <div role="tablist" aria-label={t('nav.home')} className="flex items-stretch gap-1 border-b border-line">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              tab === k ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t(`home.tab.${k}`)}
          </button>
        ))}
      </div>

      {show('featured') ? (
        <div className="mt-6">
          {featured ? <BattleHero battle={featured} kicker={t('home.featured')} /> : <EmptyState title={t('home.noBattles')} />}
        </div>
      ) : null}

      {show('drops') && drops && (drops.releases.length || drops.tracks.length) ? (
        <section className="mt-12">
          <SectionHead title={t('home.drops')} />
          <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {drops.releases.map((r) => (
              <ReleaseCard key={r.id} release={r} maker={r.maker} className="w-[46vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none" />
            ))}
            {drops.releases.length < 4
              ? drops.tracks.slice(0, 4 - drops.releases.length).map((tr) => (
                  <TrackCard key={tr.id} track={tr} maker={tr.maker} className="w-[46vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none" />
                ))
              : null}
          </div>
        </section>
      ) : null}

      {show('results') ? (
        <section className="mt-12">
          <SectionHead title={t('home.results')} to="/battles" more={t('home.seeAll')} />
          {results.length ? (
            <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {results.map((b) => (
                <ResultCard key={b.id} battle={b} />
              ))}
            </div>
          ) : (
            <EmptyState className="mt-4" title={t('home.resultsEmpty')} />
          )}
        </section>
      ) : null}

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {show('live') && live.length ? (
          <section>
            <SectionHead title={t('home.liveNow')} to="/battles" more={t('home.seeAll')} />
            <div className="mt-1">
              {live.slice(0, 5).map((b) => (
                <BattleRow key={b.id} battle={b} />
              ))}
            </div>
          </section>
        ) : null}
        {show('upcoming') && upcoming.length ? (
          <section>
            <SectionHead title={t('home.upcoming')} to="/battles" more={t('home.seeAll')} />
            <div className="mt-1">
              {upcoming.slice(0, 5).map((b) => (
                <BattleRow key={b.id} battle={b} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {show('clips') ? (
        <section className="mt-12">
          <SectionHead title={t('home.clips')} to="/discover?type=clips" more={t('home.seeAll')} />
          {clips === null ? null : clips.length ? (
            <WaveformClips clips={clips} className="mt-4" />
          ) : (
            <EmptyState className="mt-4" title={t('home.clipsEmpty')} />
          )}
        </section>
      ) : null}

      {tab === 'forYou' && currentUser ? <SuggestedPeople className="mt-12" limit={6} /> : null}

      {tab === 'forYou' ? <GameTeaser className="mt-12" /> : null}

      {tab === 'forYou' ? (
        <section className="mt-12">
          <SectionHead title={t('home.community')} to="/feed" more={t('home.seeAll')} />
          {feed === null ? null : community.length ? (
            <div className="mt-1 border-x border-line">
              {community.map((it) => (
                <FeedRow key={it.id} it={it} getUser={getUser} />
              ))}
            </div>
          ) : (
            <EmptyState className="mt-4" title={t('home.communityEmpty')} />
          )}
        </section>
      ) : null}
    </div>
  )
}
