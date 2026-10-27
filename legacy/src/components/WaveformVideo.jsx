// /smpl/src/components/WaveformVideo.jsx
//
// Builds a shareable 9:16 (1080x1920) waveform clip from a producer's flip.
// The in-modal PREVIEW is driven by REAL audio amplitude via a Web Audio
// AnalyserNode (not random), painted to a canvas. EXPORT renders server-side:
// the canvas paints a branded still (logo, name, footer, grain — no bars), we
// upload it, and ffmpeg draws the animated spectrum from the audio and muxes a
// clean H.264 MP4 (see /api/waveform/render). The old in-browser MediaRecorder
// capture froze the waveform on several mobile browsers, so the heavy lift moved
// to the server. Pure SMPL identity: black ground, off-white bars, JetBrains
// Mono, grain + vignette.
import { useEffect, useRef, useState } from 'react'
import Portal from './Portal.jsx'
import { useI18n } from '../i18n/index.jsx'
import { useApp } from '../context/AppContext.jsx'
import { mediaUrl } from '../api.js'

const W = 1080
const H = 1920

export default function WaveformVideo({ audioUrl, producer = '', tag = '', battleId = '', onClose }) {
  const { lang } = useI18n()
  const nl = lang === 'nl'
  const { uploadImage, saveWaveformVideo, renderWaveformVideo } = useApp()

  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const destRef = useRef(null)
  const rafRef = useRef(0)
  const logoRef = useRef(null)
  const grainRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [err, setErr] = useState('')
  const [blob, setBlob] = useState(null)
  const [mime, setMime] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // the clean, server-transcoded MP4 (+ poster) — share/download/save all use it
  const [prepared, setPrepared] = useState(null)
  const [preparing, setPreparing] = useState(false)

  // ---- one-time assets: logo + a small noise tile (cheap film grain) ----
  useEffect(() => {
    const img = new Image()
    img.onload = () => (logoRef.current = img)
    img.src = '/logo.png'

    const tile = document.createElement('canvas')
    tile.width = tile.height = 160
    const tg = tile.getContext('2d')
    const id = tg.createImageData(160, 160)
    for (let i = 0; i < id.data.length; i += 4) {
      const n = 120 + Math.random() * 135
      id.data[i] = id.data[i + 1] = id.data[i + 2] = n
      id.data[i + 3] = Math.random() * 20
    }
    tg.putImageData(id, 0, 0)
    grainRef.current = tile

    // keep the branded idle frame painting from the start
    if (typeof document !== 'undefined' && document.fonts?.load) {
      document.fonts.load('700 92px "JetBrains Mono"').catch(() => {})
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tear down the audio graph on unmount
  useEffect(
    () => () => {
      try {
        audioCtxRef.current?.close?.()
      } catch {
        /* noop */
      }
    },
    [],
  )

  // lazily build the graph on the first user gesture (autoplay policy)
  const ensureGraph = async () => {
    if (audioCtxRef.current) {
      await audioCtxRef.current.resume()
      return audioCtxRef.current
    }
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC()
    const src = ctx.createMediaElementSource(audioRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    const dest = ctx.createMediaStreamDestination()
    src.connect(analyser)
    analyser.connect(dest) // -> recorded audio track
    analyser.connect(ctx.destination) // -> the speakers
    audioCtxRef.current = ctx
    analyserRef.current = analyser
    destRef.current = dest
    await ctx.resume()
    return ctx
  }

  // ---------- the render loop ----------
  const loop = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const g = canvas.getContext('2d')
      let data = null
      const analyser = analyserRef.current
      if (analyser) {
        data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
      }
      renderFrame(g, data)
    }
    const a = audioRef.current
    if (a && a.duration) setProgress(a.currentTime / a.duration)
    rafRef.current = requestAnimationFrame(loop)
  }

  const tracked = (g, text, cx, y, size, color, tracking, bold) => {
    g.font = `${bold ? '700' : '500'} ${size}px "JetBrains Mono", ui-monospace, monospace`
    g.fillStyle = color
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    const chars = [...String(text)]
    let total = 0
    for (const ch of chars) total += g.measureText(ch).width + tracking
    total -= tracking
    let x = cx - total / 2
    for (const ch of chars) {
      g.fillText(ch, x, y)
      x += g.measureText(ch).width + tracking
    }
  }

  const renderFrame = (g, data, opts = {}) => {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, W, H)

    // soft top bloom
    const bloom = g.createRadialGradient(W / 2, H * 0.06, 0, W / 2, H * 0.06, H * 0.55)
    bloom.addColorStop(0, 'rgba(255,255,255,0.08)')
    bloom.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = bloom
    g.fillRect(0, 0, W, H)

    // logo wordmark, top
    const logo = logoRef.current
    if (logo && logo.width) {
      const lw = 470
      const lh = lw * (logo.height / logo.width)
      g.globalAlpha = 0.97
      g.drawImage(logo, (W - lw) / 2, 150, lw, lh)
      g.globalAlpha = 1
    }
    if (tag) tracked(g, tag.toUpperCase(), W / 2, 360, 26, 'rgba(152,145,131,0.92)', 6)

    // ---- the waveform: thin mirrored bars driven by real amplitude ----
    const cy = H / 2 - 40
    const count = 72
    const gap = 5
    const margin = 110
    const barW = (W - margin * 2 - (count - 1) * gap) / count
    let x = margin
    // opts.bars === false → branded still for the server render (ffmpeg draws the
    // real animated bars). Otherwise paint the live, analyser-driven preview bars.
    if (opts.bars !== false) {
      for (let i = 0; i < count; i++) {
        // sample the lower-mid of the spectrum (where flips live), spread evenly
        const v = data ? data[Math.floor((i / count) * data.length * 0.62)] / 255 : 0
        const amp = (0.012 + Math.pow(v, 1.35) * 0.95) * (H * 0.2)
        g.fillStyle = '#f0eee9'
        g.fillRect(x, cy - amp, Math.max(1, barW), amp * 2)
        x += barW + gap
      }
    }
    // centre hairline through the bars
    g.fillStyle = 'rgba(82,76,67,0.55)'
    g.fillRect(margin, cy - 1, W - margin * 2, 2)

    // producer name, lower third
    tracked(g, producer, W / 2, H - 380, 96, '#f0eee9', 3, true)

    // footer
    g.strokeStyle = 'rgba(82,76,67,0.75)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(110, H - 270)
    g.lineTo(W - 110, H - 270)
    g.stroke()
    tracked(g, 'SAME SAMPLE. DIFFERENT SOUL.', W / 2, H - 210, 24, 'rgba(152,145,131,0.85)', 5)
    tracked(g, 'USESMPL.COM', W / 2, H - 162, 25, 'rgba(240,238,233,0.95)', 9)

    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.26, W / 2, H / 2, H * 0.64)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.93)')
    g.fillStyle = vg
    g.fillRect(0, 0, W, H)

    // grain (tiled noise, jittered for a film feel)
    const tile = grainRef.current
    if (tile) {
      g.save()
      g.globalAlpha = 0.6
      const ox = -Math.random() * 160
      const oy = -Math.random() * 160
      for (let yy = oy; yy < H; yy += 160) for (let xx = ox; xx < W; xx += 160) g.drawImage(tile, xx, yy)
      g.restore()
    }
  }

  // ---------- controls ----------
  const togglePreview = async () => {
    setErr('')
    try {
      await ensureGraph()
      const a = audioRef.current
      if (a.paused) {
        await a.play()
        setPlaying(true)
      } else {
        a.pause()
        setPlaying(false)
      }
    } catch (e) {
      setErr(e?.message || 'Playback failed.')
    }
  }

  // Paint the branded still WITHOUT the live bars (ffmpeg draws the animated
  // waveform server-side), giving the server a clean ground to overlay onto.
  const renderBg = () =>
    new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) return resolve(null)
      cancelAnimationFrame(rafRef.current)
      renderFrame(canvas.getContext('2d'), null, { bars: false })
      canvas.toBlob((b) => {
        rafRef.current = requestAnimationFrame(loop) // resume the live preview
        resolve(b)
      }, 'image/png')
    })

  // Export = server-side render. Upload the branded still, let ffmpeg draw the
  // spectrum from the real audio and mux a clean MP4. Reliable on every device —
  // the old in-browser MediaRecorder left the waveform frozen on mobile.
  const generate = async () => {
    setErr('')
    setSaved(false)
    setRecording(true)
    try {
      const bg = await renderBg()
      if (!bg) throw new Error(nl ? 'Kon de achtergrond niet maken.' : 'Could not build the still.')
      const up = await uploadImage(new File([bg], 'wf-bg.png', { type: 'image/png' }))
      if (!up?.ok || !up.url) throw new Error(up?.error || (nl ? 'Upload mislukt.' : 'Upload failed.'))
      const r = await renderWaveformVideo({ bgUrl: up.url, audioUrl })
      if (!r?.ok || !r.url) throw new Error(r?.error || (nl ? 'Render mislukt.' : 'Render failed.'))
      const mp4 = await (await fetch(mediaUrl(r.url))).blob()
      setMime('video/mp4')
      setBlob(mp4)
      setPrepared({ url: r.url, poster: r.poster || '', blob: mp4, ext: 'mp4' })
      setRecording(false)
      setPlaying(false)
    } catch (e) {
      setRecording(false)
      setErr(e?.message || (nl ? 'Export mislukt.' : 'Export failed.'))
    }
  }

  const safeName = () => (producer || 'flip').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'flip'

  // generate() already rendered + cached the share-ready clip server-side; the
  // share / download / save actions just read it back.
  const ensurePrepared = async () => prepared || { url: '', poster: '', blob, ext: 'mp4' }

  const downloadBlob = (b, fname) => {
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const download = async () => {
    const p = await ensurePrepared()
    downloadBlob(p.blob, `smpl-${safeName()}.${p.ext}`)
  }
  const share = async () => {
    const p = await ensurePrepared()
    const file = new File([p.blob], `smpl-${safeName()}.${p.ext}`, { type: p.blob.type || 'video/mp4' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'SMPL' })
      } catch {
        /* cancelled */
      }
    } else downloadBlob(p.blob, file.name)
  }
  const saveToProfile = async () => {
    if (!blob) return
    setErr('')
    setSaving(true)
    const p = await ensurePrepared()
    if (!p.url) {
      setErr(p.error || (nl ? 'Opslaan mislukt, probeer opnieuw.' : 'Could not save, try again.'))
      setSaving(false)
      return
    }
    const r = await saveWaveformVideo({ url: p.url, poster: p.poster, battleId, tag })
    setSaving(false)
    if (r.ok) setSaved(true)
    else setErr(r.error || (nl ? 'Opslaan mislukt.' : 'Save failed.'))
  }

  // As soon as a recording exists, build the share-ready MP4 in the background so
  // the buttons are instant and the share stays inside the user gesture on iOS.
  useEffect(() => {
    if (blob && !prepared && !preparing) ensurePrepared(blob, mime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob])

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={recording ? undefined : onClose}
      >
        <div
          className="flex max-h-[94dvh] w-full max-w-[460px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">
              {nl ? 'Waveform-video' : 'Waveform video'}
            </span>
            <button
              onClick={onClose}
              disabled={recording}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink disabled:opacity-40"
            >
              {nl ? 'Sluiten' : 'Close'} ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto w-full max-w-[300px] border border-line">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="block aspect-[1080/1920] h-auto w-full cursor-pointer bg-black"
                onClick={togglePreview}
              />
            </div>
            <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" preload="auto" className="hidden" />

            <div className="mt-3 h-[3px] w-full max-w-[300px] mx-auto bg-line">
              <div className="h-full bg-ink" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>

            <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-muted">
              {nl
                ? 'De waveform beweegt mee met je echte audio. De clip wordt server-side gerenderd, dus hij werkt op elk toestel.'
                : 'The waveform reacts to your real audio. The clip is rendered server-side, so it works on every device.'}
            </p>
            {err ? <p className="mt-2 text-center font-mono text-[11px] text-ink">! {err}</p> : null}
          </div>

          <div className="border-t border-line p-5">
            {!blob ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={togglePreview}
                  disabled={recording}
                  className="flex-1 border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                >
                  {playing ? (nl ? 'Pauze' : 'Pause') : nl ? 'Voorbeeld' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={recording}
                  className="flex-1 border border-ink bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bg transition-colors hover:bg-bright disabled:opacity-60"
                >
                  {recording ? (nl ? 'Renderen…' : 'Rendering…') : nl ? 'Genereer clip' : 'Generate clip'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {preparing ? (
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {nl ? 'Clip klaarmaken om te delen…' : 'Preparing your clip to share…'}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={saveToProfile}
                  disabled={saving || saved || preparing}
                  className="w-full border border-ink bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bg transition-colors hover:bg-bright disabled:opacity-60"
                >
                  {saved
                    ? nl
                      ? 'Op je profiel'
                      : 'Saved to profile'
                    : saving
                      ? nl
                        ? 'Opslaan…'
                        : 'Saving…'
                      : nl
                        ? 'Opslaan op profiel'
                        : 'Save to profile'}
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={share}
                    disabled={preparing}
                    className="flex-1 border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                  >
                    {nl ? 'Delen' : 'Share'}
                  </button>
                  <button
                    type="button"
                    onClick={download}
                    disabled={preparing}
                    className="flex-1 border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                  >
                    {nl ? 'Download' : 'Download'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBlob(null)
                      setSaved(false)
                      setPrepared(null)
                    }}
                    className="border border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                  >
                    {nl ? 'Opnieuw' : 'Redo'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
