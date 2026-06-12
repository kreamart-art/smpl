import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './Nav.jsx'
import Footer from './Footer.jsx'
import TransportBar from './TransportBar.jsx'
import AppTopBar from './AppTopBar.jsx'
import BottomTabBar from './BottomTabBar.jsx'
import InstallBanner from './InstallBanner.jsx'
import VerifyEmailBanner from './VerifyEmailBanner.jsx'
import PushPrompt from './PushPrompt.jsx'
import PullToRefresh from './PullToRefresh.jsx'
import { Grain, Vignette } from './Atmosphere.jsx'
import { usePlayback } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'

export default function Layout() {
  const { track } = usePlayback()
  const { standalone } = usePWA()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // ---------- installed app shell (Instagram-style) ----------
  if (standalone) {
    // leave room for the floating tab bar (+ the transport when playing)
    const pad = (track ? 64 : 0) + 86
    return (
      <div className="relative flex min-h-full flex-col">
        <Vignette />
        <Grain />
        <AppTopBar />
        <PushPrompt />
        <VerifyEmailBanner />
        <main
          className="relative flex-1"
          style={{ paddingBottom: `calc(${pad}px + env(safe-area-inset-bottom))` }}
        >
          <PullToRefresh>
            <div key={pathname} className="fadein">
              <Outlet />
            </div>
          </PullToRefresh>
        </main>
        <TransportBar />
        <BottomTabBar />
      </div>
    )
  }

  // ---------- website ----------
  return (
    <div className="relative flex min-h-full flex-col">
      <Vignette />
      <Grain />
      <Nav />
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
    </div>
  )
}
