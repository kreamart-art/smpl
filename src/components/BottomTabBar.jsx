import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { IconBattles, IconFeed, IconBell, IconUser, IconPeople } from './icons.jsx'

function Tab({ to, label, icon, badge, tourKey }) {
  return (
    <NavLink to={to} className="flex-1" data-tour={tourKey}>
      {({ isActive }) => (
        <div
          className={`tab-pill-item flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 ${
            isActive ? 'bg-ink/10 text-ink' : 'text-muted'
          }`}
        >
          <span className="relative">
            {icon}
            {badge ? (
              <span className="absolute -right-2 -top-1.5 min-w-[15px] border border-black bg-ink px-1 text-center font-mono text-[8px] leading-[13px] text-bg">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em]">{label}</span>
        </div>
      )}
    </NavLink>
  )
}

// Floating, pill-shaped tab bar (hovers above the bottom — Instagram-style).
export default function BottomTabBar() {
  const { currentUser, unread } = useApp()
  const t = useT()
  const profileTo = currentUser ? `/profile/${encodeURIComponent(currentUser.alias)}` : '/login'

  return (
    <nav
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="tab-pill flex w-full max-w-[440px] items-center gap-1 border border-line-bright bg-black/70 px-2 py-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <Tab to="/battles" label={t('common.battles')} icon={<IconBattles size={20} />} tourKey="battles" />
        <Tab to="/feed" label={t('common.feed')} icon={<IconFeed size={20} />} tourKey="feed" />
        <Tab to="/people" label={t('common.people')} icon={<IconPeople size={20} />} tourKey="people" />
        <Tab to="/notifications" label={t('common.alerts')} icon={<IconBell size={20} />} badge={unread} tourKey="alerts" />
        <Tab to={profileTo} label={t('common.profile')} icon={<IconUser size={20} />} tourKey="profile" />
      </div>
    </nav>
  )
}
