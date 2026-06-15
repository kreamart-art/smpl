import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from './StatusBadge.jsx'
import Waveform from './Waveform.jsx'
import { CountdownInline } from './Countdown.jsx'
import { STATUS, countdownTarget } from '../data/status.js'
import { kindCopy } from '../data/kind.js'
import KindBadge from './KindBadge.jsx'
import { useT } from '../i18n/index.jsx'

// Map a status to its countdown-caption key (countdownTarget() returns English).
const CD_KEY = {
  [STATUS.ANNOUNCED]: 'battles.card.cd.signupOpens',
  [STATUS.OPEN_FOR_SIGNUP]: 'battles.card.cd.signupCloses',
  [STATUS.SUBMISSION_PHASE]: 'battles.card.cd.submissionsClose',
  [STATUS.VOTING_PHASE]: 'battles.card.cd.votingCloses',
  [STATUS.WINNER_DECLARED]: 'battles.card.cd.closed',
}

export default function BattleCard({ battle }) {
  const t = useT()
  const { battleSubmissions, getUser } = useApp()
  const host = getUser(battle.curatorId)
  const isCommunity = !!host && host.role !== 'curator'
  const { ts } = countdownTarget(battle)
  const subs = battleSubmissions(battle.id).length
  const attendees = battle.attendees.length
  const live = battle.status === STATUS.VOTING_PHASE
  const c = kindCopy(battle.kind)
  const isVerses = battle.kind === 'VERSES'
  const cdLabel = t(CD_KEY[battle.status] || 'battles.card.cd.closed')
  const sourceLabel = t(isVerses ? 'battles.card.beat' : 'battles.card.sample')
  const competitorTitle = t(isVerses ? 'battles.card.artists' : 'battles.card.producers')

  return (
    <Link
      to={`/battles/${battle.id}`}
      className="group relative isolate block border border-line bg-panel transition-colors duration-500 hover:border-line-bright"
    >
      <span className="hover-bloom" aria-hidden="true" />

      {/* catalogue / status header */}
      <div className="relative flex flex-wrap items-center gap-2 px-5 pt-5">
        <StatusBadge status={battle.status} size="sm" />
        <KindBadge kind={battle.kind} size="sm" />
        {battle.blind ? (
          <span className="border border-line-bright px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink">
            ◈ {t('battleDetail.blindBadge')}
          </span>
        ) : null}
        {isCommunity ? (
          <span className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            {t('host.community')}
          </span>
        ) : null}
      </div>

      {/* title + sample */}
      <div className="relative px-5 pt-6 pb-5">
        <h3 className="font-sans text-[2rem] font-bold uppercase leading-[0.88] tracking-tight transition-transform duration-500 group-hover:translate-x-0.5">
          {battle.title}
        </h3>
        <div className="mt-3 truncate font-mono text-[11px] tracking-[0.04em] text-muted">
          <span className="text-faint">{sourceLabel}:</span>{' '}
          {battle.sampleRevealed ? (
            <span className="text-ink-dim">
              {battle.sampleArtist} / {battle.sampleSong}
            </span>
          ) : (
            <span className="text-ink-dim">{t('battles.card.sealed')}</span>
          )}
        </div>
      </div>

      {/* waveform */}
      <div className="relative px-5">
        <Waveform
          seed={`card-${battle.id}`}
          progress={0}
          bars={68}
          height={44}
          animated={live}
          baseClass="bg-line-bright transition-colors duration-500 group-hover:bg-muted"
        />
      </div>

      {/* meta grid (preserved): countdown + producers */}
      <div className="relative mt-5 grid grid-cols-2 border-t border-line">
        <div className="border-r border-line px-5 py-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{cdLabel}</div>
          <div className="mt-1.5 font-mono text-[15px] text-ink">
            <CountdownInline to={ts} />
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{competitorTitle}</div>
          <div className="mt-1.5 font-mono text-[15px] text-ink tnum">
            {battle.signups.length}
            <span className="text-faint">/{battle.maxProducers}</span>
            {subs ? <span className="text-muted"> · {subs}</span> : null}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="relative flex items-center justify-between border-t border-line px-5 py-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {t('battles.card.inRoom', { n: attendees })}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted transition-all duration-500 group-hover:tracking-[0.32em] group-hover:text-ink">
          {t('battles.card.enter')}
        </span>
      </div>
    </Link>
  )
}
