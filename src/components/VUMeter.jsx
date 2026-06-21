// src/components/VUMeter.jsx
import { useEffect, useRef } from 'react'

// Skeuomorphic analog VU needle meter drawn on a <canvas>, in SMPL's own palette
// (it reads the existing --color-* tokens, so it introduces no new colours and
// adapts to the light theme). Purely visual. Hi-dpi, requestAnimationFrame-driven,
// reduced-motion friendly, and it stops + cleans up on unmount.
//
// Props:
//   value   number 0..1     the share this meter reads (e.g. a producer's vote share)
//   leading boolean         lights the red value-arc and, on reveal, a red needle glow
//   state   'live'|'reveal' live = nervous jitter around value; reveal = ease to value
//   label   string          shown in the corner tag when isPick
//   isPick  boolean         draws a small "JOUW PICK" tag
//   ambient boolean         ignore value and let the needle wander (decorative, e.g. the hub)
//   size    number          dial height in px (width derives ~1.5x)
export default function VUMeter({
  value = 0.6,
  leading = true,
  state = 'live',
  label = 'JOUW PICK',
  isPick = false,
  ambient = false,
  size = 64,
  className = '',
}) {
  const ref = useRef(null)
  const live = useRef({ value, leading, state, ambient })
  live.current = { value, leading, state, ambient }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const css = getComputedStyle(document.documentElement)
    const tok = (n, f) => css.getPropertyValue(n).trim() || f
    const C = {
      accent: tok('--color-accent', '#e5341f'),
      ink: tok('--color-ink', '#f0eee9'),
      lineBright: tok('--color-line-bright', '#524c43'),
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const DEG = Math.PI / 180,
      A0 = -62,
      A1 = 62
    const ang = (v) => (A0 + (A1 - A0) * v) * DEG
    const cAng = (v) => {
      const t = ang(v)
      return Math.atan2(-Math.cos(t), Math.sin(t))
    }
    const pt = (cx, cy, r, v) => {
      const t = ang(v)
      return [cx + r * Math.sin(t), cy - r * Math.cos(t)]
    }

    let W = 0,
      H = 0,
      disp = value,
      drift = value,
      phase = (value + 0.3) * 6,
      raf = 0,
      alive = true

    const fit = () => {
      const w = canvas.clientWidth || size * 1.5
      const h = canvas.clientHeight || size
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      W = w
      H = h
    }

    const draw = () => {
      const { leading: L, state: S } = live.current
      const w = W,
        h = H
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2,
        cy = h * 0.97,
        R = h * 0.84
      // recessed window: dark vertical gradient + inner shadow top + left
      let g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#1b1812')
      g.addColorStop(0.5, '#0c0b09')
      g.addColorStop(1, '#050403')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      let st = ctx.createLinearGradient(0, 0, 0, h * 0.5)
      st.addColorStop(0, 'rgba(0,0,0,0.6)')
      st.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = st
      ctx.fillRect(0, 0, w, h * 0.5)
      let sl = ctx.createLinearGradient(0, 0, w * 0.45, 0)
      sl.addColorStop(0, 'rgba(0,0,0,0.5)')
      sl.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = sl
      ctx.fillRect(0, 0, w * 0.45, h)
      // scale ticks in an arc; thicker every 5; top 30% is the red peak zone
      for (let i = 0; i <= 20; i++) {
        const v = i / 20,
          major = i % 5 === 0,
          peak = v >= 0.7
        const a = pt(cx, cy, R * (major ? 0.84 : 0.91), v),
          b = pt(cx, cy, R * 0.99, v)
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.lineWidth = major ? 1.6 : 0.9
        ctx.strokeStyle = peak ? C.accent : major ? C.ink : C.lineBright
        ctx.stroke()
      }
      // red peak arc along the outer edge
      ctx.beginPath()
      ctx.arc(cx, cy, R, cAng(0.7), cAng(1))
      ctx.lineWidth = 2.2
      ctx.strokeStyle = C.accent
      ctx.stroke()
      // value-arc: red, glowing, additive, only when leading
      if (L) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.74, cAng(0), cAng(Math.max(0.001, disp)))
        ctx.lineWidth = Math.max(2.5, h * 0.05)
        ctx.lineCap = 'round'
        ctx.strokeStyle = C.accent
        ctx.shadowColor = C.accent
        ctx.shadowBlur = h * 0.18
        ctx.stroke()
        ctx.restore()
      }
      // needle drop shadow, then the needle (red + glow on reveal when leading)
      const tip = pt(cx, cy, R * 0.9, disp)
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx + 1, cy + 1.5)
      ctx.lineTo(tip[0] + 1, tip[1] + 1.5)
      ctx.lineWidth = Math.max(2, h * 0.045)
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.stroke()
      ctx.restore()
      const hot = S === 'reveal' && L
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(tip[0], tip[1])
      ctx.lineWidth = Math.max(1.6, h * 0.035)
      ctx.lineCap = 'round'
      ctx.strokeStyle = hot ? C.accent : C.ink
      if (hot) {
        ctx.shadowColor = C.accent
        ctx.shadowBlur = h * 0.16
      }
      ctx.stroke()
      ctx.restore()
      // metal pivot cap: radial gradient + a small specular highlight
      const pr = Math.max(7, h * 0.085)
      const pg = ctx.createRadialGradient(cx - pr * 0.3, cy - pr * 0.35, 1, cx, cy, pr)
      pg.addColorStop(0, '#797368')
      pg.addColorStop(0.55, '#2c2a25')
      pg.addColorStop(1, '#0a0a08')
      ctx.beginPath()
      ctx.arc(cx, cy, pr, 0, 7)
      ctx.fillStyle = pg
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx - pr * 0.3, cy - pr * 0.35, pr * 0.22, 0, 7)
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fill()
    }

    const loop = (t) => {
      if (!alive) return
      const { value: V, state: S, ambient: AM } = live.current
      if (AM) {
        const tgt = 0.44 + 0.46 * (Math.sin(t / 2600) * 0.5 + 0.5)
        drift += (tgt - drift) * 0.012
        const n = (Math.sin((t / 1000) * 8 + phase) * 0.5 + (Math.random() - 0.5)) * 0.05
        disp = Math.max(0, Math.min(1, drift + n))
      } else if (S === 'live') {
        const n = (Math.sin((t / 1000) * 9 + phase) * 0.5 + (Math.random() - 0.5)) * 0.05
        disp = Math.max(0, Math.min(1, V + n))
      } else {
        disp += (V - disp) * 0.06
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    fit()
    if (reduce) {
      disp = ambient ? 0.66 : value
      draw()
    } else {
      raf = requestAnimationFrame(loop)
    }
    const onResize = () => {
      fit()
      if (reduce) draw()
    }
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
    // setup runs once; live prop values are read each frame via the `live` ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: size * 1.5, height: size }}
      aria-hidden="true"
    >
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      {isPick ? (
        <span className="absolute -top-1 right-0 border border-accent px-1 font-mono text-[7px] uppercase tracking-[0.12em] text-accent">
          {label}
        </span>
      ) : null}
    </span>
  )
}
