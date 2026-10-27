import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import MessagesLink from './MessagesLink.jsx'
import { IconBell } from './icons.jsx'

// App header (standalone): the wordmark home on the left, alerts and messages
// on the right. No login/logout chrome; that lives under Profile.
export default function AppTopBar() {
  const { unread, currentUser } = useApp()
  const t = useT()

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-chrome backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center justify-between px-4">
        <Link to="/home" aria-label="SMPL, home" className="flex items-center">
          <img src="/logo.png" alt="SMPL" className="logo-chrome h-[22px] w-auto" />
        </Link>
        <div className="flex items-center gap-5">
          {currentUser ? (
            <Link
              to="/notifications"
              aria-label={t('nav.alerts')}
              title={t('nav.alerts')}
              data-tour="alerts"
              className="relative inline-flex items-center text-ink"
            >
              <IconBell size={21} />
              {unread ? (
                <span className="absolute -right-2 -top-1.5 min-w-[15px] border border-bg bg-accent px-1 text-center font-mono text-[8px] leading-[13px] text-accent-ink">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Link>
          ) : null}
          <span className="flex items-center" data-tour="messages">
            <MessagesLink />
          </span>
        </div>
      </div>
    </header>
  )
}
