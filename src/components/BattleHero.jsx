import { Link } from 'react-router-dom'
import { useApp, usePlayback } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import { playableAudio } from '../utils/audio.js'
import StatusBadge from './StatusBadge.jsx'
import { Cover, Kicker, DisplayTitle, MetaTag, PlayButton, Stamp, Tape, catalogNo } from './crate.jsx'
import { When, kindKey } from './BattleRow.jsx'
import { IconChevronRight } from './icons.jsx'

// The big front-of-page battle (Home "featured", Arena "scene now"). With
// artwork it's a sleeve + text spread; without, a typographic poster, so the
// title is never printed twice. The source plays right here once revealed.
export default function BattleHero({ battle, kicker }) {
  const t = useT()
  const { battleSubmissions } = useApp()
  const { track, playing, toggle } = usePlayback()
  const kindLabel = t(kindKey(battle.kind))
  const entries = battleSubmissions(battle.id).length
  const live = battle.status === STATUS.VOTING_PHASE
  const hasArt = !!battle.cover
  const to = `/battles/${battle.id}`
  const sample = {
    id: `sample-${battle.id}`,
    label: battle.sampleRevealed ? `${battle.sampleArtist}, ${battle.sampleSong}` : t('battleDetail.sealedSample'),
    sub: battle.title,
    duration: battle.sampleDuration || 0,
    seed: `sample-${battle.id}`,
    src: battle.sampleRevealed && playableAudio(battle.sampleUrl) ? battle.sampleUrl : undefined,
    artwork: battle.cover || undefined,
    href: to,
  }
  const sampleOn = track?.id === sample.id && playing

  return (
    <section className="relative">
      <Tape className="-top-2 left-5 sm:left-8" rotate={-5} />
      <div
        className={`relative grid overflow-hidden border border-line-bright bg-panel ${
          hasArt ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : 'sleeve-grid'
        }`}
      >
        {hasArt ? (
          <Link to={to} tabIndex={-1} aria-hidden="true">
            <Cover src={battle.cover} alt="" className="border-0" treatment="copy" />
          </Link>
        ) : null}
        <div className={`flex flex-col justify-between gap-6 p-5 sm:p-8 ${hasArt ? '' : 'min-h-[400px] sm:min-h-[460px]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Kicker className="text-ink-dim">{kicker}</Kicker>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{catalogNo(battle.id)}</div>
            </div>
            {live ? (
              <Stamp tone="accent" rotate={4}>
                {t('home.live')}
              </Stamp>
            ) : null}
          </div>
          <div>
            <Link to={to} className="block hover:opacity-90">
              <DisplayTitle as="h2" size={hasArt ? 'lg' : 'xl'} className="text-ink">
                {battle.title}
              </DisplayTitle>
            </Link>
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
            <div className="flex items-center gap-2">
              {sample.src ? (
                <PlayButton
                  size={44}
                  variant="line"
                  playing={sampleOn}
                  onClick={() => toggle(sample)}
                  label={`${t('home.listen')}: ${sample.label}`}
                />
              ) : null}
              <Link
                to={to}
                className="inline-flex h-11 items-center gap-2 bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink transition-colors hover:bg-bright"
              >
                {t('home.enter')}
                <IconChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
