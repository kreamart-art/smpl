// One sound at a time: when any audible media starts, every other one pauses
// (the shared player, a crate row, a voice DM, a game clip). Muted media, like
// background loops and clip previews, keep running.
const detached = new Set()

const audible = (el) => !el.muted && el.volume > 0

export function pauseAllExcept(source) {
  for (const el of document.querySelectorAll('audio, video')) {
    if (el !== source && !el.paused && audible(el)) el.pause()
  }
  for (const el of detached) if (el !== source && !el.paused) el.pause()
}

let installed = false
export function installExclusiveAudio() {
  if (installed || typeof document === 'undefined') return
  installed = true
  // 'play' does not bubble, but the capture phase still sees it on document
  document.addEventListener(
    'play',
    (e) => {
      const el = e.target
      if (el instanceof HTMLMediaElement && audible(el)) pauseAllExcept(el)
    },
    true,
  )
}

// For `new Audio()` objects that never join the DOM (the document listener
// can't see those).
export function registerDetachedAudio(el) {
  detached.add(el)
  const onPlay = () => pauseAllExcept(el)
  el.addEventListener('play', onPlay)
  return () => {
    el.removeEventListener('play', onPlay)
    detached.delete(el)
  }
}
