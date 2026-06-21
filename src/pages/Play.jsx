import { Link } from 'react-router-dom'
import { useT } from '../i18n/index.jsx'
import Vinyl from '../components/Vinyl.jsx'
import VUMeter from '../components/VUMeter.jsx'
import TopCallers from '../components/TopCallers.jsx'
import LeagueBoard from '../components/LeagueBoard.jsx'
import { PlayTour } from '../components/Tour.jsx'
import { Btn } from '../components/ui.jsx'
import { IconLeague } from '../components/icons.jsx'

// "Play" — the games hub. One place for both games (Guess the Sample + Predict
// the winner) and both boards (the level league + the predict callers).
export default function Play() {
  const t = useT()

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-14 sm:px-6 sm:py-20">
      <PlayTour />
      <div className="border-b border-line pb-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
            {t('play.title')}
          </h1>
          <Link
            to="/league"
            aria-label={t('league.title')}
            title={t('league.title')}
            className="flex shrink-0 items-center gap-2 border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:bg-panel"
          >
            <IconLeague size={16} />
            <span>{t('league.title')}</span>
          </Link>
        </div>
        <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-muted">{t('play.sub')}</p>
      </div>

      {/* the two games */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div data-tour="play-game" className="group relative flex flex-col overflow-hidden border border-line bg-panel p-6">
          <span className="hover-bloom" aria-hidden="true" />
          <div className="relative">
            <Vinyl size={64} spin />
          </div>
          <h2 className="relative mt-5 font-sans text-xl font-bold uppercase tracking-tight">{t('game.title')}</h2>
          <p className="relative mt-2 flex-1 font-mono text-[12px] leading-relaxed text-muted">{t('play.gameSub')}</p>
          <div className="relative mt-5">
            <Btn to="/game" variant="accent">
              {t('play.playGame')}
            </Btn>
          </div>
        </div>

        <div data-tour="play-predict" className="group relative flex flex-col overflow-hidden border border-line bg-panel p-6">
          <span className="hover-bloom" aria-hidden="true" />
          <div className="relative">
            <VUMeter size={58} ambient />
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <span className="block h-1.5 w-1.5 bg-accent pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('play.predictTag')}</span>
          </div>
          <h2 className="relative mt-3 font-sans text-xl font-bold uppercase tracking-tight">{t('predict.title')}</h2>
          <p className="relative mt-2 flex-1 font-mono text-[12px] leading-relaxed text-muted">{t('play.predictSub')}</p>
          <div className="relative mt-5">
            <Btn to="/predict" variant="accent">
              {t('play.predictCta')}
            </Btn>
          </div>
        </div>
      </div>

      {/* the two boards, side by side: the level league + the predict callers */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <LeagueBoard limit={8} />
        <TopCallers limit={8} />
      </div>
    </div>
  )
}
