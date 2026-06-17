import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import BattleCard from '../components/BattleCard.jsx'
import FeaturedBattle from '../components/FeaturedBattle.jsx'
import Waveform from '../components/Waveform.jsx'
import Reveal from '../components/Reveal.jsx'
import { DustField } from '../components/Atmosphere.jsx'
import { Btn } from '../components/ui.jsx'
import { STATUS_GROUP } from '../data/status.js'
import { useT } from '../i18n/index.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { AnnouncementSection } from '../components/AnnouncementVideo.jsx'

function Marquee() {
  const t = useT()
  const items = [
    t('landing.marquee.oneSource'),
    t('landing.marquee.infinite'),
    t('landing.marquee.beatsVerses'),
    t('landing.marquee.anonVotes'),
    t('landing.marquee.noNames'),
    t('landing.marquee.sameSample'),
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

const buildHow = (t) => [
  ['01', t('landing.how.1.title'), t('landing.how.1.body')],
  ['02', t('landing.how.2.title'), t('landing.how.2.body')],
  ['03', t('landing.how.3.title'), t('landing.how.3.body')],
  ['04', t('landing.how.4.title'), t('landing.how.4.body')],
  ['05', t('landing.how.5.title'), t('landing.how.5.body')],
]

export default function Landing() {
  const t = useT()
  const { battles } = useApp()
  const { standalone } = usePWA()
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
              <span className="text-muted">{t('landing.hero.slug')}</span>
            </div>
            <div className="hidden text-right leading-relaxed sm:block">
              {t('landing.hero.vol')}
              <br />
              {t('landing.hero.est')}
            </div>
          </div>

          {/* slogan — the major visual moment */}
          <div className="py-12">
            <h1 className="font-sans font-bold uppercase tracking-tighter text-[clamp(3rem,13.5vw,12.5rem)] leading-[0.8]">
              <span className="block">{t('landing.hero.headline1')}</span>
              <span className="block text-ink-dim">{t('landing.hero.headline2')}</span>
            </h1>
            <p className="mt-9 max-w-xl font-mono text-[13px] leading-relaxed text-muted">
              {t('landing.hero.sub')}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Btn to="/signup" variant="solid" size="lg">
                {t('landing.hero.join')}
              </Btn>
              <Btn to="/signup?role=listener" variant="ghost" size="lg">
                {t('landing.hero.listenVote')}
              </Btn>
              <Btn to="/battles" variant="dim" size="lg">
                {t('landing.hero.browse')}
              </Btn>
            </div>
          </div>

          {/* bottom — waveform + credits */}
          <div>
            <Waveform seed="hero-smpl-2026" bars={120} height={56} animated baseClass="bg-line-bright" />
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
              <span className="hidden sm:block">{t('landing.hero.standsAlone')}</span>
              <span className="sm:hidden">SMPL</span>
              <span>{t('landing.hero.scroll')}</span>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {!standalone ? <AnnouncementSection /> : null}

      {/* ============================ ACTIVE ============================ */}
      <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 sm:py-28">
        <EditorialHead
          index="01"
          kicker={t('landing.active.kicker')}
          title={t('landing.active.title')}
          live
          right={
            <Link
              to="/battles"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
            >
              {t('landing.active.all')}
            </Link>
          }
        />
        {featured ? (
          <>
            <Reveal className="mt-10">
              <FeaturedBattle battle={featured} />
            </Reveal>
            {restActive.length ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restActive.map((b, i) => (
                  <Reveal key={b.id} delay={i * 70}>
                    <BattleCard battle={b} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-10 font-mono text-sm text-muted">{t('landing.active.empty')}</p>
        )}
      </section>

      {/* ============================ UPCOMING ============================ */}
      {upcoming.length ? (
        <section className="mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 sm:pb-28">
          <EditorialHead index="02" kicker={t('landing.upcoming.kicker')} title={t('landing.upcoming.title')} />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <EditorialHead index="03" kicker={t('landing.how.kicker')} title={t('landing.how.title')} />
          <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {buildHow(t).map(([n, head, d], i) => (
              <Reveal key={n} delay={i * 70}>
                <div className="h-full bg-bg p-6 transition-colors duration-500 hover:bg-panel-2">
                  <div className="font-mono text-[12px] text-faint tnum">{n}</div>
                  <div className="mt-6 font-sans text-xl font-bold uppercase tracking-tight">{head}</div>
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
