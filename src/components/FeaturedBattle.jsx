import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from './StatusBadge.jsx'
import Waveform from './Waveform.jsx'
import { CountdownInline } from './Countdown.jsx'
import { STATUS, STATUS_LABEL, countdownTarget } from '../data/status.js'
import { kindCopy } from '../data/kind.js'
import KindBadge from './KindBadge.jsx'

// The hero "now playing" release on the landing page — one battle, large.
export default function FeaturedBattle({ battle }) {
  const { battleSubmissions } = useApp()
  const { ts, label } = countdownTarget(battle)
  const subs = battleSubmissions(battle.id).length
  const live = battle.status === STATUS.VOTING_PHASE
  const cat = `SMPL·${battle.id.toUpperCase()}`
  const c = kindCopy(battle.kind)

  return (
    <Link
      to={`/battles/${battle.id}`}
      className="group relative isolate block overflow-hidden border border-line bg-panel transition-colors duration-500 hover:border-line-bright"
    >
      <span className="hover-bloom" aria-hidden="true" />

      <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* left — editorial copy */}
        <div className="flex flex-col justify-between gap-10 p-7 sm:p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <StatusBadge status={battle.status} size="md" />
              <KindBadge kind={battle.kind} size="sm" />
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-faint sm:inline">
                Featured release
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{cat}</span>
          </div>

          <div>
            <h3 className="font-sans text-[clamp(2.6rem,6vw,5rem)] font-bold uppercase leading-[0.82] tracking-tighter transition-transform duration-700 group-hover:translate-x-1">
              {battle.title}
            </h3>
            <div className="mt-5 font-mono text-[12px] tracking-[0.04em] text-muted">
              <span className="text-faint">{c.sourceLabel}:</span>{' '}
              <span className="text-ink-dim">
                {battle.sampleRevealed ? `${battle.sampleArtist} / ${battle.sampleSong}` : '[ SEALED ]'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex gap-8">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{label}</div>
                <div className="mt-1.5 font-mono text-lg text-ink">
                  <CountdownInline to={ts} />
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{c.competitorTitle}</div>
                <div className="mt-1.5 font-mono text-lg text-ink tnum">
                  {battle.signups.length}
                  <span className="text-faint">/{battle.maxProducers}</span>
                  {subs ? <span className="text-muted"> · {subs}</span> : null}
                </div>
              </div>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted transition-all duration-500 group-hover:tracking-[0.34em] group-hover:text-ink">
              Enter battle ▸
            </span>
          </div>
        </div>

        {/* right — large waveform plate */}
        <div className="relative flex min-h-[220px] flex-col justify-between border-t border-line p-7 sm:p-10 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
            <span>{live ? 'Voting open' : STATUS_LABEL[battle.status]}</span>
            <span>{battle.attendees.length} in the room</span>
          </div>
          <Waveform
            seed={`feat-${battle.id}`}
            progress={0}
            bars={96}
            height={120}
            animated={live}
            baseClass="bg-line-bright transition-colors duration-500 group-hover:bg-muted"
          />
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
            One {c.sourceLabel.toLowerCase()} · {battle.signups.length} {c.drops}
          </div>
        </div>
      </div>
    </Link>
  )
}
