import { lazy, Suspense, useRef, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
// the core of the app loads up front; everything else loads when opened
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Battles from './pages/Battles.jsx'
import BattleDetail from './pages/BattleDetail.jsx'
import Profile from './pages/Profile.jsx'
import Discover from './pages/Discover.jsx'

const named = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Feed = lazy(() => import('./pages/Feed.jsx'))
const TrackPage = lazy(() => import('./pages/TrackPage.jsx'))
const ReleasePage = lazy(() => import('./pages/ReleasePage.jsx'))
const UploadTrack = lazy(() => import('./pages/UploadTrack.jsx'))
const PublishRelease = lazy(() => import('./pages/PublishRelease.jsx'))
const UploadVideo = lazy(() => import('./pages/UploadVideo.jsx'))
const Journal = lazy(() => import('./pages/Journal.jsx'))
const Article = lazy(() => import('./pages/Article.jsx'))
const JournalDesk = lazy(() => import('./pages/JournalDesk.jsx'))
const ArticleEditor = lazy(() => import('./pages/ArticleEditor.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const EditProfile = lazy(() => import('./pages/EditProfile.jsx'))
const LinksManager = lazy(() => import('./pages/LinksManager.jsx'))
const GenderPicker = lazy(() => import('./pages/GenderPicker.jsx'))
const GenrePicker = lazy(() => import('./pages/GenrePicker.jsx'))
const SampleMaker = lazy(() => import('./pages/SampleMaker.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const Messages = lazy(() => import('./pages/Messages.jsx'))
const SharePage = lazy(() => import('./pages/SharePage.jsx'))
const ClipPage = lazy(() => import('./pages/ClipPage.jsx'))
const Legal = lazy(() => import('./pages/Legal.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Help = lazy(() => import('./pages/Help.jsx'))
const Game = lazy(() => import('./pages/Game.jsx'))
const League = lazy(() => import('./pages/League.jsx'))
const PredictHub = named(() => import('./pages/Predict.jsx'), 'PredictHub')
const PredictBattle = named(() => import('./pages/Predict.jsx'), 'PredictBattle')
const Play = lazy(() => import('./pages/Play.jsx'))
const ForgotPassword = named(() => import('./pages/Recover.jsx'), 'ForgotPassword')
const ResetPassword = named(() => import('./pages/Recover.jsx'), 'ResetPassword')
const VerifyEmail = named(() => import('./pages/Recover.jsx'), 'VerifyEmail')
const AuthMagic = lazy(() => import('./pages/AuthMagic.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

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
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="border border-line-bright px-5 h-11 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg"
        >
          Reload
        </button>
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
      <Route
        path="/share/:kind/:id"
        element={
          <Suspense fallback={null}>
            <SharePage />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/track/:id" element={<TrackPage />} />
        <Route path="/release/:id" element={<ReleasePage />} />
        <Route path="/create/track" element={<UploadTrack />} />
        <Route path="/create/track/:id" element={<UploadTrack />} />
        <Route path="/create/release" element={<PublishRelease />} />
        <Route path="/create/release/:id" element={<PublishRelease />} />
        <Route path="/create/video" element={<UploadVideo />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/desk" element={<JournalDesk />} />
        <Route path="/journal/write" element={<ArticleEditor />} />
        <Route path="/journal/write/:id" element={<ArticleEditor />} />
        <Route path="/journal/:slug" element={<Article />} />
        <Route path="/battles" element={<Battles />} />
        <Route path="/battles/:id" element={<BattleDetail />} />
        <Route path="/game" element={<Game />} />
        <Route path="/league" element={<League />} />
        <Route path="/predict" element={<PredictHub />} />
        <Route path="/predict/:id" element={<PredictBattle />} />
        <Route path="/play" element={<Play />} />
        <Route path="/clip/:id" element={<ClipPage />} />
        <Route path="/profile/:alias" element={<Profile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:alias" element={<Messages />} />
        <Route path="/people" element={<Navigate to="/discover" replace />} />
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
