import { useState, useEffect, useRef } from 'react'
import Portal from './Portal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'

// Curator-only picker: choose a battle source from SMPL's bundled sample
// library (grouped by genre, with a quick audio preview). Picking one fills
// the create-battle form's sample fields.
export default function SampleLibrary({ onPick, onClose }) {
  const t = useT()
  const { fetchCommunitySamples } = useApp()
  const [lib, setLib] = useState(null)
  const [playing, setPlaying] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    let alive = true
    // the founder's bundled library + approved community samples (with maker)
    Promise.all([
      fetch('/sample-library.json').then((r) => r.json()).catch(() => []),
      fetchCommunitySamples().then((r) => (r?.ok ? r.samples : [])).catch(() => []),
    ]).then(([base, community]) => {
      if (!alive) return
      setLib([...(Array.isArray(base) ? base : []), ...(Array.isArray(community) ? community : [])])
    })
    const a = audioRef.current
    return () => {
      alive = false
      a?.pause()
    }
  }, [fetchCommunitySamples])

  const toggle = (s) => {
    const a = audioRef.current
    if (!a) return
    if (playing === s.file) {
      a.pause()
      setPlaying(null)
      return
    }
    a.src = s.file
    a.play().then(() => setPlaying(s.file)).catch(() => {})
  }

  const groups = {}
  for (const s of lib || []) (groups[s.genre] ||= []).push(s)

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[88vh] w-full max-w-[560px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('dashboard.library.title')}</span>
            <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
              {t('common.close')} ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lib === null ? (
              <p className="px-5 py-8 font-mono text-[12px] text-muted">{t('common.loading')}</p>
            ) : !lib.length ? (
              <p className="px-5 py-8 font-mono text-[12px] text-muted">{t('dashboard.library.empty')}</p>
            ) : (
              Object.entries(groups).map(([genre, items]) => (
                <div key={genre}>
                  <div className="sticky top-0 z-10 border-y border-line bg-bg px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                    {genre} · {items.length}
                  </div>
                  {items.map((s) => (
                    <div key={s.file} className="flex items-center gap-3 border-b border-line px-5 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        aria-label="preview"
                        className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-bright font-mono text-[11px] text-ink transition-colors hover:bg-ink hover:text-bg"
                      >
                        {playing === s.file ? '❚❚' : '▶'}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[12px] text-ink">{s.name}</div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {s.bpm ? `${s.bpm} BPM` : ''}
                          {s.bpm && s.key ? ' · ' : ''}
                          {s.key || ''}
                          {s.maker ? <span className="text-faint"> · @{s.maker}</span> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPick(s)}
                        className="shrink-0 border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                      >
                        {t('dashboard.library.use')}
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          <audio ref={audioRef} onEnded={() => setPlaying(null)} className="hidden" />
        </div>
      </div>
    </Portal>
  )
}
