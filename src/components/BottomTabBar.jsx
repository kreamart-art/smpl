import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { IconBattles, IconFeed, IconBell, IconUser } from './icons.jsx'

function Tab({ to, label, icon, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
          isActive ? 'text-ink' : 'text-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            {icon}
            {badge ? (
              <span className="absolute -right-2 -top-1.5 min-w-[15px] border border-bg bg-ink px-1 text-center font-mono text-[8px] leading-[13px] text-bg">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{label}</span>
          <span className={`absolute top-0 h-[2px] w-8 ${isActive ? 'bg-ink' : 'bg-transparent'}`} />
        </>
      )}
    </NavLink>
  )
}

export default function BottomTabBar() {
  const { currentUser, unread } = useApp()
  const profileTo = currentUser ? `/profile/${encodeURIComponent(currentUser.alias)}` : '/login'

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-bright bg-black/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[600px]">
        <Tab to="/battles" label="Battles" icon={<IconBattles />} />
        <Tab to="/feed" label="Feed" icon={<IconFeed />} />
        <Tab to="/notifications" label="Alerts" icon={<IconBell />} badge={unread} />
        <Tab to={profileTo} label="Profile" icon={<IconUser />} />
      </div>
    </nav>
  )
}
