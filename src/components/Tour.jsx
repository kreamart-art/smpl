// src/components/Tour.jsx
// One-time guided tours for the installed app. A tour spotlights a sequence of
// real on-screen elements (matched by a [data-tour="key"] attribute) and
// explains each in a small tooltip. Steps with no target render a centered
// card. Two tours ship: a welcome tour (app nav) and a battle-page tour.
import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Portal from './Portal.jsx'
import { Btn } from './ui.jsx'
import { useT } from '../i18n/index.jsx'
import { usePWA } from '../context/PWAContext.jsx'

export const WELCOME_KEY = 'smpl_tour_welcome_v1'
export const BATTLE_KEY = 'smpl_tour_battle_v1'
export const PROFILE_KEY = 'smpl_tour_profile_v1'
export const SHARE_KEY = 'smpl_tour_share_v1'

const read = (k) => {
  try {
    return !!localStorage.getItem(k)
  } catch {
    return false
  }
}
const write = (k) => {
  try {
    localStorage.setItem(k, '1')
  } catch {
    /* private mode */
  }
}
// Re-arm every tour (used by the Settings "replay" entry).
export const resetTours = () => {
  try {
    ;[WELCOME_KEY, BATTLE_KEY, PROFILE_KEY, SHARE_KEY].forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

// Bottom-bar sweep (left to right), then the messages icon up top.
const WELCOME_STEPS = [
  { key: 'intro' },
  { key: 'battles', target: '[data-tour="battles"]' },
  { key: 'feed', target: '[data-tour="feed"]' },
  { key: 'people', target: '[data-tour="people"]' },
  { key: 'alerts', target: '[data-tour="alerts"]' },
  { key: 'profile', target: '[data-tour="profile"]' },
  { key: 'messages', target: '[data-tour="messages"]' },
].map((s) => ({ ...s, ns: 'welcome' }))

// Battle-detail page. Header actions first, then down the page. Steps whose
// target is absent in the current phase/role are filtered out before running.
const BATTLE_STEPS = [
  { key: 'intro' },
  { key: 'attend', target: '[data-tour="battle-attend"]' },
  { key: 'share', target: '[data-tour="battle-share"]' },
  { key: 'countdown', target: '[data-tour="battle-countdown"]' },
  { key: 'sample', target: '[data-tour="battle-sample"]' },
  { key: 'action', target: '[data-tour="battle-action"]' },
].map((s) => ({ ...s, ns: 'battle' }))

// Own profile.
const PROFILE_STEPS = [
  { key: 'intro' },
  { key: 'stats', target: '[data-tour="profile-stats"]' },
  { key: 'tabs', target: '[data-tour="profile-tabs"]' },
  { key: 'edit', target: '[data-tour="profile-edit"]' },
  { key: 'settings', target: '[data-tour="profile-settings"]' },
].map((s) => ({ ...s, ns: 'profile' }))

// Share-card page.
const SHARE_STEPS = [
  { key: 'intro' },
  { key: 'format', target: '[data-tour="share-format"]' },
  { key: 'actions', target: '[data-tour="share-actions"]' },
].map((s) => ({ ...s, ns: 'share' }))

// Core engine: drives one list of steps.
function TourRunner({ steps, onClose }) {
  const t = useT()
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const step = steps[i]
  const last = i === steps.length - 1

  const measure = useCallback(() => {
    if (!step?.target) return setRect(null)
    const el = document.querySelector(step.target)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  // Bring the target into view, then measure now, next frame, and shortly after
  // (targets can mount/scroll late); keep it in sync on resize/scroll.
  useLayoutEffect(() => {
    if (step?.target) {
      const el = document.querySelector(step.target)
      if (el) el.scrollIntoView({ block: 'center' })
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const tmo = setTimeout(measure, 160)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(tmo)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure, step])

  const next = () => (last ? onClose() : setI((n) => n + 1))

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const ring = rect
    ? { top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }
    : null
  // Tooltip goes below a top-half target, above a bottom-half one; centered when
  // there is no target.
  const below = rect ? rect.top + rect.height / 2 < vh * 0.5 : false
  const cardStyle = !rect
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : below
      ? { top: rect.top + rect.height + 16, left: '50%', transform: 'translateX(-50%)' }
      : { bottom: vh - rect.top + 16, left: '50%', transform: 'translateX(-50%)' }

  const k = (suffix) => `tour.${step.ns}.${step.key}.${suffix}`

  return (
    <Portal>
      <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
        {/* dim everything; the spotlight ring punches a hole over the target */}
        {ring ? (
          <div
            className="pointer-events-none fixed border border-ink transition-all duration-300"
            style={{
              top: ring.top,
              left: ring.left,
              width: ring.width,
              height: ring.height,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)',
            }}
          />
        ) : (
          <div className="fixed inset-0 bg-black/80" />
        )}

        {/* tooltip card */}
        <div
          className="fixed w-[min(340px,calc(100vw-32px))] border border-line-bright bg-panel p-5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]"
          style={cardStyle}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tnum tracking-[0.16em] text-faint">
              {i + 1} / {steps.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink"
            >
              {t('tour.skip')}
            </button>
          </div>
          <h2 className="mt-3 font-sans text-lg font-bold uppercase tracking-tight">{t(k('title'))}</h2>
          <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-muted">{t(k('body'))}</p>
          <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {steps.map((s, n) => (
              <span key={s.key} className={`h-1 flex-1 ${n <= i ? 'bg-ink' : 'bg-line'}`} />
            ))}
          </div>
          <div className="mt-4">
            <Btn type="button" onClick={next} variant="solid" size="lg" full>
              {last ? t('tour.done') : t('tour.next')}
            </Btn>
          </div>
        </div>
      </div>
    </Portal>
  )
}

// App welcome tour: auto-runs once for new users, replays on ?tour=1.
export default function WelcomeTour() {
  const [active, setActive] = useState(false)
  const { search } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const forced = new URLSearchParams(search).get('tour') === '1'
    if (forced) {
      navigate('/battles', { replace: true }) // drop the query so refresh won't reopen
      setActive(true)
      return
    }
    if (!read(WELCOME_KEY)) {
      const tmo = setTimeout(() => setActive(true), 700) // let the shell settle
      return () => clearTimeout(tmo)
    }
  }, [search, navigate])

  const close = () => {
    write(WELCOME_KEY)
    setActive(false)
  }

  if (!active) return null
  return <TourRunner steps={WELCOME_STEPS} onClose={close} />
}

// Per-page tour: runs once (app only, after the welcome tour). Adapts to the
// page by dropping steps whose target is absent in the current state.
function PageTour({ allSteps, flagKey, enabled = true }) {
  const { standalone } = usePWA()
  const [steps, setSteps] = useState(null)

  useEffect(() => {
    if (!enabled || !standalone || read(flagKey) || !read(WELCOME_KEY)) return
    const tmo = setTimeout(() => {
      const present = allSteps.filter((s) => !s.target || document.querySelector(s.target))
      // need at least one anchored step beyond the intro to be worth running
      if (present.some((s) => s.target)) setSteps(present)
    }, 800)
    return () => clearTimeout(tmo)
  }, [enabled, standalone, allSteps, flagKey])

  const close = () => {
    write(flagKey)
    setSteps(null)
  }

  if (!steps) return null
  return <TourRunner steps={steps} onClose={close} />
}

// First time a new user opens a battle.
export const BattleTour = () => <PageTour allSteps={BATTLE_STEPS} flagKey={BATTLE_KEY} />
// First time a user lands on their own profile (caller gates on `isSelf`).
export const ProfileTour = ({ enabled = true }) => (
  <PageTour allSteps={PROFILE_STEPS} flagKey={PROFILE_KEY} enabled={enabled} />
)
// First time a user opens the share-card page.
export const ShareTour = () => <PageTour allSteps={SHARE_STEPS} flagKey={SHARE_KEY} />
