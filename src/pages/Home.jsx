import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS, countdownTarget } from '../data/status.js'
import { playableAudio } from '../utils/audio.js'
import { CountdownInline } from '../components/Countdown.jsx'
import { Cover, SectionHead, Kicker, DisplayTitle, MetaTag, PlayButton, Stamp, Tape, EmptyState, catalogNo } from '../components/crate.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WaveformClips from '../components/WaveformClips.jsx'
import SuggestedPeople from '../components/SuggestedPeople.jsx'
import GameTeaser from '../components/GameTeaser.jsx'
import { FeedRow } from './Feed.jsx'
import { IconChevronRight } from '../components/icons.jsx'

// Phase order for "what deserves the front page": live voting first, then
// open entries, then signups, then announcements.
const PRIORITY = {
  [STATUS.VOTING_PHASE]: 0,
  [STATUS.SUBMISSION_PHASE]: 1,
  [STATUS.OPEN_FOR_SIGNUP]: 2,
  [STATUS.ANNOUNCED]: 3,
}
const LIVE = new Set([STATUS.VOTING_PHASE, STATUS.SUBMISSION_PHASE])

function rankBattles(battles) {
  return battles
    .filter((b) => b.status in PRIORITY)
    .sort((a, b) => {
      const p = PRIORITY[a.status] - PRIORITY[b.status]
      if (p) return p
      // a real (scheduled) deadline that comes sooner goes first
      const da = countdownTarget(a).ts ?? Infinity
      const db = countdownTarget(b).ts ?? Infinity
      return da - db
    })
}

// The honest "when" line for a battle: a real countdown for scheduled ones, the
// phase for manual ones.
function When({ battle }) {
  const t = useT()
  const { ts, manual } = countdownTarget(battle)
  if (manual) return <span className="text-muted">{t('battles.card.cd.manualValue')}</span>
  if (!ts) return <span className="text-muted">{t(`status.${battle.status}`)}</span>
  return <CountdownInline to={ts} className="text-accent" />
}

function FeaturedBattle({ battle }) {
  const t = useT()
  const { battleSubmissions } = useApp()
  const kindLabel = t(`kind.long.${battle.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)
  const entries = battleSubmissions(battle.id).length
  const live = battle.status === STATUS.VOTING_PHASE
  const hasArt = !!battle.cover
  return (
    <section className="relative">
      <Tape className="-top-2 left-5 sm:left-8" rotate={-5} />
      <Link
        to={`/battles/${battle.id}`}
        className={`group relative grid overflow-hidden border border-line-bright bg-panel ${
          hasArt ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : 'sleeve-grid'
        }`}
      >
        {hasArt ? (
          <Cover src={battle.cover} alt="" title={battle.title} id={battle.id} className="border-0" treatment="copy" />
        ) : null}
        <div className={`flex flex-col justify-between gap-6 p-5 sm:p-8 ${hasArt ? '' : 'min-h-[420px] sm:min-h-[460px]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Kicker className="text-ink-dim">{t('home.featured')}</Kicker>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{catalogNo(battle.id)}</div>
            </div>
            {live ? (
              <Stamp tone="accent" rotate={4}>
                {t('home.live')}
              </Stamp>
            ) : null}
          </div>
          <div>
            <DisplayTitle as="h2" size={hasArt ? 'lg' : 'xl'} className="text-ink">
              {battle.title}
            </DisplayTitle>
            {battle.description ? (
              <p className="mt-4 line-clamp-3 max-w-prose font-sans text-[15px] leading-relaxed text-ink-dim">
                {battle.description}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <MetaTag>{kindLabel}</MetaTag>
              {battle.genre ? <MetaTag>{battle.genre}</MetaTag> : null}
              {battle.bpm ? <MetaTag>{battle.bpm} BPM</MetaTag> : null}
              {battle.musicalKey ? <MetaTag>{battle.musicalKey}</MetaTag> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
            <div className="font-mono text-[12px] leading-relaxed">
              <StatusBadge status={battle.status} size="sm" />
              <div className="mt-2 text-muted">
                <When battle={battle} />
                {entries ? <span> · {t('home.entries', { n: entries })}</span> : null}
              </div>
            </div>
            <span className="inline-flex h-11 items-center gap-2 bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink transition-colors group-hover:bg-bright">
              {t('home.enter')}
              <IconChevronRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}

function BattleRow({ battle }) {
  const t = useT()
  const kindLabel = t(`kind.long.${battle.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)
  return (
    <Link
      to={`/battles/${battle.id}`}
      className="group flex items-center gap-4 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-panel"
    >
      <Cover src={battle.cover} title={battle.title} id={battle.id} kind={battle.kind} label={kindLabel} titleSize="xs" className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[16px] font-medium text-ink">{battle.title}</div>
        <div className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {kindLabel}
          {battle.genre ? ` · ${battle.genre}` : ''}
        </div>
        <div className="mt-1 font-mono text-[11px]">
          <When battle={battle} />
        </div>
      </div>
      <IconChevronRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
    </Link>
  )
}

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
          <Cover src={battle.cover} title={battle.title} id={battle.id} kind={battle.kind} label={t(`kind.long.${battle.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)} />
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
  const { battles, getUser, currentUser, fetchFeed, fetchLatestClips } = useApp()
  const [tab, setTab] = useState('forYou')
  const [clips, setClips] = useState(null)
  const [feed, setFeed] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      fetchLatestClips(9).then((r) => alive && setClips(r.ok ? r.videos || [] : []))
      fetchFeed().then((r) => alive && setFeed(r.ok ? r.feed || [] : []))
    }
    load()
    window.addEventListener('smpl:refresh', load)
    return () => {
      alive = false
      window.removeEventListener('smpl:refresh', load)
    }
  }, [fetchFeed, fetchLatestClips])

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
    (tab === 'music' && ['results', 'clips'].includes(section))

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
        <div className="mt-6">{featured ? <FeaturedBattle battle={featured} /> : <EmptyState title={t('home.noBattles')} />}</div>
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
