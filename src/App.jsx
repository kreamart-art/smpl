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
import SampleMaker from './pages/SampleMaker.jsx'
import Notifications from './pages/Notifications.jsx'
import Messages from './pages/Messages.jsx'
import SharePage from './pages/SharePage.jsx'
import ClipPage from './pages/ClipPage.jsx'
import Legal from './pages/Legal.jsx'
import Contact from './pages/Contact.jsx'
import Help from './pages/Help.jsx'
import { ForgotPassword, ResetPassword, VerifyEmail } from './pages/Recover.jsx'
import NotFound from './pages/NotFound.jsx'

function BootScreen({ error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="font-sans text-2xl font-bold tracking-[0.34em]">SMPL</div>
      {error ? (
        <>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
            Server unreachable
          </div>
          <p className="max-w-xs font-mono text-[11px] leading-relaxed text-faint">{error}</p>
        </>
      ) : (
        <div className="flex items-end gap-1.5" aria-label="loading">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="wave-bar block h-4 w-[3px] bg-line-bright"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}
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
        <Route path="/clip/:id" element={<ClipPage />} />
        <Route path="/profile/:alias" element={<Profile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:alias" element={<Messages />} />
        <Route path="/people" element={<People />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/sample-maker" element={<SampleMaker />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
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
