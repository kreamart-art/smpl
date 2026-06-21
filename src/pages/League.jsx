import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'
import LeagueBoard from '../components/LeagueBoard.jsx'
import { Btn } from '../components/ui.jsx'

// The Guess-the-Sample league as its own destination (bottom-bar League tab).
export default function League() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b border-line pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('league.eyebrow')}</div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="font-sans text-[clamp(1.8rem,6vw,3rem)] font-bold uppercase leading-none tracking-tighter">
            {t('league.title')}
          </h1>
          <Link
            to="/game"
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
          >
            {t('league.playCta')} →
          </Link>
        </div>
        <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-muted">{t('league.pageSub')}</p>
      </div>

      <div className="mt-8">
        <LeagueBoard />
      </div>

      <div className="mt-8">
        <Btn to="/game" variant="accent" size="lg">
          {t('league.playCta')}
        </Btn>
      </div>
    </div>
  )
}
