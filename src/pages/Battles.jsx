import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import BattleHero from '../components/BattleHero.jsx'
import { BattleRow, rankBattles, kindKey } from '../components/BattleRow.jsx'
import { SectionHead, Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import Vinyl from '../components/Vinyl.jsx'
import { IconChevronRight } from '../components/icons.jsx'

const LIVE = new Set([STATUS.VOTING_PHASE, STATUS.SUBMISSION_PHASE])
const KINDS = ['all', 'BEATS', 'VERSES']

// The Arena: every battle, the one that matters now up front, then what's live,
// what's coming and the archive. Games live here too (Play).
export default function Battles() {
  const t = useT()
  const { battles } = useApp()
  const [kind, setKind] = useState('all')

  const list = useMemo(
    () => battles.filter((b) => kind === 'all' || (b.kind || 'BEATS') === kind),
    [battles, kind],
  )
  const ranked = useMemo(() => rankBattles(list), [list])
  const hero = ranked[0] || null
  const live = ranked.filter((b) => LIVE.has(b.status) && b.id !== hero?.id)
  const upcoming = ranked.filter((b) => !LIVE.has(b.status) && b.id !== hero?.id)
  const past = useMemo(
    () => list.filter((b) => b.status === STATUS.WINNER_DECLARED).sort((a, b) => (b.voteEnd || 0) - (a.voteEnd || 0)),
    [list],
  )
  const toCall = battles.filter((b) => b.status === STATUS.VOTING_PHASE).length

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Kicker>{t('arena.kicker')}</Kicker>
      <DisplayTitle size="lg" className="mt-2 text-ink">
        {t('arena.title')}
      </DisplayTitle>

      <div role="tablist" aria-label={t('arena.title')} className="mt-5 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`h-9 border px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              kind === k ? 'border-paper bg-paper text-paper-ink' : 'border-line-bright text-muted hover:text-ink'
            }`}
          >
            {k === 'all' ? t('arena.filter.all') : t(kindKey(k))}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {hero ? <BattleHero battle={hero} kicker={t('arena.sceneNow')} /> : <EmptyState title={t('home.noBattles')} />}
      </div>

      <Link
        to="/play"
        className="group mt-8 flex items-center gap-4 border border-line-bright bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2"
      >
        <Vinyl size={48} spin />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-sans text-lg font-semibold text-ink">{t('arena.play')}</span>
            {toCall ? (
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-ink">
                {toCall === 1 ? t('arena.callNowOne') : t('arena.callNow', { n: toCall })}
              </span>
            ) : null}
          </div>
          <div className="truncate font-sans text-[13px] text-muted">{t('arena.playSub')}</div>
        </div>
        <IconChevronRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
      </Link>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {live.length ? (
          <section>
            <SectionHead title={t('arena.live')} />
            <div className="mt-1">
              {live.map((b) => (
                <BattleRow key={b.id} battle={b} />
              ))}
            </div>
          </section>
        ) : null}
        {upcoming.length ? (
          <section>
            <SectionHead title={t('arena.upcoming')} />
            <div className="mt-1">
              {upcoming.map((b) => (
                <BattleRow key={b.id} battle={b} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <section className="mt-10">
        <SectionHead title={t('arena.archive')} />
        {past.length ? (
          <div className="mt-1 grid grid-cols-1 gap-x-10 lg:grid-cols-2">
            {past.map((b) => (
              <BattleRow key={b.id} battle={b} />
            ))}
          </div>
        ) : (
          <EmptyState className="mt-4" title={kind === 'all' ? t('arena.archiveEmpty') : t('arena.empty')} />
        )}
      </section>
    </div>
  )
}
