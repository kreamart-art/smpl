import { useRef, useState } from 'react'
import { useT } from '../i18n/index.jsx'

// keep in sync with STAMP_EMOJI on the server
const PALETTE = ['❤️', '🔥', '😂', '😮', '👏', '💯', '🎤', '🎧', '👀', '🥲']

// Re-encode any image blob to PNG (Safari/Chrome clipboard only reliably take PNG).
const toPng = (blob) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      c.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png')
    }
    img.onerror = reject
    img.src = url
  })

// Fullscreen DM photo. Tap the dark area (or ✕) to close, double-tap the photo
// to stamp the selected emoji where you tapped, press-and-hold for save/copy.
// Stamps persist on the message — both people in the thread see them.
export default function PhotoViewer({ src, stamps = [], currentUserId, onAddStamp, onRemoveStamp, onClose }) {
  const t = useT()
  const layerRef = useRef(null)
  const tap = useRef({ t: 0, x: 0, y: 0 })
  const press = useRef({ timer: null, x: 0, y: 0, moved: false })
  const [emoji, setEmoji] = useState('❤️')
  const [menu, setMenu] = useState(null) // {x,y} (px within the photo) for the hold-menu
  const [note, setNote] = useState('')

  const flash = (msg) => {
    setNote(msg)
    setTimeout(() => setNote(''), 1600)
  }

  const fracFrom = (clientX, clientY) => {
    const r = layerRef.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return null
    return {
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    }
  }

  const onDown = (e) => {
    if (menu) {
      setMenu(null)
      return
    }
    const cx = e.clientX
    const cy = e.clientY
    press.current.moved = false
    press.current.x = cx
    press.current.y = cy
    clearTimeout(press.current.timer)
    press.current.timer = setTimeout(() => {
      const r = layerRef.current?.getBoundingClientRect()
      if (r) setMenu({ x: cx - r.left, y: cy - r.top })
    }, 480)
  }
  const onMove = (e) => {
    if (Math.abs(e.clientX - press.current.x) > 12 || Math.abs(e.clientY - press.current.y) > 12) {
      press.current.moved = true
      clearTimeout(press.current.timer)
    }
  }
  const onUp = (e) => {
    clearTimeout(press.current.timer)
    if (press.current.moved || menu) return
    const now = Date.now()
    const prev = tap.current
    const isDouble = now - prev.t < 320 && Math.abs(e.clientX - prev.x) < 36 && Math.abs(e.clientY - prev.y) < 36
    if (isDouble) {
      const f = fracFrom(e.clientX, e.clientY)
      if (f) onAddStamp({ emoji, x: f.x, y: f.y })
      tap.current = { t: 0, x: 0, y: 0 }
    } else {
      tap.current = { t: now, x: e.clientX, y: e.clientY }
    }
  }

  const blobOf = async () => (await fetch(src)).blob()

  const save = async () => {
    setMenu(null)
    try {
      const blob = await blobOf()
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smpl-photo-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flash(t('messages.photoSaved'))
    } catch {
      flash(t('messages.photoActionFailed'))
    }
  }
  const copy = async () => {
    setMenu(null)
    try {
      const blob = await blobOf()
      const png = blob.type === 'image/png' ? blob : await toPng(blob)
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': png })])
      flash(t('messages.photoCopied'))
    } catch {
      flash(t('messages.photoActionFailed'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('messages.photoHint')}</span>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex h-9 w-9 items-center justify-center border border-line-bright font-mono text-ink hover:bg-ink hover:text-bg"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-3" onClick={(e) => e.stopPropagation()}>
        <div ref={layerRef} className="relative inline-block select-none touch-none">
          <img src={src} alt="" draggable={false} className="block max-h-[78vh] max-w-full object-contain" />
          <div
            className="absolute inset-0"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => clearTimeout(press.current.timer)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {stamps.map((s) => {
              const mine = s.by === currentUserId
              return (
                <button
                  key={s.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (mine) onRemoveStamp(s.id)
                  }}
                  style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 text-3xl leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] ${
                    mine ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  title={mine ? t('messages.stampRemove') : ''}
                >
                  {s.emoji}
                </button>
              )
            })}

            {menu ? (
              <div
                className="absolute z-10 flex flex-col border border-line-bright bg-panel shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)]"
                style={{
                  left: Math.max(4, Math.min(menu.x, (layerRef.current?.clientWidth || 160) - 150)),
                  top: Math.max(4, menu.y),
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <button onClick={save} className="px-4 py-2.5 text-left font-mono text-[12px] text-ink hover:bg-bg">
                  ↓ {t('messages.photoSave')}
                </button>
                <button
                  onClick={copy}
                  className="border-t border-line px-4 py-2.5 text-left font-mono text-[12px] text-ink hover:bg-bg"
                >
                  ⧉ {t('messages.photoCopy')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {note ? (
          <div className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink">{note}</div>
        ) : null}
        <div className="mb-1 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          {t('messages.stampPick')}
        </div>
        <div className="flex items-center justify-center gap-1 overflow-x-auto">
          {PALETTE.map((em) => (
            <button
              key={em}
              onClick={() => setEmoji(em)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center border text-xl ${
                emoji === em ? 'border-ink bg-ink/10' : 'border-line'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
