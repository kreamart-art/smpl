import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconHome, IconTrophy, IconSearch, IconUser, IconPlus } from './icons.jsx'
import CreateSheet from './CreateSheet.jsx'

// Height of the bar above the safe area. Layout + TransportBar offset by it.
export const TAB_BAR_H = 60

// Which tab owns the current route (sub-pages keep their section lit).
function sectionOf(pathname, ownProfile) {
  if (pathname === '/home' || pathname === '/feed') return 'home'
  if (/^\/(battles|play|game|predict|league)(\/|$)/.test(pathname)) return 'arena'
  if (/^\/(discover|people)(\/|$)/.test(pathname)) return 'discover'
  if (pathname === ownProfile || /^\/(settings|edit-profile)(\/|$)/.test(pathname)) return 'profile'
  return null
}

function Tab({ to, label, icon, active, tourKey }) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-tour={tourKey}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 pt-1.5 transition-colors ${
        active ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {active ? <span aria-hidden="true" className="absolute inset-x-[22%] top-0 h-[2px] bg-ink" /> : null}
      {icon}
      <span className="font-mono text-[9px] uppercase tracking-[0.1em]">{label}</span>
    </Link>
  )
}

// Fixed bottom navigation of the installed app: Home / Arena / Create / Discover / Profile.
export default function BottomTabBar() {
  const { currentUser } = useApp()
  const t = useT()
  const { pathname } = useLocation()
  const [createOpen, setCreateOpen] = useState(false)
  const profileTo = currentUser ? `/profile/${encodeURIComponent(currentUser.alias)}` : '/login'
  const section = sectionOf(decodeURIComponent(pathname), currentUser ? `/profile/${currentUser.alias}` : null)

  return (
    <>
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-chrome backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-[560px] items-stretch px-1" style={{ height: TAB_BAR_H }}>
          <Tab to="/home" label={t('nav.home')} icon={<IconHome size={22} />} active={section === 'home'} tourKey="home" />
          <Tab to="/battles" label={t('nav.arena')} icon={<IconTrophy size={22} />} active={section === 'arena'} tourKey="arena" />
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label={t('nav.create')}
              aria-haspopup="dialog"
              data-tour="create"
              className="flex h-11 w-11 items-center justify-center bg-paper text-paper-ink shadow-[0_6px_18px_-6px_rgba(0,0,0,0.8)] transition-colors hover:bg-bright"
            >
              <IconPlus size={22} />
            </button>
          </div>
          <Tab
            to="/discover"
            label={t('nav.discover')}
            icon={<IconSearch size={22} />}
            active={section === 'discover'}
            tourKey="discover"
          />
          <Tab to={profileTo} label={t('nav.profile')} icon={<IconUser size={22} />} active={section === 'profile'} tourKey="profile" />
        </div>
      </nav>
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
