import { useRef, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

const THRESHOLD = 64
const MAX = 96

// Swipe down at the top of any app-shell page to refresh it. Re-hydrates global
// state (refresh) and fires a `smpl:refresh` event that page-local fetches
// (feed, notifications, inbox) listen for.
//
// The touchmove listener is attached NON-passively so we can preventDefault once
// we own the pull — otherwise iOS/Android hand the gesture to native overscroll
// and the custom pull never accumulates (the bug: "swiping down doesn't refresh").
export default function PullToRefresh({ children }) {
  const { refresh } = useApp()
  const wrapRef = useRef(null)
  const startY = useRef(null)
  const pullRef = useRef(0)
  const busyRef = useRef(false)
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0

    const onStart = (e) => {
      startY.current = !busyRef.current && atTop() ? e.touches[0].clientY : null
      pullRef.current = 0
    }
    const onMove = (e) => {
      if (startY.current == null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || !atTop()) {
        // swiping up or no longer at the top → let the page scroll normally
        startY.current = null
        if (pullRef.current) {
          pullRef.current = 0
          setPull(0)
        }
        return
      }
      // we own this gesture now — stop native scroll/overscroll from stealing it
      if (e.cancelable) e.preventDefault()
      const p = Math.min(MAX, dy * 0.5)
      pullRef.current = p
      setPull(p)
    }
    const onEnd = async () => {
      if (startY.current == null) return
      startY.current = null
      const pulled = pullRef.current
      pullRef.current = 0
      if (pulled >= THRESHOLD) {
        busyRef.current = true
        setBusy(true)
        setPull(THRESHOLD)
        try {
          // keep the spinner visible long enough to read, even if data is cached
          await Promise.all([
            refresh().then(() => window.dispatchEvent(new CustomEvent('smpl:refresh'))),
            new Promise((r) => setTimeout(r, 650)),
          ])
        } catch {
          /* ignore */
        }
        busyRef.current = false
        setBusy(false)
      }
      setPull(0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [refresh])

  return (
    <div ref={wrapRef}>
      <div
        className="pointer-events-none flex items-end justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: busy ? THRESHOLD : pull }}
      >
        <span
          className={`pb-2 font-mono text-[18px] leading-none ${busy ? 'ptr-spin text-ink' : 'text-muted'}`}
          style={{ transform: !busy ? `rotate(${Math.min(180, (pull / THRESHOLD) * 180)}deg)` : undefined }}
        >
          ↻
        </span>
      </div>
      {children}
    </div>
  )
}
