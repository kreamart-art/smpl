import { NavLink, useLocation } from 'react-router-dom'
import { useRef, useState, useLayoutEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconTrophy, IconFeed, IconUser, IconPeople, IconGamepad } from './icons.jsx'

function Tab({ to, label, icon, tourKey }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      data-tour={tourKey}
      className={({ isActive }) =>
        `tab-pill-item relative z-10 flex flex-1 items-center justify-center py-1.5 transition-colors duration-200 ${
          isActive ? 'text-ink' : 'text-muted'
        }`
      }
    >
      {icon}
    </NavLink>
  )
}

// Floating, pill-shaped tab bar (hovers above the bottom — Instagram-style).
// Icons only. A single grey highlight slides from the old tab to the new one as
// you navigate (it measures the active tab and eases to its box).
export default function BottomTabBar() {
  const { currentUser } = useApp()
  const t = useT()
  const { pathname } = useLocation()
  const trackRef = useRef(null)
  const [ind, setInd] = useState(null)
  const profileTo = currentUser ? `/profile/${encodeURIComponent(currentUser.alias)}` : '/login'

  useLayoutEffect(() => {
    const el = trackRef.current?.querySelector('a[aria-current="page"]')
    if (el) setInd({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight })
    else setInd(null) // no tab in the bar is active (e.g. someone else's profile)
  }, [pathname, currentUser])

  return (
    <nav
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div
        ref={trackRef}
        className="tab-pill relative flex w-full max-w-[440px] items-center gap-1 border border-line-bright bg-black/70 px-2 py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      >
        {ind ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-0 bg-ink/10 transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ left: ind.left, top: ind.top, width: ind.width, height: ind.height }}
          />
        ) : null}
        <Tab to="/battles" label={t('common.battles')} icon={<IconTrophy size={28} />} tourKey="battles" />
        <Tab to="/feed" label={t('common.feed')} icon={<IconFeed size={28} />} tourKey="feed" />
        <Tab to="/people" label={t('common.people')} icon={<IconPeople size={28} />} tourKey="people" />
        <Tab to="/play" label={t('play.nav')} icon={<IconGamepad size={28} />} tourKey="play" />
        <Tab to={profileTo} label={t('common.profile')} icon={<IconUser size={28} />} tourKey="profile" />
      </div>
    </nav>
  )
}
