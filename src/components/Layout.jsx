import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './Nav.jsx'
import Footer from './Footer.jsx'
import TransportBar from './TransportBar.jsx'
import { Grain, Vignette } from './Atmosphere.jsx'
import { usePlayback } from '../context/AppContext.jsx'

export default function Layout() {
  const { track } = usePlayback()
  const { pathname } = useLocation()

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="relative flex min-h-full flex-col">
      <Vignette />
      <Grain />
      <Nav />
      <main className="relative flex-1">
        {/* re-key on route so each page fades in cinematically */}
        <div key={pathname} className="fadein">
          <Outlet />
        </div>
      </main>
      <Footer />
      {/* spacer so the fixed transport never hides the footer */}
      <div style={{ height: track ? 64 : 0 }} />
      <TransportBar />
    </div>
  )
}
