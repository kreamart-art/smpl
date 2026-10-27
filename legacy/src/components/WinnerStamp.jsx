import { useState, useEffect, useRef } from 'react'
import Portal from './Portal.jsx'
import { hashStr, rng, fmtMonthYear } from '../utils/wave.js'

// Once-only gate. Mirrors the Tour.jsx localStorage idiom (fail-open), with a
// module-level Set fallback so it still self-limits per session in private mode.
const memSeen = new Set()
const seen = (k) => {
  try {
    return !!localStorage.getItem(k)
  } catch {
    return memSeen.has(k)
  }
}
const markSeen = (k) => {
  try {
    localStorage.setItem(k, '1')
  } catch {
    memSeen.add(k)
  }
}

// "First Pressing" — the winner's celebration. A catalog stamp slams in, holds,
// then docks away; the persistent seal stays in the row (rendered by BeatPlayer,
// public to everyone). ONLY the winner ever sees this overlay, once per battle.
// prefers-reduced-motion is honoured by skipping the overlay entirely (the seal
// still shows), rather than the index.css whitelist — a transient click-catching
// overlay must not linger invisibly.
export default function WinnerStamp({ battle, alias, votes, replay = 0 }) {
  const seenKey = `smpl_winseen_${battle.id}`
  const [show, setShow] = useState(false)
  const inited = useRef(false)
  const prevReplay = useRef(replay)

  useEffect(() => {
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!inited.current) {
      inited.current = true
      if (!reduced && !seen(seenKey)) {
        markSeen(seenKey)
        setShow(true)
      }
    } else if (replay !== prevReplay.current) {
      prevReplay.current = replay
      if (!reduced) setShow(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay])

  useEffect(() => {
    if (!show) return undefined
    const id = setTimeout(() => setShow(false), 3300)
    return () => clearTimeout(id)
  }, [show])

  if (!show) return null

  const word = battle.kind === 'VERSES' ? 'CHAMPION' : 'WINNER'
  const cat = `SMPL·${battle.id.toUpperCase()}`
  const date = battle.voteEnd ? fmtMonthYear(battle.voteEnd).toUpperCase() : ''
  // a small, stable rotation seeded off the battle so it feels hand-stamped
  const rot = -(2 + Math.round(rng(hashStr(battle.id))() * 4))

  return (
    <Portal>
      <div
        className="winstamp"
        role="status"
        aria-label={`${word}: @${alias}`}
        onClick={() => setShow(false)}
        style={{ '--rot': `${rot}deg` }}
      >
        <div className="winstamp-wash" />
        <div className="grain winstamp-grain" aria-hidden="true" />
        <div className="winstamp-inner">
          <div className="winstamp-word">
            <span className="winstamp-ghost" aria-hidden="true">{word}</span>
            <span className="winstamp-main">{word}</span>
          </div>
          <div className="winstamp-reg">
            {cat} · FIRST PRESSING · @{alias}
          </div>
          <div className="winstamp-ticks">
            <span>
              {votes} {votes === 1 ? 'VOTE' : 'VOTES'}
            </span>
            <span>{date}</span>
            <span>{battle.kind}</span>
          </div>
        </div>
      </div>
    </Portal>
  )
}
