import { useEffect, useRef, useState } from 'react'
import { Btn } from './ui.jsx'
import { useI18n } from '../i18n/index.jsx'

// The promo reel + its poster live in /public (compressed for web).
const SRC = '/announcement.mp4'
const POSTER = '/announcement-poster.jpg'
// Bump this key when a new announcement replaces it, so the popup shows again.
const DISMISS_KEY = 'smpl_announce_bb1'

// Reel-style player: autoplays muted and loops, tap the video to play/pause,
// a mute toggle in the corner.
export default function AnnouncementVideo({ className = '' }) {
  const ref = useRef(null)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)

  const togglePlay = () => {
    const v = ref.current
    if (v) v.paused ? v.play() : v.pause()
  }
  const toggleMute = (e) => {
    e.stopPropagation()
    const v = ref.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        src={SRC}
        poster={POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onClick={togglePlay}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="block h-full w-full cursor-pointer object-cover"
      />
      {paused ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/35"
        >
          <span className="flex h-16 w-16 items-center justify-center border border-white/40 bg-black/40 text-2xl text-white backdrop-blur">
            ▶
          </span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center border border-white/30 bg-black/50 text-[15px] text-white backdrop-blur transition-colors hover:bg-black/70"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}

// App popup: greets on open, dismissable only after a 9-second countdown, then
// remembered so it shows once.
export function AnnouncementPopup() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [left, setLeft] = useState(9)

  useEffect(() => {
    if (dismissed) return
    const start = Date.now()
    const id = setInterval(() => {
      const s = Math.max(0, 9 - Math.floor((Date.now() - start) / 1000))
      setLeft(s)
      if (s <= 0) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  }, [dismissed])

  if (dismissed) return null
  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      style={{ padding: 'max(env(safe-area-inset-top),16px) 14px max(env(safe-area-inset-bottom),16px)' }}
    >
      <div className="relative mx-auto aspect-[1080/1918] max-h-[82dvh] w-full max-w-[400px] border border-white/15">
        <AnnouncementVideo className="h-full w-full" />
        {left > 0 ? (
          <div className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center border border-white/20 bg-black/70 font-mono text-[13px] text-white/70">
            {left}
          </div>
        ) : (
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center border border-white/40 bg-black text-white transition-colors hover:bg-white hover:text-black"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// Web section: a heading, the reel, and a CTA, shown on the public homepage.
export function AnnouncementSection() {
  const { lang } = useI18n()
  const nl = lang === 'nl'
  return (
    <section className="border-b border-line bg-black">
      <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex items-end gap-4 border-b border-line pb-5">
          <span className="font-mono text-[13px] text-faint tnum">00</span>
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
              <span className="block h-1.5 w-1.5 bg-ink pulse-dot" />
              {nl ? 'Aankondiging' : 'Announcement'}
            </div>
            <h2 className="font-sans text-[clamp(1.9rem,4.4vw,3.2rem)] font-bold uppercase leading-none tracking-tight">
              Beat Battle #1
            </h2>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:gap-16">
          <div className="w-full max-w-[320px] shrink-0">
            <AnnouncementVideo className="aspect-[1080/1918] w-full border border-line-bright" />
          </div>
          <div className="max-w-md text-center lg:text-left">
            <p className="font-sans text-[clamp(1.2rem,2.4vw,1.6rem)] font-bold uppercase leading-tight tracking-tight">
              {nl ? '8 producers. 1 sample. 60 seconden. 1 winnaar.' : '8 producers. 1 sample. 60 seconds. 1 winner.'}
            </p>
            <p className="mt-4 font-mono text-[12px] leading-relaxed text-muted">
              {nl
                ? 'Iedereen flipt dezelfde sample, de crowd kiest de winnaar. Meld je aan en geef er jouw draai aan.'
                : 'Everyone flips the same sample, the crowd crowns the winner. Sign up and flip it your way.'}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Btn to="/signup" variant="solid" size="lg">
                {nl ? 'Doe mee' : 'Join the battle'}
              </Btn>
              <Btn to="/battles" variant="ghost" size="lg">
                {nl ? 'Bekijk battles' : 'Browse battles'}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
