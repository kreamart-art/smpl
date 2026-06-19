import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './Nav.jsx'
import Footer from './Footer.jsx'
import TransportBar from './TransportBar.jsx'
import AppTopBar from './AppTopBar.jsx'
import BottomTabBar from './BottomTabBar.jsx'
import WelcomeTour from './Tour.jsx'
import PasswordSetupPrompt from './PasswordSetupPrompt.jsx'
import InstallBanner from './InstallBanner.jsx'
import VerifyEmailBanner from './VerifyEmailBanner.jsx'
import PushPrompt from './PushPrompt.jsx'
import PullToRefresh from './PullToRefresh.jsx'
import Toast from './Toast.jsx'
import NativeBoot from './NativeBoot.jsx'
import { Grain, Vignette } from './Atmosphere.jsx'
import { usePlayback } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { AnnouncementPopup } from './AnnouncementVideo.jsx'

// Per-route <title> — unique titles help search results + the browser tab.
const PAGE_TITLES = {
  '/': 'SMPL: Beat & Verse Battles · Same sample. Different soul.',
  '/battles': 'Battles: SMPL',
  '/feed': 'Feed: SMPL',
  '/people': 'People: SMPL',
  '/signup': 'Join SMPL: Beat & Verse Battles',
  '/login': 'Log in: SMPL',
  '/contact': 'Contact: SMPL',
  '/help': 'How SMPL works: Help',
  '/privacy': 'Privacy Policy: SMPL',
  '/terms': 'Terms of Use: SMPL',
  '/guidelines': 'Community Guidelines: SMPL',
  '/copyright': 'Copyright: SMPL',
  '/settings': 'Settings: SMPL',
  '/dashboard': 'Dashboard: SMPL',
  '/messages': 'Messages: SMPL',
  '/notifications': 'Notifications: SMPL',
}
function pageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/profile/')) {
    const a = decodeURIComponent(pathname.split('/')[2] || '')
    return a ? `@${a}: SMPL` : 'Profile: SMPL'
  }
  if (pathname.startsWith('/battles/')) return 'Battle: SMPL'
  return 'SMPL: Same sample. Different soul.'
}

export default function Layout() {
  const { track } = usePlayback()
  const { standalone } = usePWA()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = pageTitle(pathname)
  }, [pathname])

  // ---------- installed app shell (Instagram-style) ----------
  if (standalone) {
    // inside a DM conversation the composer owns the bottom — hide the tab bar
    // (and transport) so only the typing bar shows. The inbox keeps the bar.
    const inThread = /^\/messages\/.+/.test(pathname)
    // leave room for the floating tab bar (+ the transport when playing)
    const pad = (track ? 64 : 0) + 86
    return (
      <div className="relative flex min-h-full flex-col">
        <Vignette />
        <Grain />
        <AppTopBar />
        <Toast />
        <NativeBoot />
        <PushPrompt />
        <VerifyEmailBanner />
        <main
          className="relative flex-1"
          style={{ paddingBottom: inThread ? 0 : `calc(${pad}px + env(safe-area-inset-bottom))` }}
        >
          <PullToRefresh>
            <div key={pathname} className="fadein">
              <Outlet />
            </div>
          </PullToRefresh>
        </main>
        {!inThread ? <TransportBar /> : null}
        {!inThread ? <BottomTabBar /> : null}
        <AnnouncementPopup />
        {!inThread ? <WelcomeTour /> : null}
        <PasswordSetupPrompt />
      </div>
    )
  }

  // ---------- website ----------
  return (
    <div className="relative flex min-h-full flex-col">
      <Vignette />
      <Grain />
      <Nav />
      <Toast />
      <NativeBoot />
      <PushPrompt />
      <VerifyEmailBanner />
      <main className="relative flex-1">
        <div key={pathname} className="fadein">
          <Outlet />
        </div>
      </main>
      <Footer />
      <div style={{ height: track ? 64 : 0 }} />
      <TransportBar />
      <InstallBanner />
      <PasswordSetupPrompt />
    </div>
  )
}
