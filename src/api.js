// Tiny fetch wrapper. Token lives in localStorage and rides along as a Bearer.
const TOKEN_KEY = 'smpl_token'

// On the web the app is served from the same origin as the API, so relative
// paths work. Inside the Capacitor native shell the origin is the local bundle
// (https://localhost), so we must call the live backend absolutely. The Vite
// env var lets us override it per build if the domain ever changes.
const NATIVE = (() => {
  try {
    return !!window.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
})()
export const API_BASE = NATIVE ? import.meta.env.VITE_API_BASE || 'https://smpl.artnomad.nl' : ''

// Resolve a server-relative media path (uploads, audio, images) to an absolute
// URL when running natively; a no-op on the web.
export const mediaUrl = (p) => (typeof p === 'string' && p.startsWith('/') ? API_BASE + p : p || '')

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

async function req(method, path, body) {
  const headers = {}
  const tok = getToken()
  if (tok) headers.Authorization = `Bearer ${tok}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, error: 'Network error — is the server running?' }
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  if (data && typeof data.ok !== 'undefined') return data
  return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
}

// Raw binary upload (audio files) — sends the File as the body with its own
// content-type, so the server can stream it to disk without base64 bloat.
async function upload(path, file) {
  const headers = {}
  const tok = getToken()
  if (tok) headers.Authorization = `Bearer ${tok}`
  if (file?.type) headers['Content-Type'] = file.type
  let res
  try {
    res = await fetch(API_BASE + path, { method: 'POST', headers, body: file })
  } catch {
    return { ok: false, error: 'Network error — is the server running?' }
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  if (data && typeof data.ok !== 'undefined') return data
  return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b ?? {}),
  patch: (p, b) => req('PATCH', p, b ?? {}),
  del: (p) => req('DELETE', p),
  upload,
}
