import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import Nav from './Nav.jsx'
import Footer from './Footer.jsx'
import TransportBar from './TransportBar.jsx'
import AppTopBar from './AppTopBar.jsx'
import BottomTabBar, { TAB_BAR_H } from './BottomTabBar.jsx'
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
  '/home': 'Home: SMPL',
  '/battles': 'Arena: SMPL',
  '/discover': 'Discover: SMPL',
  '/journal': 'Journal: SMPL',
  '/feed': 'Feed: SMPL',
  '/people': 'People: SMPL',
  '/game': 'Guess the Sample: SMPL',
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
  '/create/track': 'Upload a track: SMPL',
  '/create/release': 'Publish a release: SMPL',
  '/create/video': 'Upload a video: SMPL',
  '/journal/desk': 'Journal desk: SMPL',
  '/journal/write': 'Write: SMPL Journal',
}
function pageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/profile/')) {
    const a = decodeURIComponent(pathname.split('/')[2] || '')
    return a ? `@${a}: SMPL` : 'Profile: SMPL'
  }
  if (pathname.startsWith('/battles/')) return 'Battle: SMPL'
  // the page itself names the track, release or story once it has loaded
  if (pathname.startsWith('/track/')) return 'Track: SMPL'
  if (pathname.startsWith('/release/')) return 'Release: SMPL'
  if (pathname.startsWith('/clip/')) return 'Clip: SMPL'
  if (pathname.startsWith('/journal/')) return 'Journal: SMPL'
  return 'SMPL: Same sample. Different soul.'
}

// while a page's code loads: the same five bars as the boot screen, quietly
function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="loading">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wave-bar block h-4 w-[3px] bg-muted" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  )
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
    // leave room for the tab bar (+ the mini player when something is loaded)
    const pad = (track ? 64 : 0) + TAB_BAR_H + 16
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
              <Suspense fallback={<RouteLoading />}>
                <Outlet />
              </Suspense>
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
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
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
