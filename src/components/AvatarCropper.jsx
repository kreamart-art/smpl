import { useState, useRef, useEffect, useCallback } from 'react'
import { useT } from '../i18n/index.jsx'
import { Btn } from './ui.jsx'
import Portal from './Portal.jsx'

const FRAME = 260 // on-screen crop frame (px)
const OUT = 256 // exported avatar size (px)

// Lightweight square avatar cropper: drag to pan, slider to zoom, exports a
// 256px JPEG data URL. No external dependency — just a canvas.
export default function AvatarCropper({ file, onSave, onCancel }) {
  const t = useT()
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const drag = useRef(null)
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setReady(true)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const clamp = useCallback((off, z) => {
    const img = imgRef.current
    if (!img) return off
    const base = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight) * z
    const maxX = Math.max(0, (img.naturalWidth * base - FRAME) / 2)
    const maxY = Math.max(0, (img.naturalHeight * base - FRAME) / 2)
    return { x: Math.max(-maxX, Math.min(maxX, off.x)), y: Math.max(-maxY, Math.min(maxY, off.y)) }
  }, [])

  const draw = useCallback(
    (ctx, size) => {
      const img = imgRef.current
      if (!img) return
      const k = size / FRAME
      const scale = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight) * zoom * k
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      const dx = (size - w) / 2 + offset.x * k
      const dy = (size - h) / 2 + offset.y * k
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, dx, dy, w, h)
    },
    [zoom, offset],
  )

  useEffect(() => {
    if (!ready) return
    const c = canvasRef.current
    if (c) draw(c.getContext('2d'), FRAME)
  }, [ready, draw])

  const onDown = (e) => {
    const p = e.touches?.[0] || e
    drag.current = { x: p.clientX, y: p.clientY, off: offset }
  }
  const onMove = (e) => {
    if (!drag.current) return
    const p = e.touches?.[0] || e
    setOffset(
      clamp(
        { x: drag.current.off.x + (p.clientX - drag.current.x), y: drag.current.off.y + (p.clientY - drag.current.y) },
        zoom,
      ),
    )
  }
  const onUp = () => {
    drag.current = null
  }
  const onZoom = (z) => {
    setZoom(z)
    setOffset((o) => clamp(o, z))
  }

  const save = () => {
    const out = document.createElement('canvas')
    out.width = OUT
    out.height = OUT
    draw(out.getContext('2d'), OUT)
    onSave(out.toDataURL('image/jpeg', 0.85))
  }

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/80 p-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      onClick={onCancel}
    >
      <div className="my-auto w-full max-w-[340px] border border-line-bright bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('crop.title')}</span>
          <button onClick={onCancel} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
            {t('common.close')} ✕
          </button>
        </div>
        <div className="p-5">
          <div className="mx-auto border border-line" style={{ width: FRAME, height: FRAME }}>
            <canvas
              ref={canvasRef}
              width={FRAME}
              height={FRAME}
              className="block touch-none cursor-move select-none"
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onTouchStart={onDown}
              onTouchMove={onMove}
              onTouchEnd={onUp}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-sm text-faint">−</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => onZoom(parseFloat(e.target.value))}
              className="h-1 flex-1 accent-white"
              aria-label="zoom"
            />
            <span className="font-mono text-sm text-faint">+</span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted">{t('crop.hint')}</p>
          <div className="mt-4 flex gap-3">
            <Btn onClick={save} variant="solid" disabled={!ready}>
              {t('crop.save')}
            </Btn>
            <Btn onClick={onCancel} variant="ghost">
              {t('common.cancel')}
            </Btn>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  )
}
