// Guards for user-supplied URLs. Only web and mail links may be stored, so a
// saved link can never run script in someone else's browser when tapped.
const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

export function safeUrl(raw, max = 300) {
  let s = String(raw ?? '').trim()
  if (!s || s.length > max) return ''
  // a bare "instagram.com/x" is a web link; anything with its own scheme is judged as-is
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`
  try {
    return SAFE_PROTOCOLS.has(new URL(s).protocol) ? s : ''
  } catch {
    return ''
  }
}

export const MAX_LINKS = 12

export function cleanLinks(input) {
  if (!Array.isArray(input)) return []
  const out = []
  for (const l of input) {
    if (out.length >= MAX_LINKS) break
    if (!l || typeof l !== 'object') continue
    const label = String(l.label ?? '').trim().slice(0, 40)
    const url = safeUrl(l.url)
    if (label && url) out.push({ label, url })
  }
  return out
}

// A battle's source: our own uploads, the bundled sample library, or a web link.
export function safeSourceUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  if (/^\/?(api\/uploads|samples)\/[^\s]+$/.test(s) && !s.includes('..')) return s
  return /^https?:\/\//i.test(s) ? safeUrl(s, 500) : ''
}
