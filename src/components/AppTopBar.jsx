import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import MessagesLink from './MessagesLink.jsx'
import { IconBell } from './icons.jsx'

// Minimal app header (standalone mode): DMs on the left, alerts on the right,
// wordmark in the middle. No login/logout chrome — that lives under Profile.
export default function AppTopBar() {
  const { unread } = useApp()

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center justify-between px-4">
        <span className="flex w-12 items-center" data-tour="messages">
          <MessagesLink />
        </span>
        <Link to="/battles" aria-label="SMPL, home">
          <img src="/logo.png" alt="SMPL" className="logo-chrome h-5 w-auto" />
        </Link>
        <span className="flex w-12 items-center justify-end" data-tour="alerts">
          <Link to="/notifications" aria-label="Alerts" title="Alerts" className="relative inline-flex items-center text-ink">
            <IconBell size={20} />
            {unread ? (
              <span className="absolute -right-2 -top-1.5 min-w-[15px] border border-black bg-accent px-1 text-center font-mono text-[8px] leading-[13px] text-bg">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Link>
        </span>
      </div>
    </header>
  )
}
