import { Link } from 'react-router-dom'
import { useT } from '../i18n/index.jsx'

const PHASES = [
  'status.ANNOUNCED',
  'status.OPEN_FOR_SIGNUP',
  'status.SUBMISSION_PHASE',
  'status.VOTING_PHASE',
  'status.WINNER_DECLARED',
]

export default function Footer() {
  const t = useT()
  return (
    <footer className="relative mt-28 border-t border-line">
      <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">
          {t('chrome.footer.masthead')}
        </div>
        <div className="mt-8 font-sans text-[clamp(2.6rem,11vw,9rem)] font-bold uppercase leading-[0.82] tracking-tighter">
          {t('chrome.footer.sameSample')}
          <br />
          <span className="text-ink-dim">{t('chrome.footer.differentSoul')}</span>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-8 border-t border-line pt-8 sm:grid-cols-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{t('chrome.footer.platform')}</div>
            <div className="mt-4 flex flex-col gap-2.5 font-mono text-xs">
              <Link to="/battles" className="text-ink-dim transition-colors hover:text-ink">{t('common.battles')}</Link>
              <Link to="/people" className="text-ink-dim transition-colors hover:text-ink">{t('common.people')}</Link>
              <Link to="/signup" className="text-ink-dim transition-colors hover:text-ink">{t('common.signup')}</Link>
              <Link to="/login" className="text-ink-dim transition-colors hover:text-ink">{t('common.login')}</Link>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{t('chrome.footer.phases')}</div>
            <div className="mt-4 flex flex-col gap-2.5 font-mono text-xs text-muted">
              {PHASES.map((key, i) => (
                <span key={key}>
                  {String(i + 1).padStart(2, '0')} / {t(key)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{t('chrome.footer.ethos')}</div>
            <div className="mt-4 font-mono text-xs leading-relaxed text-muted">
              {t('chrome.footer.ethosBody')}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{t('chrome.footer.colophon')}</div>
            <div className="mt-4 font-mono text-xs leading-relaxed text-muted">
              {t('chrome.footer.colophonVersion')}
              <br />
              {t('chrome.footer.colophonBuild')}
              <br />
              {t('chrome.footer.colophonPalette')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
