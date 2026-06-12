import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from './StatusBadge.jsx'
import Waveform from './Waveform.jsx'
import { CountdownInline } from './Countdown.jsx'
import { STATUS, countdownTarget } from '../data/status.js'
import { kindCopy } from '../data/kind.js'
import KindBadge from './KindBadge.jsx'

export default function BattleCard({ battle }) {
  const { battleSubmissions } = useApp()
  const { ts, label } = countdownTarget(battle)
  const subs = battleSubmissions(battle.id).length
  const attendees = battle.attendees.length
  const live = battle.status === STATUS.VOTING_PHASE
  const c = kindCopy(battle.kind)

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
      </div>

      {/* title + sample */}
      <div className="relative px-5 pt-6 pb-5">
        <h3 className="font-sans text-[2rem] font-bold uppercase leading-[0.88] tracking-tight transition-transform duration-500 group-hover:translate-x-0.5">
          {battle.title}
        </h3>
        <div className="mt-3 truncate font-mono text-[11px] tracking-[0.04em] text-muted">
          <span className="text-faint">{c.sourceLabel} —</span>{' '}
          {battle.sampleRevealed ? (
            <span className="text-ink-dim">
              {battle.sampleArtist} / {battle.sampleSong}
            </span>
          ) : (
            <span className="text-ink-dim">[ SEALED ]</span>
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
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{label}</div>
          <div className="mt-1.5 font-mono text-[15px] text-ink">
            <CountdownInline to={ts} />
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{c.competitorTitle}</div>
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
          {attendees} in the room
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted transition-all duration-500 group-hover:tracking-[0.32em] group-hover:text-ink">
          Enter ▸
        </span>
      </div>
    </Link>
  )
}
