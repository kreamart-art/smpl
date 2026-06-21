import { Link } from 'react-router-dom'
import { useT } from '../i18n/index.jsx'
import Vinyl from './Vinyl.jsx'

// Pulls people into the listener-games hub from the Feed — the main place app +
// web users land, so it covers the gap where the games were only in the nav.
// One accent: the small GAMES tag.
export default function GameTeaser({ className = '' }) {
  const t = useT()
  return (
    <Link
      to="/play"
      className={`group relative flex items-center gap-4 overflow-hidden border border-line-bright bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2 ${className}`}
    >
      <span className="hover-bloom" aria-hidden="true" />
      <Vinyl size={52} spin className="relative" />
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="bg-accent px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-ink">
            {t('game.teaserTag')}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">{t('game.teaserWeekly')}</span>
        </div>
        <div className="mt-1.5 font-sans text-lg font-bold uppercase leading-none tracking-tight">{t('play.title')}</div>
        <div className="mt-1 truncate font-mono text-[11px] text-muted">{t('game.teaserSub')}</div>
      </div>
      <span className="relative shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-ink">
        {t('game.teaserCta')} →
      </span>
    </Link>
  )
}
