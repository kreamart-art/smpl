// /smpl/src/components/WinnerCard.jsx
//
// A static 1:1 (1080x1080) winner share card for a crowned battle. Black, mono,
// the chrome SMPL logo, the winner's @handle as the hero, a FIRST PRESSING seal,
// a seeded waveform motif and the flip count (no vote tally — by design). Drawn
// on a canvas and shared via the device share sheet (download fallback). Pure
// SMPL identity: black ground, off-white text, ember-red accent, grain + vignette.
import { useEffect, useRef, useState } from 'react'
import Portal from './Portal.jsx'
import { useI18n } from '../i18n/index.jsx'

const W = 1080
const H = 1080

// Deterministic 0..1 generator from a string seed, so every battle gets its own
// waveform shape (stable across re-renders).
function seeded(str) {
  let s = 0
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0
  s = (s || 1) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export default function WinnerCard({ alias = '', battleTitle = '', flips = 0, seed = '', onClose }) {
  const { lang } = useI18n()
  const nl = lang === 'nl'
  const canvasRef = useRef(null)
  const logoRef = useRef(null)
  const grainRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    // a small noise tile for cheap film grain
    const tile = document.createElement('canvas')
    tile.width = 160
    tile.height = 160
    const tg = tile.getContext('2d')
    const id = tg.createImageData(160, 160)
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 200 + ((Math.random() * 55) | 0)
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v
      id.data[i + 3] = (Math.random() * 16) | 0
    }
    tg.putImageData(id, 0, 0)
    grainRef.current = tile

    const img = new Image()
    img.onload = () => {
      logoRef.current = img
      draw()
    }
    img.onerror = () => draw()
    img.src = '/logo.png'
    if (document.fonts?.load) {
      Promise.all([
        document.fonts.load('700 86px "Space Grotesk"'),
        document.fonts.load('500 26px "JetBrains Mono"'),
      ])
        .then(draw)
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const g = c.getContext('2d')
    const cream = '#f0eee9'
    const muted = '#8d8678'
    const faint = '#524c43'
    const accent = '#E5341F'

    // letter-spaced, centred text. mono by default; sans (Space Grotesk) for the
    // headline @handle so it reads like a champion, not a label.
    const trk = (text, cx, y, size, color, tr, opts = {}) => {
      const { sans = false, bold = false } = opts
      g.font = sans
        ? `700 ${size}px "Space Grotesk", system-ui, sans-serif`
        : `${bold ? 700 : 500} ${size}px "JetBrains Mono", ui-monospace, monospace`
      g.fillStyle = color
      g.textBaseline = 'alphabetic'
      g.textAlign = 'left'
      const chars = [...String(text)]
      let total = 0
      for (const ch of chars) total += g.measureText(ch).width + tr
      total -= tr
      let x = cx - total / 2
      for (const ch of chars) {
        g.fillText(ch, x, y)
        x += g.measureText(ch).width + tr
      }
    }
    const hline = (x1, x2, y, col) => {
      g.strokeStyle = col
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(x1, y)
      g.lineTo(x2, y)
      g.stroke()
    }

    // ground + soft top bloom
    g.fillStyle = '#060606'
    g.fillRect(0, 0, W, H)
    const bloom = g.createRadialGradient(W / 2, H * 0.05, 0, W / 2, H * 0.05, H * 0.6)
    bloom.addColorStop(0, 'rgba(255,255,255,0.06)')
    bloom.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = bloom
    g.fillRect(0, 0, W, H)

    // thin inset frame
    g.strokeStyle = '#2a2620'
    g.lineWidth = 1
    g.strokeRect(40, 40, W - 80, H - 80)

    // logo (real chrome wordmark) + accent tick
    const logo = logoRef.current
    if (logo && logo.width) {
      const lw = 300
      const lh = lw * (logo.height / logo.width)
      g.globalAlpha = 0.97
      g.drawImage(logo, (W - lw) / 2, 96, lw, lh)
      g.globalAlpha = 1
    } else {
      trk('SMPL', W / 2, 178, 68, cream, 4, { sans: true })
    }
    g.fillStyle = accent
    g.fillRect(W / 2 - 34, 206, 68, 3)

    // what this is
    trk('BEAT BATTLE WINNER', W / 2, 270, 26, accent, 9)
    hline(250, W - 250, 312, '#2a2620')

    // the winner — the hero
    trk('@' + alias, W / 2, 478, 88, cream, 0, { sans: true })

    // the waveform motif, seeded per battle
    drawWave(g, seed || alias || battleTitle, cream)

    // battle + the field size (flips only, no vote count)
    trk(String(battleTitle).toUpperCase(), W / 2, 840, 23, muted, 4)
    trk(`WON OUT OF ${flips} FLIPS`, W / 2, 886, 29, cream, 2)

    // footer
    hline(190, W - 190, 938, '#2a2620')
    trk('SAME SAMPLE. DIFFERENT SOUL.', W / 2, 988, 21, faint, 4)
    trk('USESMPL.COM', W / 2, 1030, 25, cream, 9)

    // grain
    const tile = grainRef.current
    if (tile) {
      g.save()
      g.globalAlpha = 0.5
      const ox = -((Math.random() * 160) | 0)
      const oy = -((Math.random() * 160) | 0)
      for (let yy = oy; yy < H; yy += 160) for (let xx = ox; xx < W; xx += 160) g.drawImage(tile, xx, yy)
      g.restore()
    }
    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.55)')
    g.fillStyle = vg
    g.fillRect(0, 0, W, H)
  }

  const drawWave = (g, seedStr, color) => {
    const rnd = seeded(String(seedStr))
    const cy = 660
    const count = 34
    const x0 = 184
    const x1 = W - 184
    const step = (x1 - x0) / (count - 1)
    const bw = 9
    g.strokeStyle = '#3a352d'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(x0 - 14, cy)
    g.lineTo(x1 + 14, cy)
    g.stroke()
    g.fillStyle = color
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const bell = 0.45 + 0.55 * Math.sin(t * Math.PI) // taller toward the centre
      const h = (14 + rnd() * 92) * (0.5 + 0.65 * bell)
      const x = x0 + i * step
      g.fillRect(x - bw / 2, cy - h, bw, h * 2)
    }
  }

  const fileName = () => `smpl-winner-${(alias || 'winner').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'winner'}.png`
  const toFile = () =>
    new Promise((resolve) => canvasRef.current.toBlob((b) => resolve(new File([b], fileName(), { type: 'image/png' })), 'image/png'))
  const downloadFile = (file) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const share = async () => {
    setBusy(true)
    setErr('')
    try {
      const file = await toFile()
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'SMPL' })
      else downloadFile(file)
    } catch (e) {
      if (e?.name !== 'AbortError') setErr(e?.message || (nl ? 'Delen mislukt.' : 'Share failed.'))
    }
    setBusy(false)
  }
  const download = async () => {
    setErr('')
    try {
      downloadFile(await toFile())
    } catch (e) {
      setErr(e?.message || (nl ? 'Download mislukt.' : 'Download failed.'))
    }
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[94dvh] w-full max-w-[460px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">
              {nl ? 'Winnaar-kaart' : 'Winner card'}
            </span>
            <button
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            >
              {nl ? 'Sluiten' : 'Close'} ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto w-full max-w-[320px] border border-line">
              <canvas ref={canvasRef} width={W} height={H} className="block aspect-square h-auto w-full bg-black" />
            </div>
            <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-muted">
              {nl
                ? 'Vierkante kaart, klaar voor je feed of carrousel.'
                : 'Square card, ready for your feed or carousel.'}
            </p>
            {err ? <p className="mt-2 text-center font-mono text-[11px] text-ink">! {err}</p> : null}
          </div>

          <div className="border-t border-line p-5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={share}
                disabled={busy}
                className="flex-1 border border-ink bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bg transition-colors hover:bg-bright disabled:opacity-60"
              >
                {busy ? (nl ? 'Even…' : 'One sec…') : nl ? 'Delen' : 'Share'}
              </button>
              <button
                type="button"
                onClick={download}
                disabled={busy}
                className="flex-1 border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
              >
                {nl ? 'Download' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
