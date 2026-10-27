import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import Portal from './Portal.jsx'
import { Tape } from './crate.jsx'
import { IconClose, IconChevronRight, IconUpload, IconTrophy, IconUser, IconWave, IconPlus } from './icons.jsx'

function Row({ to, icon, title, sub, onClose }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-panel-2"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-bright text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-[15px] font-medium text-ink">{title}</span>
        {sub ? <span className="mt-0.5 block font-sans text-[13px] leading-snug text-muted">{sub}</span> : null}
      </span>
      <IconChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  )
}

// The (+) sheet: only actions that exist for this member, nothing that leads nowhere.
export default function CreateSheet({ open, onClose }) {
  const t = useT()
  const { currentUser, battles } = useApp()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const role = currentUser?.role
  const staff = role === 'curator' || role === 'admin'
  const maker =
    role === 'producer' || role === 'artist' || !!currentUser?.dualRole || (staff && !!currentUser?.curatorCompetes)
  const mine = currentUser
    ? battles.filter((b) => b.status === STATUS.SUBMISSION_PHASE && b.signups.includes(currentUser.id)).slice(0, 3)
    : []
  const openSignup = battles.filter((b) => b.status === STATUS.OPEN_FOR_SIGNUP).length
  const joinSub =
    openSignup === 0
      ? t('create.joinSubNone')
      : openSignup === 1
        ? t('create.joinSubOne')
        : t('create.joinSub', { n: openSignup })

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('create.title')}
          className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="paper torn-b relative shrink-0 px-5 pb-7 pt-6">
            <Tape className="-top-2 left-6" rotate={-6} />
            <Tape className="-top-2 right-10" rotate={5} style={{ width: 54 }} />
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-paper-ink transition-colors hover:bg-paper-2"
            >
              <IconClose size={18} />
            </button>
            <h2 className="t-display text-[2.6rem] text-paper-ink">{t('create.title')}</h2>
            <p className="mt-1 font-sans text-[14px] text-paper-muted">{t('create.sub')}</p>
          </div>

          <div className="overflow-y-auto">
            {!currentUser ? (
              <>
                <Row to="/signup" onClose={onClose} icon={<IconPlus size={20} />} title={t('create.joinSmpl')} sub={t('create.joinSmplSub')} />
                <Row to="/login" onClose={onClose} icon={<IconUser size={20} />} title={t('create.login')} sub={t('create.loginSub')} />
              </>
            ) : null}

            {maker
              ? mine.map((b) => (
                  <Row
                    key={b.id}
                    to={`/battles/${b.id}`}
                    onClose={onClose}
                    icon={<IconUpload size={20} />}
                    title={t('create.submitTo', { title: b.title })}
                    sub={t(`create.submitSub.${b.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)}
                  />
                ))
              : null}
            {maker ? (
              <Row to="/battles" onClose={onClose} icon={<IconTrophy size={20} />} title={t('create.join')} sub={joinSub} />
            ) : null}

            {staff ? (
              <Row
                to="/dashboard"
                onClose={onClose}
                icon={<IconPlus size={20} />}
                title={t('create.challenge')}
                sub={t('create.challengeSub')}
              />
            ) : null}

            {currentUser && !maker && !staff ? (
              <Row
                to="/settings"
                onClose={onClose}
                icon={<IconUser size={20} />}
                title={t('create.becomeMaker')}
                sub={t('create.becomeMakerSub')}
              />
            ) : null}
            {currentUser && currentUser.sampleMakerStatus !== 'approved' ? (
              <Row
                to="/sample-maker"
                onClose={onClose}
                icon={<IconWave size={20} />}
                title={t('create.sampleMaker')}
                sub={t('create.sampleMakerSub')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Portal>
  )
}
