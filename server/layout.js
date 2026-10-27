// Two layouts while the new one is in preview. dist/ is the new layout and
// dist-legacy/ the one everyone else still sees (built from legacy/). Accounts
// with users.newLayout = 1 get the new one: bootstrap hands them a signed
// cookie, and the file and page handlers read it, because a page request
// carries cookies but no bearer token. Once the new layout is everyone's,
// delete legacy/, vite.legacy.config.js and this file.
import { existsSync } from 'node:fs'
import express from 'express'
import { signValue, verifySignedValue } from './auth.js'

const COOKIE = 'smpl_layout'
const YEAR = 365 * 24 * 60 * 60

// Paths the current layout has no page for: a 404 there instead of a page
// that renders "not found" (and the sitemap leaves them out meanwhile).
export const LEGACY_MISSING = /^\/(home|discover|create|track|release|journal)(\/|$)/

// { present, uid }: uid only when the signature checks out
function readCookie(req) {
  const raw = String(req.headers.cookie || '')
    .split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
  if (raw === undefined) return { present: false, uid: null }
  let value = raw.slice(COOKIE.length + 1)
  try {
    value = decodeURIComponent(value)
  } catch {
    return { present: true, uid: null }
  }
  const dot = value.lastIndexOf('.')
  const uid = dot > 0 ? value.slice(0, dot) : ''
  return { present: true, uid: uid && verifySignedValue('layout', uid, value.slice(dot + 1)) ? uid : null }
}

export function createLayouts({ db, distDir, legacyDir }) {
  const dual = existsSync(`${distDir}/index.html`) && existsSync(`${legacyDir}/index.html`)
  const flagStmt = db.prepare('SELECT newLayout FROM users WHERE id = ?')
  const flagged = (uid) => !!uid && !!flagStmt.get(uid)?.newLayout

  // which build this request's page and files come from
  const pick = (req) => (!dual || flagged(readCookie(req).uid) ? 'new' : 'legacy')

  // For bootstrap: which build this session should run, with the cookie set or
  // cleared to match (so one reload lands there). null when there is one build.
  function sync(req, res) {
    if (!dual) return null
    const want = req.user?.newLayout ? 'new' : 'legacy'
    const { present, uid } = readCookie(req)
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
    if (want === 'new' && uid !== req.user.id) {
      const value = `${req.user.id}.${signValue('layout', req.user.id)}`
      res.append('Set-Cookie', `${COOKIE}=${value}; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${secure}`)
    } else if (want === 'legacy' && present) {
      res.append('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`)
    }
    return want
  }

  // Built files: the request's own layout first, then the other one, so the
  // shared files (icons, media, sw.js) only live in dist/. Pages go through
  // the catch-all, never the static index.html.
  const serveNew = express.static(distDir, { index: false })
  const serveLegacy = dual ? express.static(legacyDir, { index: false }) : null
  function serveStatic(req, res, next) {
    if (!serveLegacy) return serveNew(req, res, next)
    const [first, second] = pick(req) === 'new' ? [serveNew, serveLegacy] : [serveLegacy, serveNew]
    return first(req, res, (err) => (err ? next(err) : second(req, res, next)))
  }

  return { dual, pick, sync, serveStatic }
}
