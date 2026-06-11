import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import BattleCard from '../components/BattleCard.jsx'
import FeaturedBattle from '../components/FeaturedBattle.jsx'
import Waveform from '../components/Waveform.jsx'
import Reveal from '../components/Reveal.jsx'
import { DustField } from '../components/Atmosphere.jsx'
import { Btn } from '../components/ui.jsx'
import { STATUS_GROUP } from '../data/status.js'

function Marquee() {
  const items = [
    'ONE SOURCE',
    'INFINITE INTERPRETATIONS',
    'BEATS & VERSES',
    'ANONYMOUS VOTES',
    'NO NAMES TILL THE END',
    'SAME SAMPLE. DIFFERENT SOUL.',
  ]
  const line = items.join('   ·   ') + '   ·   '
  return (
    <div className="overflow-hidden border-y border-line py-3">
      <div className="marquee-track flex font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
        <span>{line.repeat(4)}</span>
        <span>{line.repeat(4)}</span>
      </div>
    </div>
  )
}

function EditorialHead({ index, kicker, title, live, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="flex items-baseline gap-4 sm:gap-6">
        <span className="font-mono text-[13px] text-faint tnum">{index}</span>
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
            {live ? <span className="block h-1.5 w-1.5 bg-ink pulse-dot" /> : null}
            {kicker}
          </div>
          <h2 className="font-sans text-[clamp(1.9rem,4.4vw,3.2rem)] font-bold uppercase leading-none tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      {right}
    </div>
  )
}

const HOW = [
  ['01', 'ANNOUNCED', 'A curator picks one source — a sample to flip or a beat to rhyme over.'],
  ['02', 'SIGNUP', 'Producers or vocalists claim a slot. Limited seats per battle.'],
  ['03', 'SUBMISSION', 'Everyone interprets the same source. Links go in.'],
  ['04', 'VOTING', 'Drops play anonymously. One vote each. No names.'],
  ['05', 'WINNER', 'The room decides. Names revealed. Soul wins.'],
]

export default function Landing() {
  const { battles } = useApp()
  const active = battles.filter((b) => STATUS_GROUP[b.status] === 'active')
  const upcoming = battles.filter((b) => STATUS_GROUP[b.status] === 'upcoming')
  const featured = active[0]
  const restActive = active.slice(1)

  return (
    <div>
      {/* ============================ HERO ============================ */}
      <section className="relative isolate overflow-hidden border-b border-line grid-bg">
        <div className="hero-bloom" aria-hidden="true" />
        <DustField count={18} />

        <div className="relative mx-auto flex min-h-[88vh] max-w-[1500px] flex-col justify-between px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
          {/* top credits — like a poster's slug line */}
          <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-faint">
            <div className="flex items-center gap-2.5">
              <span className="block h-1.5 w-1.5 bg-ink pulse-dot" />
              <span className="text-muted">Beats &amp; verses · anonymous battles</span>
            </div>
            <div className="hidden text-right leading-relaxed sm:block">
              Vol. 001
              <br />
              Est. MMXXVI
            </div>
          </div>

          {/* slogan — the major visual moment */}
          <div className="py-12">
            <h1 className="font-sans font-bold uppercase tracking-tighter text-[clamp(3rem,13.5vw,12.5rem)] leading-[0.8]">
              <span className="block">Same sample.</span>
              <span className="block text-ink-dim">Different soul.</span>
            </h1>
            <p className="mt-9 max-w-xl font-mono text-[13px] leading-relaxed text-muted">
              Curators drop one source — a sample to flip, or a beat to rhyme over. Producers and
              vocalists interpret it; the room votes blind. No names, no clout — just the work.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Btn to="/signup" variant="solid" size="lg">
                Join SMPL
              </Btn>
              <Btn to="/signup?role=listener" variant="ghost" size="lg">
                Listen + vote
              </Btn>
              <Btn to="/battles" variant="dim" size="lg">
                Browse battles ▸
              </Btn>
            </div>
          </div>

          {/* bottom — waveform + credits */}
          <div>
            <Waveform seed="hero-smpl-2026" bars={120} height={56} animated baseClass="bg-line-bright" />
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
              <span className="hidden sm:block">SMPL — the beat stands alone</span>
              <span className="sm:hidden">SMPL</span>
              <span>Scroll ▾</span>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ============================ ACTIVE ============================ */}
      <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 sm:py-28">
        <EditorialHead
          index="01"
          kicker="Live now"
          title="In session"
          live
          right={
            <Link
              to="/battles"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
            >
              All battles ▸
            </Link>
          }
        />
        {featured ? (
          <>
            <Reveal className="mt-10">
              <FeaturedBattle battle={featured} />
            </Reveal>
            {restActive.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restActive.map((b, i) => (
                  <Reveal key={b.id} delay={i * 70}>
                    <BattleCard battle={b} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-10 font-mono text-sm text-muted">No battles in session right now.</p>
        )}
      </section>

      {/* ============================ UPCOMING ============================ */}
      {upcoming.length ? (
        <section className="mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 sm:pb-28">
          <EditorialHead index="02" kicker="On the horizon" title="Upcoming" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b, i) => (
              <Reveal key={b.id} delay={i * 70}>
                <BattleCard battle={b} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="border-t border-line bg-panel">
        <div className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 sm:py-28">
          <EditorialHead index="03" kicker="The format" title="How a battle runs" />
          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {HOW.map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 70}>
                <div className="h-full bg-bg p-6 transition-colors duration-500 hover:bg-panel-2">
                  <div className="font-mono text-[12px] text-faint tnum">{n}</div>
                  <div className="mt-6 font-sans text-xl font-bold uppercase tracking-tight">{t}</div>
                  <div className="mt-3 font-mono text-[11px] leading-relaxed text-muted">{d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
