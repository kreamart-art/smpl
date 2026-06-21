import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { STATUS } from '../data/status.js'
import { useT } from '../i18n/index.jsx'
import NotificationsBell from './NotificationsBell.jsx'
import MessagesLink from './MessagesLink.jsx'
import Avatar from './Avatar.jsx'

function navClass({ isActive }) {
  return [
    'font-mono text-[11px] uppercase tracking-[0.18em] px-3 py-2 border transition-colors duration-300',
    isActive ? 'border-line-bright text-ink' : 'border-transparent text-muted hover:text-ink',
  ].join(' ')
}

export default function Nav() {
  const { currentUser, isCurator, logout, battles } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  // links that are hidden on the mobile bar — surfaced via the mobile menu
  const menuLinks = [
    ['/people', t('common.people')],
    ['/play', t('play.nav')],
    ...(currentUser ? [['/feed', t('common.feed')]] : []),
  ]
  const liveCount = battles.filter(
    (b) => b.status === STATUS.VOTING_PHASE || b.status === STATUS.SUBMISSION_PHASE,
  ).length

  const onLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link to="/" className="group flex items-center gap-3" aria-label="SMPL, home">
            <img src="/logo.png" alt="SMPL" className="logo-chrome h-6 w-auto sm:h-7" />
            <span className="hidden font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-faint sm:block">
              {t('chrome.tagline1')}
              <br />
              {t('chrome.tagline2')}
            </span>
          </Link>
          <span className="hidden items-center gap-2 border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted md:flex">
            <span className="block h-1.5 w-1.5 bg-ink pulse-dot" />
            {t('chrome.livePill', { n: liveCount })}
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/battles" className={navClass}>
            {t('common.battles')}
          </NavLink>
          <NavLink to="/people" className={(s) => `${navClass(s)} hidden sm:inline-flex`}>
            {t('common.people')}
          </NavLink>
          <NavLink to="/play" className={(s) => `${navClass(s)} hidden sm:inline-flex`}>
            {t('play.nav')}
          </NavLink>
          {currentUser ? (
            <NavLink to="/feed" className={(s) => `${navClass(s)} hidden sm:inline-flex`}>
              {t('common.feed')}
            </NavLink>
          ) : null}
          {isCurator ? (
            <NavLink to="/dashboard" className={navClass}>
              {t('common.dashboard')}
            </NavLink>
          ) : null}

          {/* mobile menu: the links hidden on the small bar (People / Game / Feed) */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center border border-line text-muted transition-colors hover:border-line-bright hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="3" width="14" height="1.5" fill="currentColor" />
                <rect x="1" y="7.25" width="14" height="1.5" fill="currentColor" />
                <rect x="1" y="11.5" width="14" height="1.5" fill="currentColor" />
              </svg>
            </button>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-40 mt-2 w-44 border border-line-bright bg-black/95 backdrop-blur-md">
                  {menuLinks.map(([to, label]) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block border-b border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors last:border-b-0 ${
                          isActive ? 'text-ink' : 'text-muted hover:text-ink'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 sm:gap-3 sm:pl-2">
              <MessagesLink />
              <NotificationsBell />
              <Link
                to={`/profile/${encodeURIComponent(currentUser.alias)}`}
                className="flex items-center gap-2 text-right"
                title={t('chrome.yourProfile')}
              >
                <div className="hidden sm:block">
                  <div className="font-mono text-[11px] leading-tight text-ink">@{currentUser.alias}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                    {t(`role.${currentUser.role}`)}
                  </div>
                </div>
                <Avatar alias={currentUser.alias} src={currentUser.avatar} size={32} />
              </Link>
              <button
                onClick={onLogout}
                className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-line-bright hover:text-ink"
              >
                {t('common.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/login" className={navClass}>
                {t('common.login')}
              </NavLink>
              <Link
                to="/signup"
                className="whitespace-nowrap border border-ink bg-ink px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bg transition-colors duration-300 hover:bg-bright"
              >
                {t('common.signup')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
