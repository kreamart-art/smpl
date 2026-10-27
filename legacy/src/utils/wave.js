// Deterministic pseudo-random helpers so every track gets a stable, unique
// waveform without any real audio file. Seeded by a string id.

export function hashStr(str) {
  let h = 2166136261
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rng(seed) {
  return mulberry32(hashStr(seed))
}

// Generate waveform bar heights (0..1) with a musical-ish envelope.
export function genBars(seed, n = 72) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const p = i / n
    // gentle envelope so the middle is louder than the edges
    const env = 0.4 + 0.6 * Math.sin(p * Math.PI)
    // occasional transient peaks, like drum hits
    const transient = r() > 0.86 ? 1 : 0.55
    const v = Math.pow(r(), 1.3)
    out.push(Math.max(0.08, Math.min(1, env * transient * (0.3 + 1.05 * v))))
  }
  return out
}

// Stable shuffle seeded by a string — used to anonymise + randomise beats.
export function shuffleSeeded(arr, seed) {
  const r = rng(seed)
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${String(ss).padStart(2, '0')}`
}

export function fmtDate(ts) {
  if (!ts) return '——————————'
  return new Date(ts).toISOString().slice(0, 10)
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// "Jun 2026" — used for the public "member since" line.
export function fmtMonthYear(ts) {
  if (!ts) return '——'
  const d = new Date(ts)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// Whole-year age from a YYYY-MM-DD string (used only on your own private file).
export function ageFrom(dob, nowTs = 0) {
  if (!dob) return null
  const b = new Date(dob)
  if (Number.isNaN(b.getTime())) return null
  const now = nowTs ? new Date(nowTs) : new Date(b.getTime())
  let age = now.getUTCFullYear() - b.getUTCFullYear()
  const m = now.getUTCMonth() - b.getUTCMonth()
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--
  return age >= 0 && age < 130 ? age : null
}

// Countdown breakdown from a future timestamp.
export function breakdown(ms) {
  const clamped = Math.max(0, ms)
  const d = Math.floor(clamped / 86400000)
  const h = Math.floor((clamped % 86400000) / 3600000)
  const m = Math.floor((clamped % 3600000) / 60000)
  const s = Math.floor((clamped % 60000) / 1000)
  return { d, h, m, s, done: clamped <= 0 }
}

export const pad2 = (n) => String(n).padStart(2, '0')
