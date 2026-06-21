import { useRef, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useApp } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Battles from './pages/Battles.jsx'
import BattleDetail from './pages/BattleDetail.jsx'
import Profile from './pages/Profile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Feed from './pages/Feed.jsx'
import People from './pages/People.jsx'
import Settings from './pages/Settings.jsx'
import EditProfile from './pages/EditProfile.jsx'
import LinksManager from './pages/LinksManager.jsx'
import GenderPicker from './pages/GenderPicker.jsx'
import GenrePicker from './pages/GenrePicker.jsx'
import SampleMaker from './pages/SampleMaker.jsx'
import Notifications from './pages/Notifications.jsx'
import Messages from './pages/Messages.jsx'
import SharePage from './pages/SharePage.jsx'
import ClipPage from './pages/ClipPage.jsx'
import Legal from './pages/Legal.jsx'
import Contact from './pages/Contact.jsx'
import Help from './pages/Help.jsx'
import Game from './pages/Game.jsx'
import Play from './pages/Play.jsx'
import { ForgotPassword, ResetPassword, VerifyEmail } from './pages/Recover.jsx'
import AuthMagic from './pages/AuthMagic.jsx'
import NotFound from './pages/NotFound.jsx'

function BootScreen({ error }) {
  const vref = useRef(null)
  useEffect(() => {
    const v = vref.current
    if (!v) return
    v.muted = true // belt-and-suspenders: guarantees muted autoplay on iOS
    const p = v.play?.()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }, [])

  // server unreachable → a still, legible message (no looping intro behind it)
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
        <img src="/logo.png" alt="SMPL" className="logo-chrome h-6 w-auto" />
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">Server unreachable</div>
        <p className="max-w-xs font-mono text-[11px] leading-relaxed text-faint">{error}</p>
      </div>
    )
  }

  // loading → the SMPL intro plays muted full-screen; its motion IS the loader,
  // with the wave-bars kept as a subtle indicator beneath it.
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-bg">
      <video
        ref={vref}
        className="absolute inset-0 h-full w-full object-cover"
        src="/intro.mp4"
        poster="/intro-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 flex items-end justify-center gap-1.5"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8vh)' }}
        aria-label="loading"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="wave-bar block h-4 w-[3px] bg-bright"
            style={{ animationDelay: `${i * 0.12}s`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { loading, error } = useApp()
  if (loading) return <BootScreen />
  if (error) return <BootScreen error={error} />

  return (
    <Routes>
      {/* full-bleed, no chrome — a shareable poster */}
      <Route path="/share/:kind/:id" element={<SharePage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/battles" element={<Battles />} />
        <Route path="/battles/:id" element={<BattleDetail />} />
        <Route path="/game" element={<Game />} />
        <Route path="/play" element={<Play />} />
        <Route path="/clip/:id" element={<ClipPage />} />
        <Route path="/profile/:alias" element={<Profile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:alias" element={<Messages />} />
        <Route path="/people" element={<People />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/gender" element={<GenderPicker />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/edit-profile/links" element={<LinksManager />} />
        <Route path="/edit-profile/genres" element={<GenrePicker />} />
        <Route path="/sample-maker" element={<SampleMaker />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/magic" element={<AuthMagic />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/privacy" element={<Legal doc="privacy" />} />
        <Route path="/terms" element={<Legal doc="terms" />} />
        <Route path="/guidelines" element={<Legal doc="guidelines" />} />
        <Route path="/copyright" element={<Legal doc="copyright" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
