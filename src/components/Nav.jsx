import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { STATUS } from '../data/status.js'
import { useT } from '../i18n/index.jsx'
import NotificationsBell from './NotificationsBell.jsx'
import MessagesLink from './MessagesLink.jsx'
import Avatar from './Avatar.jsx'
import CreateSheet from './CreateSheet.jsx'
import { IconPlus, IconLogout } from './icons.jsx'

function navClass({ isActive }) {
  return [
    'font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-2 border-b-2 transition-colors duration-300',
    isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
  ].join(' ')
}

// Website header: the same sections as the app's tab bar (Home / Arena /
// Discover + Create), with messages, alerts and the account on the right.
export default function Nav() {
  const { currentUser, isCurator, logout, battles } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const sections = [
    ...(currentUser ? [['/home', t('nav.home')]] : []),
    ['/battles', t('nav.arena')],
    ['/discover', t('nav.discover')],
    ['/journal', t('journal.title')],
    ['/play', t('play.nav')],
  ]
  const liveCount = battles.filter(
    (b) => b.status === STATUS.VOTING_PHASE || b.status === STATUS.SUBMISSION_PHASE,
  ).length

  const onLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-chrome backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to={currentUser ? '/home' : '/'} className="group flex items-center gap-3" aria-label="SMPL, home">
            <img src="/logo.png" alt="SMPL" className="logo-chrome h-6 w-auto sm:h-7" />
          </Link>
          <nav aria-label={t('nav.label')} className="hidden items-center gap-1 md:flex">
            {sections.map(([to, label]) => (
              <NavLink key={to} to={to} className={navClass}>
                {label}
              </NavLink>
            ))}
            {isCurator ? (
              <NavLink to="/dashboard" className={navClass}>
                {t('common.dashboard')}
              </NavLink>
            ) : null}
          </nav>
          <span className="hidden items-center gap-2 border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted xl:flex">
            <span className="block h-1.5 w-1.5 bg-accent pulse-dot" />
            {t('chrome.livePill', { n: liveCount })}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-haspopup="dialog"
              className="hidden h-9 items-center gap-2 bg-paper px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink transition-colors hover:bg-bright sm:inline-flex"
            >
              <IconPlus size={15} />
              {t('nav.create')}
            </button>
          ) : null}

          {/* small screens: the sections live in a menu */}
          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t('nav.menu')}
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
                <div className="absolute right-0 top-full z-40 mt-2 w-52 border border-line-bright bg-panel">
                  {[...sections, ...(currentUser ? [['/feed', t('common.feed')]] : []), ...(isCurator ? [['/dashboard', t('common.dashboard')]] : [])].map(
                    ([to, label]) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `block border-b border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                            isActive ? 'text-ink' : 'text-muted hover:text-ink'
                          }`
                        }
                      >
                        {label}
                      </NavLink>
                    ),
                  )}
                  {currentUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setCreateOpen(true)
                        }}
                        className="block w-full border-b border-line px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-ink"
                      >
                        + {t('nav.create')}
                      </button>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="block w-full px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink"
                      >
                        {t('common.logout')}
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <MessagesLink />
              <NotificationsBell />
              <Link
                to={`/profile/${encodeURIComponent(currentUser.alias)}`}
                className="flex items-center gap-2 text-right"
                title={t('chrome.yourProfile')}
              >
                <div className="hidden lg:block">
                  <div className="font-mono text-[11px] leading-tight text-ink">@{currentUser.alias}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                    {t(`role.${currentUser.role}`)}
                  </div>
                </div>
                <Avatar alias={currentUser.alias} src={currentUser.avatar} size={32} />
              </Link>
              <button
                type="button"
                onClick={onLogout}
                aria-label={t('common.logout')}
                title={t('common.logout')}
                className="hidden h-9 w-9 items-center justify-center border border-line text-muted transition-colors hover:border-line-bright hover:text-ink md:flex"
              >
                <IconLogout size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/login" className={navClass}>
                {t('common.login')}
              </NavLink>
              <Link
                to="/signup"
                className="whitespace-nowrap bg-paper px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink transition-colors duration-300 hover:bg-bright"
              >
                {t('common.signup')}
              </Link>
            </div>
          )}
        </div>
      </div>
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </header>
  )
}
