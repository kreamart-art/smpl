import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { STATUS } from '../data/status.js'
import NotificationsBell from './NotificationsBell.jsx'
import Avatar from './Avatar.jsx'

function navClass({ isActive }) {
  return [
    'font-mono text-[11px] uppercase tracking-[0.18em] px-3 py-2 border transition-colors duration-300',
    isActive ? 'border-line-bright text-ink' : 'border-transparent text-muted hover:text-ink',
  ].join(' ')
}

export default function Nav() {
  const { currentUser, isCurator, logout, battles } = useApp()
  const navigate = useNavigate()
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
          <Link to="/" className="group flex items-center gap-3" aria-label="SMPL — home">
            <img src="/logo.png" alt="SMPL" className="h-6 w-auto sm:h-7" />
            <span className="hidden font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-faint sm:block">
              same sample.
              <br />
              different soul.
            </span>
          </Link>
          <span className="hidden items-center gap-2 border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted md:flex">
            <span className="block h-1.5 w-1.5 bg-ink pulse-dot" />
            {liveCount} live
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/battles" className={navClass}>
            Battles
          </NavLink>
          <NavLink to="/people" className={(s) => `${navClass(s)} hidden sm:inline-flex`}>
            People
          </NavLink>
          {currentUser ? (
            <NavLink to="/feed" className={(s) => `${navClass(s)} hidden sm:inline-flex`}>
              Feed
            </NavLink>
          ) : null}
          {isCurator ? (
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
          ) : null}

          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 sm:gap-3 sm:pl-2">
              <NotificationsBell />
              <Link
                to={`/profile/${encodeURIComponent(currentUser.alias)}`}
                className="flex items-center gap-2 text-right"
                title="Your profile"
              >
                <div className="hidden sm:block">
                  <div className="font-mono text-[11px] leading-tight text-ink">@{currentUser.alias}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                    {currentUser.role}
                  </div>
                </div>
                <Avatar alias={currentUser.alias} src={currentUser.avatar} size={32} />
              </Link>
              <button
                onClick={onLogout}
                className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-line-bright hover:text-ink"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
              <Link
                to="/signup"
                className="whitespace-nowrap border border-ink bg-ink px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bg transition-colors duration-300 hover:bg-bright"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
