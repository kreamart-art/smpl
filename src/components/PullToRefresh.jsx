import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

const THRESHOLD = 64
const MAX = 96

// Swipe down at the top of any app-shell page to refresh it. Re-hydrates global
// state (refresh) and fires a `smpl:refresh` event that page-local fetches
// (feed, notifications, inbox) listen for.
export default function PullToRefresh({ children }) {
  const { refresh } = useApp()
  const startY = useRef(null)
  const pullRef = useRef(0) // latest pull amount, read in onEnd (avoids stale state)
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)

  const setP = (p) => {
    pullRef.current = p
    setPull(p)
  }
  const onStart = (e) => {
    startY.current = window.scrollY <= 0 && !busy ? e.touches[0].clientY : null
  }
  const onMove = (e) => {
    if (startY.current == null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0 || window.scrollY > 0) {
      startY.current = null
      setP(0)
      return
    }
    setP(Math.min(MAX, dy * 0.5)) // damped
  }
  const onEnd = async () => {
    if (startY.current == null) return
    startY.current = null
    const pulled = pullRef.current
    pullRef.current = 0
    if (pulled >= THRESHOLD) {
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
      setBusy(false)
    }
    setPull(0)
  }

  return (
    <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}>
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
