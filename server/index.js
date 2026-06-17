import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { db, seedIfEmpty, migrate, pubUser, meUser, rowToBattle, rowToSubmission, normalizeHandle } from './db.js'
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomBase32,
  verifyTotp,
  otpauthURL,
  makeBackupCodes,
  hashBackup,
} from './auth.js'
import { STATUS, STATUS_INDEX, nextStatus } from '../src/data/status.js'
import { sendEmail, mailConfigured, resetEmail, verifyEmail as verifyEmailTpl, sourceEmail } from './email.js'
import { runBackup, listBackups, scheduleBackups } from './backup.js'
import { pushConfigured, vapidPublicKey, saveSubscription, removeSubscription, sendPush } from './push.js'
import { saveDeviceToken, removeDeviceToken } from './nativepush.js'

// Public origin used to build links inside emails (reset / verify). Override
// with SMPL_APP_URL; falls back to the live domain in prod, localhost in dev.
const APP_URL = (
  process.env.SMPL_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://usesmpl.com' : 'http://localhost:5190')
).replace(/\/$/, '')
// Where the contact form lands.
const CONTACT_TO = process.env.SMPL_CONTACT_EMAIL || 'info@usesmpl.com'

// In dev, Vite owns 5190 and proxies /api here (5191). Only honour PORT in
// production, where this server serves everything on one port.
const PORT =
  process.env.NODE_ENV === 'production'
    ? process.env.PORT || 5191
    : process.env.SMPL_API_PORT || 5191
const seeded = seedIfEmpty()
migrate()

// Uploaded audio (curator samples / open-verse beats) lives next to the DB —
// same persistent volume in production (/app/data/uploads).
const UPLOAD_DIR =
  process.env.SMPL_UPLOAD_DIR ||
  (process.env.SMPL_DB_PATH
    ? path.join(path.dirname(process.env.SMPL_DB_PATH), 'uploads')
    : fileURLToPath(new URL('./uploads', import.meta.url)))
mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
app.use(cors())
// Canonical host: 301 the old domain + www to https://usesmpl.com (the move off
// artnomad.nl). Keeps old links/bookmarks working without fronting the parent.
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase()
  if (host === 'smpl.artnomad.nl' || host === 'www.usesmpl.com') {
    return res.redirect(301, `https://usesmpl.com${req.originalUrl}`)
  }
  next()
})
app.use(express.json({ limit: '2mb' }))

// ----- helpers ---------------------------------------------------------------
const ok = (res, data = {}) => res.json({ ok: true, ...data })
const fail = (res, code, error) => res.status(code).json({ ok: false, error })

const getUserRow = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const getUserByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(String(email).toLowerCase())
const getUserByAliasRow = (alias) =>
  db.prepare('SELECT * FROM users WHERE lower(alias) = ?').get(String(alias).toLowerCase())
const getBattleRow = (id) => db.prepare('SELECT * FROM battles WHERE id = ?').get(id)
const getSubmissionRow = (id) => db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)

const allBattles = () => db.prepare('SELECT * FROM battles').all().map(rowToBattle)
const allUsersPub = () => db.prepare('SELECT * FROM users').all().map(pubUser)
const allFollows = () => db.prepare('SELECT followerId, followeeId FROM follows').all()

function voteCountMap() {
  const rows = db.prepare('SELECT submissionId, COUNT(*) AS c FROM votes GROUP BY submissionId').all()
  const m = {}
  for (const r of rows) m[r.submissionId] = r.c
  return m
}

// Derive the phase a scheduled battle should be in at `now`. Never auto-declares
// a winner — that's the curator's call; voting just closes at voteEnd.
function scheduledStatus(now, signupStart, signupEnd, submitEnd) {
  if (now >= submitEnd) return STATUS.VOTING_PHASE
  if (now >= signupEnd) return STATUS.SUBMISSION_PHASE
  if (now >= signupStart) return STATUS.OPEN_FOR_SIGNUP
  return STATUS.ANNOUNCED
}

// Roll scheduled battles forward to match their timeline (forward-only, runs on
// an interval). Manual battles (scheduled = 0) are untouched.
// Phase-change push: a broad "new battle" for discovery, a targeted "submissions
// open" to the entrants, and a "vote now" only to listeners who joined the room.
function pushBattlePhase(battle, target) {
  const b = rowToBattle(getBattleRow(battle.id))
  if (!b) return
  if (target === STATUS.OPEN_FOR_SIGNUP) {
    const ids = db.prepare('SELECT DISTINCT userId FROM push_subscriptions').all().map((r) => r.userId)
    for (const uid of ids) {
      sendPush(uid, {
        title: 'New battle open',
        body: `“${b.title}” is open for signups`,
        tag: `battle-${b.id}-${target}`,
        url: `/battles/${b.id}`,
      }).catch(() => {})
    }
  } else if (target === STATUS.SUBMISSION_PHASE) {
    for (const uid of b.signups) {
      sendPush(uid, {
        title: 'Submissions open',
        body: `Upload your beat for “${b.title}”`,
        tag: `battle-${b.id}-${target}`,
        url: `/battles/${b.id}`,
      }).catch(() => {})
    }
  } else if (target === STATUS.VOTING_PHASE) {
    for (const uid of b.attendees) {
      const u = getUserRow(uid)
      if (u && u.role === 'listener') {
        sendPush(uid, {
          title: 'Voting is open',
          body: `You’re in “${b.title}”, vote now`,
          tag: `battle-${b.id}-${target}`,
          url: `/battles/${b.id}`,
        }).catch(() => {})
      }
    }
  }
}

function autoAdvance() {
  const now = Date.now()
  const rows = db
    .prepare('SELECT id, status, signupStart, signupEnd, submitEnd, title FROM battles WHERE scheduled = 1')
    .all()
  for (const b of rows) {
    if (b.status === STATUS.WINNER_DECLARED) continue
    const target = scheduledStatus(now, b.signupStart, b.signupEnd, b.submitEnd)
    if (STATUS_INDEX[target] > STATUS_INDEX[b.status]) {
      db.prepare('UPDATE battles SET status = ? WHERE id = ?').run(target, b.id)
      pushBattlePhase(b, target)
    }
  }
}

// Serialise a submission with phase-aware anonymity. Identity + tallies are
// only exposed once the winner is declared; otherwise just a `mine` flag.
function serSub(s, battle, uid, counts) {
  const base = {
    id: s.id,
    battleId: s.battleId,
    duration: s.duration,
    createdAt: s.createdAt,
    approved: !!s.approved,
    disqualified: !!s.disqualified,
  }
  // Open voting reveals names from the voting phase on (vote for your
  // favourite). BLIND battles keep names hidden during voting — only the
  // opaque uploaded audio plays — and reveal everything at the winner.
  // Live tallies stay hidden until the winner is declared either way.
  const revealNames =
    battle &&
    ((battle.status === STATUS.VOTING_PHASE && !battle.blind) || battle.status === STATUS.WINNER_DECLARED)
  if (revealNames) {
    return {
      ...base,
      mine: !!uid && s.producerId === uid,
      producerId: s.producerId,
      audioUrl: s.audioUrl || '',
      soundcloudUrl: s.soundcloudUrl || '',
      youtubeUrl: s.youtubeUrl || '',
      ...(battle.status === STATUS.WINNER_DECLARED ? { votes: counts[s.id] || 0 } : {}),
    }
  }
  // Before voting opens, only the opaque uploaded file is exposed (no identity).
  const uploaded = s.audioUrl && s.audioUrl.startsWith('/api/uploads/') ? s.audioUrl : null
  return { ...base, mine: !!uid && s.producerId === uid, audioUrl: uploaded || undefined }
}

function buildBootstrap(uid, userRow) {
  const battles = allBattles()
  const byId = Object.fromEntries(battles.map((b) => [b.id, b]))
  const counts = voteCountMap()
  const subs = db.prepare('SELECT * FROM submissions').all().map(rowToSubmission)
  const submissions = subs.map((s) => serSub(s, byId[s.battleId], uid, counts))

  const revealed = new Set(
    battles.filter((b) => b.status === STATUS.WINNER_DECLARED).map((b) => b.id),
  )
  const voteRows = db.prepare('SELECT * FROM votes').all()
  const votes = voteRows
    .filter((v) => revealed.has(v.battleId))
    .map((v) => ({ id: v.id, battleId: v.battleId, submissionId: v.submissionId, userId: v.userId }))

  const myVotes = {}
  if (uid) for (const v of voteRows) if (v.userId === uid) myVotes[v.battleId] = v.submissionId

  let unread = 0
  let unreadMessages = 0
  let blocked = []
  if (userRow) {
    const personal = personalize(activityItems().items, userRow.id).filter((i) => i.personal)
    unread = personal.filter((i) => i.ts > (userRow.lastSeenAt || 0)).length
    unreadMessages = db
      .prepare('SELECT COUNT(*) AS c FROM messages WHERE toId = ? AND readAt IS NULL')
      .get(userRow.id).c
    blocked = db.prepare('SELECT blockedId FROM blocks WHERE blockerId=?').all(userRow.id).map((r) => r.blockedId)
  }

  return {
    me: userRow ? meUser(userRow) : null,
    users: allUsersPub(),
    battles,
    submissions,
    votes,
    myVotes,
    follows: allFollows(),
    unread,
    unreadMessages,
    blocked,
    mailConfigured,
    pushConfigured,
  }
}

// ----- activity feed / notifications ----------------------------------------
function activityItems() {
  const battles = allBattles()
  const counts = voteCountMap()
  const subs = db.prepare('SELECT * FROM submissions').all().map(rowToSubmission)
  const byBattle = {}
  for (const s of subs) (byBattle[s.battleId] ||= []).push(s)

  const items = []
  for (const b of battles) {
    const meta = { battleId: b.id, title: b.title, kind: b.kind }
    if (b.status === STATUS.WINNER_DECLARED) {
      const ranked = [...(byBattle[b.id] || [])].sort(
        (a, c) => (counts[c.id] || 0) - (counts[a.id] || 0),
      )
      const winner = ranked.find((s) => s.id === b.winnerSubmissionId) || ranked[0]
      if (winner)
        items.push({
          id: `win_${b.id}`, type: 'winner', ts: b.voteEnd, ...meta,
          userId: winner.producerId, votes: counts[winner.id] || 0,
        })
      ranked.forEach((s, i) =>
        items.push({
          id: `place_${s.id}`, type: 'placement', ts: b.voteEnd, ...meta,
          userId: s.producerId, position: i + 1, votes: counts[s.id] || 0,
        }),
      )
    } else if (b.status === STATUS.VOTING_PHASE) {
      items.push({ id: `vote_${b.id}`, type: 'voting', ts: b.voteStart, ...meta })
    } else if (b.status === STATUS.SUBMISSION_PHASE) {
      items.push({ id: `sub_${b.id}`, type: 'submission', ts: b.submitStart, ...meta })
    } else if (b.status === STATUS.OPEN_FOR_SIGNUP) {
      items.push({ id: `open_${b.id}`, type: 'signup', ts: b.signupStart, ...meta })
    } else {
      items.push({ id: `ann_${b.id}`, type: 'announced', ts: b.signupStart, ...meta })
    }
  }
  // "@x started following you" — surfaced to the followee in their notifications
  const follows = db.prepare('SELECT followerId, followeeId, createdAt FROM follows WHERE createdAt IS NOT NULL').all()
  for (const f of follows) {
    items.push({
      id: `fol_${f.followerId}_${f.followeeId}`,
      type: 'follow',
      ts: f.createdAt,
      actorId: f.followerId, // who followed (shown as the handle)
      userId: f.followeeId, // recipient (makes it personal to them)
    })
  }
  items.sort((a, c) => c.ts - a.ts)
  return { items }
}

function personalize(items, uid) {
  if (!uid) return items.map((i) => ({ ...i, personal: false }))
  const followees = new Set(
    db.prepare('SELECT followeeId FROM follows WHERE followerId = ?').all(uid).map((r) => r.followeeId),
  )
  const mine = new Set(
    allBattles()
      .filter((b) => b.attendees.includes(uid) || b.signups.includes(uid))
      .map((b) => b.id),
  )
  return items.map((i) => {
    // a follow only notifies the person who was followed — NOT their followers
    // (the followees rule below would otherwise leak it to them).
    if (i.type === 'follow') return { ...i, personal: i.userId === uid }
    return {
      ...i,
      // a battle opening for signup or voting is broadcast to everyone (come
      // join / come vote); winners + placements stay scoped to the people involved.
      personal: !!(
        i.type === 'signup' ||
        i.type === 'voting' ||
        (i.userId && followees.has(i.userId)) ||
        i.userId === uid ||
        mine.has(i.battleId)
      ),
    }
  })
}

// ----- auth middleware -------------------------------------------------------
app.use((req, _res, next) => {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  const payload = token ? verifyToken(token) : null
  // A half-issued 2FA ticket (twofa:true) is NOT a logged-in session — it only
  // works at /api/auth/2fa, read explicitly from the body there. Likewise a
  // single-purpose token (reset / verify) must never authenticate a session.
  req.uid = payload && !payload.twofa && !payload.purpose ? payload.uid || null : null
  req.user = req.uid ? getUserRow(req.uid) : null
  next()
})
const requireAuth = (req, res, next) => (req.user ? next() : fail(res, 401, 'Log in first.'))
// admin is a strict superset of curator — anything a curator can do, an admin can.
const isStaff = (user) => user?.role === 'curator' || user?.role === 'admin'
const requireCurator = (req, res, next) =>
  isStaff(req.user) ? next() : fail(res, 403, 'Curators only.')
const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : fail(res, 403, 'Admin only.')

// "House" accounts (the founder's admin + the official @SMPL) can hop between
// each other without re-login. Restricted so ordinary users can't farm accounts.
const isHouse = (u) => !!u && (u.role === 'admin' || u.alias === 'SMPL')

// Strict ownership: only the battle's own curator manages it — not other curators,
// not admins (the founder switches to the @SMPL account to manage its battles).
const canManageBattle = (user, battle) =>
  !!user && !!battle && battle.curatorId === user.id

// ----- simple in-memory rate limiting (fixed window per IP + route group) ----
const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'ip'
const rlHits = new Map()
const rateLimit = (name, max, windowMs) => (req, res, next) => {
  const key = `${name}:${clientIp(req)}`
  const now = Date.now()
  let e = rlHits.get(key)
  if (!e || now > e.reset) {
    e = { count: 0, reset: now + windowMs }
    rlHits.set(key, e)
  }
  if (++e.count > max) return fail(res, 429, 'Too many requests. Slow down and try again shortly.')
  next()
}
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rlHits) if (now > v.reset) rlHits.delete(k)
}, 5 * 60_000)

// Is one of these two users blocking the other?
const isBlocked = (a, b) =>
  !!db.prepare('SELECT 1 FROM blocks WHERE (blockerId=? AND blockedId=?) OR (blockerId=? AND blockedId=?)').get(a, b, b, a)

// ----- health ----------------------------------------------------------------
app.get('/api/health', (_req, res) => ok(res, { seeded }))

// ----- auth ------------------------------------------------------------------
const langOf = (req) => (String(req.body?.lang || '').toLowerCase() === 'nl' ? 'nl' : 'en')

// Whole-year age from a parseable date-of-birth string; null if missing/invalid.
function ageFromDob(s) {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a
}

// Fire off an email-verification link (1 week valid). Non-blocking — a failed or
// unconfigured send never breaks the request that triggered it.
function sendVerificationEmail(row, lang) {
  const token = signToken({ uid: row.id, purpose: 'verify' }, 7 * 24 * 60 * 60 * 1000)
  const link = `${APP_URL}/verify?token=${encodeURIComponent(token)}`
  const tpl = verifyEmailTpl(link, lang)
  return sendEmail({ to: row.email, subject: tpl.subject, text: tpl.text, html: tpl.html })
}

app.post('/api/auth/signup', rateLimit('signup', 6, 60 * 60_000), (req, res) => {
  const { alias, email, role, name, dob, location, bio, genres, links, avatar, password, acceptTerms } =
    req.body || {}
  if (!acceptTerms) return fail(res, 400, 'You must accept the Terms and Privacy Policy to sign up.')
  const cleanAlias = normalizeHandle(alias)
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (cleanAlias.length < 2 || !cleanEmail) return fail(res, 400, 'A handle (2+ letters or numbers) and email are required.')
  if (!password || String(password).length < 4) return fail(res, 400, 'Choose a password (min 4 chars).')
  // SMPL is 16+ (Terms + AVG digital-consent age) — enforce it on the dob.
  const age = ageFromDob(String(dob || '').trim())
  if (age === null) return fail(res, 400, 'Enter a valid date of birth.')
  if (age < 16) return fail(res, 400, 'You must be at least 16 to use SMPL.')
  if (cleanEmail === 'curator@smpl.app') return fail(res, 400, 'That account is reserved.')
  if (getUserByEmail(cleanEmail)) return fail(res, 409, 'An account with that email already exists.')
  if (getUserByAliasRow(cleanAlias)) return fail(res, 409, 'That alias is taken.')

  const genreList = Array.isArray(genres)
    ? genres
    : String(genres || '').split(',').map((g) => g.trim()).filter(Boolean)
  const id = `u_${randomUUID().slice(0, 8)}`
  const now = Date.now()
  const user = {
    id,
    alias: cleanAlias,
    email: cleanEmail,
    role: role === 'producer' || role === 'artist' ? role : 'listener',
    name: String(name || '').trim(),
    dob: String(dob || '').trim(),
    bio: String(bio || '').trim(),
    location: String(location || '').trim(),
    links: JSON.stringify(Array.isArray(links) ? links : []),
    genres: JSON.stringify(genreList),
    pastHistory: JSON.stringify([]),
    avatar: typeof avatar === 'string' && avatar.length < 1_500_000 ? avatar : '',
    joinedAt: now,
    lastSeenAt: now,
    passwordHash: hashPassword(password),
    acceptedTerms: now,
  }
  db.prepare(
    `INSERT INTO users (id,alias,email,role,name,dob,bio,location,links,genres,pastHistory,avatar,joinedAt,lastSeenAt,passwordHash,acceptedTerms)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    user.id, user.alias, user.email, user.role, user.name, user.dob, user.bio, user.location,
    user.links, user.genres, user.pastHistory, user.avatar, user.joinedAt, user.lastSeenAt,
    user.passwordHash, user.acceptedTerms,
  )
  // every new member starts out following the house account (@SMPL); they can unfollow later
  if (id !== 'u_smpl') {
    try {
      db.prepare('INSERT OR IGNORE INTO follows (followerId,followeeId,createdAt) VALUES (?,?,?)').run(id, 'u_smpl', now)
    } catch {}
  }
  const row = getUserRow(id)
  // kick off email verification (no-op if SMTP isn't configured yet)
  sendVerificationEmail(row, langOf(req)).catch(() => {})
  return ok(res, { token: signToken({ uid: id }), me: meUser(row) })
})

app.post('/api/auth/login', rateLimit('login', 25, 5 * 60_000), (req, res) => {
  const { email, password } = req.body || {}
  const row = getUserByEmail(String(email || '').trim())
  if (!row) return fail(res, 404, 'No account for that email. Try a quick-login chip or sign up.')
  if (!password) return fail(res, 400, 'Password required.')
  if (!verifyPassword(password, row.passwordHash)) return fail(res, 401, 'Wrong password.')
  if (row.totpEnabled) {
    // Hold the session — issue a short-lived ticket and ask for the 2FA code.
    return ok(res, { needs2fa: true, ticket: signToken({ uid: row.id, twofa: true }, 10 * 60 * 1000) })
  }
  return ok(res, { token: signToken({ uid: row.id }), me: meUser(row) })
})

// Step 2 of a 2FA login: redeem the ticket + a TOTP or backup code for a token.
app.post('/api/auth/2fa', (req, res) => {
  const { ticket, code } = req.body || {}
  const p = verifyToken(ticket)
  if (!p || !p.twofa || !p.uid) return fail(res, 401, 'Your 2FA session expired. Log in again.')
  const row = getUserRow(p.uid)
  if (!row || !row.totpEnabled) return fail(res, 400, '2FA is not active on this account.')
  let valid = verifyTotp(row.totpSecret, code)
  if (!valid) {
    // fall back to a one-time backup code
    const stored = JSON.parse(row.backupCodes || '[]')
    const idx = stored.indexOf(hashBackup(code))
    if (idx !== -1) {
      valid = true
      stored.splice(idx, 1)
      db.prepare('UPDATE users SET backupCodes = ? WHERE id = ?').run(JSON.stringify(stored), row.id)
    }
  }
  if (!valid) return fail(res, 401, 'Invalid code. Use your authenticator app or a backup code.')
  return ok(res, { token: signToken({ uid: row.id }), me: meUser(row) })
})

app.get('/api/auth/me', requireAuth, (req, res) => ok(res, { me: meUser(req.user) }))

// ----- password reset --------------------------------------------------------
app.post('/api/auth/forgot', rateLimit('forgot', 6, 30 * 60_000), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const row = email ? getUserByEmail(email) : null
  if (row) {
    const token = signToken({ uid: row.id, purpose: 'reset' }, 60 * 60_000) // 1 hour
    const link = `${APP_URL}/reset?token=${encodeURIComponent(token)}`
    const tpl = resetEmail(link, langOf(req))
    sendEmail({ to: row.email, subject: tpl.subject, text: tpl.text, html: tpl.html }).catch(() => {})
    // Dev convenience: with no SMTP wired up, return the link so the flow stays
    // testable. NEVER leaked in production.
    if (!mailConfigured && process.env.NODE_ENV !== 'production') {
      return ok(res, { sent: true, devLink: link })
    }
  }
  // Always report success — never reveal whether an email is registered.
  return ok(res, { sent: true })
})

app.post('/api/auth/reset', rateLimit('reset', 12, 30 * 60_000), (req, res) => {
  const { token, password } = req.body || {}
  const p = verifyToken(token)
  if (!p || p.purpose !== 'reset' || !p.uid) return fail(res, 400, 'This reset link is invalid or has expired.')
  const row = getUserRow(p.uid)
  if (!row) return fail(res, 400, 'This reset link is invalid or has expired.')
  if (!password || String(password).length < 4) return fail(res, 400, 'Choose a password (min 4 chars).')
  // a successful reset proves control of the inbox → verify the email too
  db.prepare('UPDATE users SET passwordHash = ?, emailVerified = 1 WHERE id = ?').run(hashPassword(password), row.id)
  // With 2FA on, a reset alone shouldn't grant a session — send them to log in.
  if (row.totpEnabled) return ok(res, { reset: true, needs2fa: true })
  return ok(res, { reset: true, token: signToken({ uid: row.id }), me: meUser(getUserRow(row.id)) })
})

// ----- email verification ----------------------------------------------------
app.post('/api/auth/verify-email', rateLimit('verify', 20, 30 * 60_000), (req, res) => {
  const p = verifyToken(req.body?.token)
  if (!p || p.purpose !== 'verify' || !p.uid) return fail(res, 400, 'This link is invalid or has expired.')
  const row = getUserRow(p.uid)
  if (!row) return fail(res, 400, 'This link is invalid or has expired.')
  db.prepare('UPDATE users SET emailVerified = 1 WHERE id = ?').run(row.id)
  return ok(res, { verified: true })
})

app.post('/api/auth/resend-verification', rateLimit('resend', 4, 30 * 60_000), requireAuth, (req, res) => {
  if (req.user.emailVerified) return ok(res, { sent: true, already: true })
  sendVerificationEmail(req.user, langOf(req)).catch(() => {})
  return ok(res, { sent: true, configured: mailConfigured })
})

// ----- bootstrap -------------------------------------------------------------
app.get('/api/bootstrap', (req, res) => ok(res, buildBootstrap(req.uid, req.user)))

// ----- battles (read) --------------------------------------------------------
app.get('/api/battles', (_req, res) => ok(res, { battles: allBattles() }))
app.get('/api/battles/:id', (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  return ok(res, { battle: rowToBattle(b) })
})

// ----- battles (curator) -----------------------------------------------------
// Edit a battle you curate (title, source, slots, options + the schedule/dates).
app.patch('/api/battles/:id', requireAuth, (req, res) => {
  const row = getBattleRow(req.params.id)
  if (!row) return fail(res, 404, 'Battle not found.')
  if (row.curatorId !== req.user.id) return fail(res, 403, 'That isn’t your battle.')
  const d = req.body || {}
  const fields = []
  const vals = []
  const set = (k, v) => {
    fields.push(`${k} = ?`)
    vals.push(v)
  }
  if (typeof d.title === 'string') set('title', d.title.trim() || 'UNTITLED BATTLE')
  if (typeof d.sampleArtist === 'string') set('sampleArtist', d.sampleArtist.trim() || 'Unknown')
  if (typeof d.sampleSong === 'string') set('sampleSong', d.sampleSong.trim() || 'Untitled sample')
  if (typeof d.sampleUrl === 'string') set('sampleUrl', d.sampleUrl)
  if (typeof d.description === 'string') set('description', d.description.trim())
  if (typeof d.genre === 'string') set('genre', d.genre.trim())
  if (d.maxProducers !== undefined) set('maxProducers', Math.max(2, Math.min(64, Number(d.maxProducers) || 8)))
  if (d.sampleRevealed !== undefined) set('sampleRevealed', d.sampleRevealed ? 1 : 0)
  if (d.blind !== undefined) set('blind', d.blind ? 1 : 0)
  if (d.scheduled !== undefined) {
    const sched = d.scheduled ? 1 : 0
    set('scheduled', sched)
    if (sched) {
      const s = Number(d.signupStart)
      const so = Number(d.submissionsOpen)
      const vo = Number(d.votingOpens)
      const vc = Number(d.votingCloses)
      if (![s, so, vo, vc].every(Number.isFinite)) return fail(res, 400, 'Fill in the full schedule.')
      if (!(s < so && so < vo && vo < vc))
        return fail(res, 400, 'The schedule must run in order: signup → submissions → voting → close.')
      set('signupStart', s)
      set('signupEnd', so)
      set('submitStart', so)
      set('submitEnd', vo)
      set('voteStart', vo)
      set('voteEnd', vc)
      // re-derive the phase from the new dates (never un-crown a declared winner)
      if (row.status !== STATUS.WINNER_DECLARED) set('status', scheduledStatus(Date.now(), s, so, vo))
    }
  }
  if (fields.length) {
    vals.push(row.id)
    db.prepare(`UPDATE battles SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  }
  return ok(res, { battle: rowToBattle(getBattleRow(row.id)) })
})

app.post('/api/battles', rateLimit('create', 15, 60 * 60_000), requireAuth, (req, res) => {
  const d = req.body || {}
  const kind = d.kind === 'VERSES' ? 'VERSES' : 'BEATS'
  // Only SMPL staff (curators + admin) organise battles. Producers + artists who
  // want a battle run for them pay a curation fee (phase 2) — they don't self-host.
  if (!isStaff(req.user)) {
    return fail(res, 403, 'Only SMPL curators can organise battles.')
  }
  const t = Date.now()
  const DAY = 86400000
  // Schedule: either curator-set (auto-runs the phases) or the default manual
  // timeline (the curator pushes phases forward by hand, as before).
  let signupStart = t,
    signupEnd = t + 3 * DAY,
    submitEnd = t + 7 * DAY,
    voteEnd = t + 10 * DAY
  let scheduled = 0
  if (d.scheduled) {
    const s = Number(d.signupStart)
    const so = Number(d.submissionsOpen)
    const vo = Number(d.votingOpens)
    const vc = Number(d.votingCloses)
    if (![s, so, vo, vc].every(Number.isFinite)) return fail(res, 400, 'Fill in the full schedule.')
    if (!(s < so && so < vo && vo < vc))
      return fail(res, 400, 'The schedule must run in order: signup → submissions → voting → close.')
    signupStart = s
    signupEnd = so
    submitEnd = vo
    voteEnd = vc
    scheduled = 1
  }
  const submitStart = signupEnd // phases are contiguous
  const voteStart = submitEnd
  const status = scheduled ? scheduledStatus(t, signupStart, signupEnd, submitEnd) : STATUS.ANNOUNCED
  const id = `b_${randomUUID().slice(0, 8)}`
  db.prepare(
    `INSERT INTO battles (id,kind,title,sampleUrl,sampleArtist,sampleSong,sampleDuration,sampleRevealed,description,curatorId,maxProducers,signupStart,signupEnd,submitStart,submitEnd,voteStart,voteEnd,status,attendees,signups,winnerSubmissionId,blind,scheduled,genre)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id, kind,
    String(d.title || '').trim() || 'UNTITLED BATTLE', d.sampleUrl || '',
    String(d.sampleArtist || '').trim() || 'Unknown', String(d.sampleSong || '').trim() || 'Untitled sample',
    10, d.sampleRevealed ? 1 : 0, String(d.description || '').trim(), req.user.id,
    Number(d.maxProducers) || 8, signupStart, signupEnd, submitStart, submitEnd, voteStart, voteEnd,
    status, '[]', '[]', null, d.blind ? 1 : 0, scheduled, String(d.genre || '').trim(),
  )
  // tell the host's followers a new battle just dropped
  const followers = db.prepare('SELECT followerId FROM follows WHERE followeeId=?').all(req.user.id)
  const title = String(d.title || '').trim() || 'a new battle'
  for (const f of followers) {
    sendPush(f.followerId, {
      title: `@${req.user.alias} started a battle`,
      body: title,
      tag: `battle-${id}`,
      url: `/battles/${id}`,
    }).catch(() => {})
  }
  return ok(res, { battle: rowToBattle(getBattleRow(id)) })
})

app.patch('/api/battles/:id/status', requireAuth, (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  if (!canManageBattle(req.user, b)) return fail(res, 403, 'You do not host this battle.')
  const status = req.body?.status || nextStatus(b.status)
  db.prepare('UPDATE battles SET status = ? WHERE id = ?').run(status, b.id)
  if (status !== b.status) pushBattlePhase(b, status)
  return ok(res, { battle: rowToBattle(getBattleRow(b.id)) })
})

app.post('/api/battles/:id/winner', requireAuth, (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  if (!canManageBattle(req.user, b)) return fail(res, 403, 'You do not host this battle.')
  const sub = getSubmissionRow(req.body?.submissionId)
  if (!sub || sub.battleId !== b.id) return fail(res, 400, 'Beat not in this battle.')
  if (sub.disqualified) return fail(res, 400, 'A disqualified entry can’t win.')
  db.prepare('UPDATE battles SET status = ?, winnerSubmissionId = ? WHERE id = ?').run(
    STATUS.WINNER_DECLARED, sub.id, b.id,
  )
  // notify the winner, then the other entrants and everyone who was in the room
  const winnerAlias = getUserRow(sub.producerId)?.alias || 'a maker'
  sendPush(sub.producerId, {
    title: 'You won',
    body: `Your beat won “${b.title}”`,
    tag: `win-${b.id}`,
    url: `/battles/${b.id}`,
  }).catch(() => {})
  const reached = new Set([sub.producerId])
  const entrants = db.prepare('SELECT DISTINCT producerId FROM submissions WHERE battleId = ?').all(b.id).map((r) => r.producerId)
  for (const uid of [...entrants, ...rowToBattle(getBattleRow(b.id)).attendees]) {
    if (reached.has(uid)) continue
    reached.add(uid)
    sendPush(uid, {
      title: 'Winner declared',
      body: `@${winnerAlias} won “${b.title}”`,
      tag: `win-${b.id}`,
      url: `/battles/${b.id}`,
    }).catch(() => {})
  }
  return ok(res, { battle: rowToBattle(getBattleRow(b.id)) })
})

// ----- attendance / registration --------------------------------------------
app.post('/api/battles/:id/attend', requireAuth, (req, res) => {
  const b = rowToBattle(getBattleRow(req.params.id))
  if (!b) return fail(res, 404, 'Battle not found.')
  const present = b.attendees.includes(req.user.id)
  const attendees = present
    ? b.attendees.filter((x) => x !== req.user.id)
    : [...b.attendees, req.user.id]
  db.prepare('UPDATE battles SET attendees = ? WHERE id = ?').run(JSON.stringify(attendees), b.id)
  return ok(res, { attending: !present })
})

app.post('/api/battles/:id/register', requireAuth, (req, res) => {
  const b = rowToBattle(getBattleRow(req.params.id))
  if (!b) return fail(res, 404, 'Battle not found.')
  if (!req.body?.agreeRules) return fail(res, 400, 'You must accept the battle rules to enter.')
  // hard rule: nobody competes in a battle they curate (conflict of interest)
  if (b.curatorId === req.user.id)
    return fail(res, 403, 'You curate this battle, so you can’t compete in it.')
  const need = b.kind === 'VERSES' ? 'artist' : 'producer'
  // a dual-role competitor (producer + artist) may enter either battle type;
  // a curator/admin who opted into competing may enter any battle that isn't theirs
  const isCompetitor = req.user.role === 'producer' || req.user.role === 'artist'
  const competingStaff = !!req.user.curatorCompetes && isStaff(req.user)
  const canEnter = req.user.role === need || (req.user.dualRole && isCompetitor) || competingStaff
  if (!canEnter)
    return fail(
      res,
      403,
      need === 'artist' ? 'Only artists can claim a verse slot.' : 'Only producers can claim a slot.',
    )
  if (b.status !== STATUS.OPEN_FOR_SIGNUP) return fail(res, 400, 'Signups are not open.')
  if (b.signups.includes(req.user.id)) return ok(res, {})
  if (b.signups.length >= b.maxProducers) return fail(res, 400, 'All slots are taken.')
  const signups = [...b.signups, req.user.id]
  const attendees = b.attendees.includes(req.user.id) ? b.attendees : [...b.attendees, req.user.id]
  db.prepare('UPDATE battles SET signups = ?, attendees = ? WHERE id = ?').run(
    JSON.stringify(signups), JSON.stringify(attendees), b.id,
  )
  return ok(res, {})
})

// ----- submissions -----------------------------------------------------------
app.post('/api/battles/:id/submissions', requireAuth, (req, res) => {
  const b = rowToBattle(getBattleRow(req.params.id))
  if (!b) return fail(res, 404, 'Battle not found.')
  if (!b.signups.includes(req.user.id)) return fail(res, 403, 'You are not registered for this battle.')
  if (b.status !== STATUS.SUBMISSION_PHASE) return fail(res, 400, 'Submissions are not open.')
  const { audioUrl, soundcloudUrl, youtubeUrl } = req.body || {}
  // upload-only: the beat must be a file uploaded to SMPL (keeps playback in-app, no external links)
  if (!audioUrl || !/^\/?(api\/uploads|samples)\//.test(audioUrl)) return fail(res, 400, 'Upload your beat first.')
  const existing = db
    .prepare('SELECT * FROM submissions WHERE battleId = ? AND producerId = ?')
    .get(b.id, req.user.id)
  if (existing) {
    db.prepare('UPDATE submissions SET audioUrl=?, soundcloudUrl=?, youtubeUrl=? WHERE id=?').run(
      audioUrl || '', soundcloudUrl || '', youtubeUrl || '', existing.id,
    )
    return ok(res, { updated: true })
  }
  db.prepare(
    `INSERT INTO submissions (id,battleId,producerId,audioUrl,soundcloudUrl,youtubeUrl,duration,createdAt,approved)
     VALUES (?,?,?,?,?,?,?,?,1)`,
  ).run(
    `s_${randomUUID().slice(0, 8)}`, b.id, req.user.id,
    audioUrl || '', soundcloudUrl || '', youtubeUrl || '', 15, Date.now(),
  )
  // tell the curator a new beat landed
  if (b.curatorId && b.curatorId !== req.user.id) {
    sendPush(b.curatorId, {
      title: 'New submission',
      body: `@${req.user.alias} submitted to “${b.title}”`,
      tag: `newsub-${b.id}`,
      url: `/battles/${b.id}`,
    }).catch(() => {})
  }
  return ok(res, {})
})

app.patch('/api/submissions/:id/approve', requireAuth, (req, res) => {
  const s = getSubmissionRow(req.params.id)
  if (!s) return fail(res, 404, 'Beat not found.')
  if (!canManageBattle(req.user, getBattleRow(s.battleId))) return fail(res, 403, 'You do not host this battle.')
  db.prepare('UPDATE submissions SET approved = ? WHERE id = ?').run(s.approved ? 0 : 1, s.id)
  if (!s.approved) {
    // just approved (it wasn't approved before)
    const bt = getBattleRow(s.battleId)
    sendPush(s.producerId, {
      title: 'Beat approved',
      body: `Your beat is in “${bt?.title || 'the battle'}”`,
      tag: `appr-${s.id}`,
      url: `/battles/${s.battleId}`,
    }).catch(() => {})
  }
  return ok(res, {})
})

// curator/admin disqualifies (or reinstates) an entry that breaks the rules.
app.post('/api/submissions/:id/disqualify', requireAuth, (req, res) => {
  const s = getSubmissionRow(req.params.id)
  if (!s) return fail(res, 404, 'Beat not found.')
  const b = getBattleRow(s.battleId)
  if (!canManageBattle(req.user, b)) return fail(res, 403, 'You do not host this battle.')
  const next = s.disqualified ? 0 : 1
  db.prepare('UPDATE submissions SET disqualified = ? WHERE id = ?').run(next, s.id)
  // a disqualified entry can't stand as the declared winner
  if (next && b.winnerSubmissionId === s.id) {
    db.prepare('UPDATE battles SET winnerSubmissionId = NULL WHERE id = ?').run(b.id)
  }
  if (next) {
    sendPush(s.producerId, {
      title: 'Entry disqualified',
      body: `Your entry in “${b.title || 'the battle'}” was disqualified`,
      tag: `dq-${s.id}`,
      url: `/battles/${b.id}`,
    }).catch(() => {})
  }
  return ok(res, { disqualified: !!next })
})

// ----- votes -----------------------------------------------------------------
app.post('/api/battles/:id/vote', rateLimit('vote', 40, 60_000), requireAuth, (req, res) => {
  const b = rowToBattle(getBattleRow(req.params.id))
  if (!b) return fail(res, 404, 'Battle not found.')
  if (b.status !== STATUS.VOTING_PHASE) return fail(res, 400, 'Voting is not open.')
  if (b.scheduled && Date.now() > b.voteEnd) return fail(res, 400, 'Voting has closed.')
  // anyone may vote on a battle — except the producers/artists competing in it
  if (b.signups.includes(req.user.id))
    return fail(res, 403, 'You’re competing in this battle, so you can’t vote here.')
  const already = db
    .prepare('SELECT 1 FROM votes WHERE battleId = ? AND userId = ?')
    .get(b.id, req.user.id)
  if (already) return fail(res, 409, 'You already voted in this battle.')
  const sub = getSubmissionRow(req.body?.submissionId)
  if (!sub || sub.battleId !== b.id) return fail(res, 400, 'Beat not found.')
  if (sub.disqualified) return fail(res, 400, 'That entry was disqualified.')
  if (sub.producerId === req.user.id) return fail(res, 400, 'You cannot vote for your own beat.')
  db.prepare('INSERT INTO votes (id,battleId,submissionId,userId) VALUES (?,?,?,?)').run(
    `v_${randomUUID().slice(0, 8)}`, b.id, sub.id, req.user.id,
  )
  // vote & lead milestones for the producer (skip blind battles so counts stay hidden)
  if (!b.blind) {
    const counts = db.prepare('SELECT submissionId, COUNT(*) n FROM votes WHERE battleId = ? GROUP BY submissionId').all(b.id)
    const mine = counts.find((c) => c.submissionId === sub.id)?.n || 0
    const others = counts.filter((c) => c.submissionId !== sub.id).map((c) => c.n)
    const maxOther = others.length ? Math.max(...others) : 0
    if ([5, 10, 25, 50, 100].includes(mine)) {
      sendPush(sub.producerId, {
        title: `${mine} votes`,
        body: `Your beat hit ${mine} votes in “${b.title}”`,
        tag: `votes-${sub.id}-${mine}`,
        url: `/battles/${b.id}`,
      }).catch(() => {})
    } else if (maxOther >= 1 && mine > maxOther && mine - 1 <= maxOther) {
      sendPush(sub.producerId, {
        title: 'You’re in the lead',
        body: `Your beat just took 1st in “${b.title}”`,
        tag: `lead-${b.id}-${sub.id}`,
        url: `/battles/${b.id}`,
      }).catch(() => {})
    }
  }
  return ok(res, {})
})

// Email the logged-in user a link to the battle source (sample/beat), so they
// can pick it up on their computer. Needs SMTP configured.
app.post('/api/battles/:id/email-source', rateLimit('emailsrc', 12, 30 * 60_000), requireAuth, async (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  if (!b.sampleRevealed || !b.sampleUrl || !/^\/?(api\/uploads|samples)\//.test(b.sampleUrl))
    return fail(res, 400, 'No downloadable source for this battle yet.')
  const role = req.user.role
  const allowed =
    role === 'curator' ||
    (b.kind === 'BEATS' && role === 'producer') ||
    (b.kind === 'VERSES' && role === 'artist')
  if (!allowed) return fail(res, 403, 'This download is for the battle’s makers.')
  if (!mailConfigured) return fail(res, 503, 'Email isn’t set up yet.')
  const link = `${APP_URL}${b.sampleUrl.startsWith('/') ? '' : '/'}${b.sampleUrl}`
  const tpl = sourceEmail(link, b, langOf(req))
  const r = await sendEmail({ to: req.user.email, subject: tpl.subject, text: tpl.text, html: tpl.html })
  if (!r.ok) return fail(res, 502, 'Could not send the email. Try again.')
  return ok(res, { sent: true, to: req.user.email })
})

// ----- comments on battle beats ----------------------------------------------
// Comments open once the maker behind a beat is revealed (open battle: voting
// phase; blind battle: after the winner is declared) — same gate as identity.
const commentsOpen = (b) =>
  !!b && ((b.status === STATUS.VOTING_PHASE && !b.blind) || b.status === STATUS.WINNER_DECLARED)

const serComment = (c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, user: pubUser(getUserRow(c.userId)) })

app.get('/api/submissions/:id/comments', (req, res) => {
  const sub = getSubmissionRow(req.params.id)
  if (!sub) return fail(res, 404, 'Beat not found.')
  const battle = rowToBattle(getBattleRow(sub.battleId))
  if (!commentsOpen(battle)) return ok(res, { comments: [], open: false })
  const rows = db.prepare('SELECT * FROM comments WHERE submissionId = ? ORDER BY createdAt ASC LIMIT 500').all(sub.id)
  return ok(res, { comments: rows.map(serComment), open: true })
})

app.post('/api/submissions/:id/comments', rateLimit('comment', 30, 60_000), requireAuth, (req, res) => {
  const sub = getSubmissionRow(req.params.id)
  if (!sub) return fail(res, 404, 'Beat not found.')
  const battle = rowToBattle(getBattleRow(sub.battleId))
  if (!commentsOpen(battle)) return fail(res, 400, 'Comments aren’t open on this beat yet.')
  const body = String(req.body?.body || '').trim()
  if (!body) return fail(res, 400, 'Write a comment first.')
  if (body.length > 1000) return fail(res, 400, 'That comment is too long.')
  if (isBlocked(req.user.id, sub.producerId)) return fail(res, 403, 'You can’t comment here.')
  const id = `c_${randomUUID().slice(0, 10)}`
  const createdAt = Date.now()
  db.prepare('INSERT INTO comments (id, submissionId, battleId, userId, body, createdAt) VALUES (?,?,?,?,?,?)').run(
    id, sub.id, sub.battleId, req.user.id, body, createdAt,
  )
  // ping the producer (unless they're commenting on their own beat)
  if (sub.producerId !== req.user.id) {
    sendPush(sub.producerId, {
      title: `@${req.user.alias} commented on your beat`,
      body: body.slice(0, 120),
      tag: `comment-${sub.id}`,
      url: `/battles/${sub.battleId}`,
    }).catch(() => {})
  }
  return ok(res, { comment: { id, body, createdAt, user: pubUser(req.user) } })
})

app.delete('/api/comments/:id', requireAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
  if (!c) return fail(res, 404, 'Comment not found.')
  const sub = getSubmissionRow(c.submissionId)
  const battle = sub ? getBattleRow(sub.battleId) : null
  // the author, the beat's maker, or the battle's staff can remove it
  const allowed = c.userId === req.user.id || (sub && sub.producerId === req.user.id) || canManageBattle(req.user, battle)
  if (!allowed) return fail(res, 403, 'You can’t remove this comment.')
  db.prepare('DELETE FROM comments WHERE id = ?').run(c.id)
  return ok(res, {})
})

// ----- profiles / social -----------------------------------------------------
app.get('/api/profiles/:alias', (req, res) => {
  const row = getUserByAliasRow(req.params.alias)
  if (!row) return fail(res, 404, 'Producer not found.')
  const self = req.uid === row.id
  return ok(res, { user: self ? meUser(row) : pubUser(row), self })
})

app.post('/api/users/:id/follow', requireAuth, (req, res) => {
  const target = getUserRow(req.params.id)
  if (!target) return fail(res, 404, 'User not found.')
  if (target.id === req.user.id) return fail(res, 400, 'You cannot follow yourself.')
  const has = db
    .prepare('SELECT 1 FROM follows WHERE followerId = ? AND followeeId = ?')
    .get(req.user.id, target.id)
  if (has) {
    db.prepare('DELETE FROM follows WHERE followerId = ? AND followeeId = ?').run(req.user.id, target.id)
    return ok(res, { following: false })
  }
  db.prepare('INSERT INTO follows (followerId,followeeId,createdAt) VALUES (?,?,?)').run(req.user.id, target.id, Date.now())
  // tell the followee on their devices (no-op without a push subscription)
  sendPush(target.id, {
    title: 'New follower',
    body: `@${req.user.alias} started following you`,
    tag: `follow-${req.user.id}`,
    url: `/profile/${req.user.alias}`,
  }).catch(() => {})
  return ok(res, { following: true })
})

// ----- block / unblock -------------------------------------------------------
app.post('/api/users/:id/block', requireAuth, (req, res) => {
  const target = getUserRow(req.params.id)
  if (!target) return fail(res, 404, 'User not found.')
  if (target.id === req.user.id) return fail(res, 400, 'You cannot block yourself.')
  const has = db.prepare('SELECT 1 FROM blocks WHERE blockerId=? AND blockedId=?').get(req.user.id, target.id)
  if (has) {
    db.prepare('DELETE FROM blocks WHERE blockerId=? AND blockedId=?').run(req.user.id, target.id)
    return ok(res, { blocked: false })
  }
  db.prepare('INSERT INTO blocks (blockerId, blockedId, createdAt) VALUES (?,?,?)').run(req.user.id, target.id, Date.now())
  // a block severs the follow in both directions
  db.prepare('DELETE FROM follows WHERE (followerId=? AND followeeId=?) OR (followerId=? AND followeeId=?)')
    .run(req.user.id, target.id, target.id, req.user.id)
  return ok(res, { blocked: true })
})

// ids the current user blocks — lets the client reflect block state
app.get('/api/blocks', requireAuth, (req, res) => {
  const ids = db.prepare('SELECT blockedId FROM blocks WHERE blockerId=?').all(req.user.id).map((r) => r.blockedId)
  return ok(res, { blocked: ids })
})

// ----- reports (safety) ------------------------------------------------------
const REPORT_TYPES = new Set(['user', 'battle', 'submission', 'message'])
app.post('/api/reports', rateLimit('report', 12, 60 * 60_000), requireAuth, (req, res) => {
  const { targetType, targetId, reason, context } = req.body || {}
  if (!REPORT_TYPES.has(targetType)) return fail(res, 400, 'Unknown report type.')
  if (!targetId) return fail(res, 400, 'Nothing to report.')
  db.prepare(
    'INSERT INTO reports (id, reporterId, targetType, targetId, reason, context, createdAt, resolved) VALUES (?,?,?,?,?,?,?,0)',
  ).run(
    `r_${randomUUID().slice(0, 10)}`, req.user.id, targetType, String(targetId),
    String(reason || '').trim().slice(0, 1000), String(context || '').slice(0, 200), Date.now(),
  )
  // alert moderators so reports get actioned within the 24h commitment
  for (const a of db.prepare("SELECT id FROM users WHERE role = 'admin'").all()) {
    sendPush(a.id, { title: 'New report', body: `A ${targetType} was reported`, tag: 'report', url: '/dashboard' }).catch(() => {})
  }
  return ok(res, {})
})

// curator-only moderation queue
app.get('/api/reports', requireAuth, requireCurator, (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY resolved ASC, createdAt DESC LIMIT 200').all()
  const reports = rows.map((r) => ({ ...r, resolved: !!r.resolved, reporter: pubUser(getUserRow(r.reporterId)) }))
  return ok(res, { reports })
})

app.post('/api/reports/:id/resolve', requireAuth, requireCurator, (req, res) => {
  db.prepare('UPDATE reports SET resolved=1 WHERE id=?').run(req.params.id)
  return ok(res, {})
})

// ----- database backups (admin-only) -----------------------------------------
app.get('/api/admin/backups', requireAuth, requireAdmin, (req, res) =>
  ok(res, { backups: listBackups().slice(0, 60) }),
)
app.post('/api/admin/backup', rateLimit('backup', 6, 10 * 60_000), requireAuth, requireAdmin, (req, res) => {
  try {
    const r = runBackup()
    return ok(res, { name: r.file.split('/').pop(), size: r.size })
  } catch (e) {
    return fail(res, 500, `Backup failed: ${e.message}`)
  }
})

// ----- admin: appoint / remove curators --------------------------------------
const ASSIGNABLE_ROLES = new Set(['curator', 'producer', 'artist', 'listener'])
app.post('/api/admin/users/:id/role', requireAuth, requireAdmin, (req, res) => {
  const target = getUserRow(req.params.id)
  if (!target) return fail(res, 404, 'User not found.')
  if (target.role === 'admin') return fail(res, 400, 'You can’t change an admin’s role.')
  const role = req.body?.role
  if (!ASSIGNABLE_ROLES.has(role)) return fail(res, 400, 'Invalid role.')
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, target.id)
  return ok(res, { user: pubUser(getUserRow(target.id)) })
})

// toggle (or set) the verified badge on a user
app.post('/api/admin/users/:id/verify', requireAuth, requireAdmin, (req, res) => {
  const target = getUserRow(req.params.id)
  if (!target) return fail(res, 404, 'User not found.')
  const next = req.body?.verified === undefined ? !target.verified : !!req.body.verified
  db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(next ? 1 : 0, target.id)
  if (next && !target.verified) {
    sendPush(target.id, {
      title: 'You’re verified',
      body: 'Your SMPL account is now verified',
      tag: 'verified',
      url: `/profile/${target.alias}`,
    }).catch(() => {})
  }
  return ok(res, { user: pubUser(getUserRow(target.id)) })
})

// ----- house-account switcher (admin-only mint) ------------------------------
// Lets the founder hop between the admin account + the official @SMPL without a
// re-login. Minting a house token requires admin; switching BACK to an account
// you already authenticated as is done client-side with a stored token, so a
// leaked @SMPL token can never call this to escalate up to the admin account.
app.get('/api/admin/accounts', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM users WHERE role = 'admin' OR alias = 'SMPL' ORDER BY alias").all()
  const accounts = rows.map((u) => ({
    id: u.id,
    alias: u.alias,
    avatar: u.avatar || '',
    verified: !!u.verified,
    current: u.id === req.user.id,
  }))
  return ok(res, { accounts })
})

app.post('/api/admin/switch', requireAuth, requireAdmin, (req, res) => {
  const target = getUserRow(req.body?.userId)
  if (!isHouse(target)) return fail(res, 400, 'Not a switchable account.')
  return ok(res, { token: signToken({ uid: target.id }), me: meUser(target) })
})

// ----- web push notifications ------------------------------------------------
app.get('/api/push/key', (req, res) => ok(res, { key: vapidPublicKey, configured: pushConfigured }))
app.post('/api/push/subscribe', requireAuth, (req, res) => {
  const sub = req.body?.subscription
  if (!sub?.endpoint) return fail(res, 400, 'Bad subscription.')
  saveSubscription(req.user.id, sub)
  return ok(res, {})
})
app.post('/api/push/unsubscribe', requireAuth, (req, res) => {
  removeSubscription(req.body?.endpoint)
  return ok(res, {})
})
// native app (Capacitor) device tokens — APNs (iOS) / FCM (Android)
app.post('/api/push/native-register', requireAuth, (req, res) => {
  const { token, platform } = req.body || {}
  if (!token) return fail(res, 400, 'No device token.')
  saveDeviceToken(req.user.id, String(token), platform)
  return ok(res, {})
})
app.post('/api/push/native-unregister', requireAuth, (req, res) => {
  removeDeviceToken(req.body?.token)
  return ok(res, {})
})

// ----- contact form (public) -------------------------------------------------
app.post('/api/contact', rateLimit('contact', 5, 30 * 60_000), async (req, res) => {
  const from = String(req.body?.email || '').trim()
  const msg = String(req.body?.message || '').trim()
  const topic = String(req.body?.topic || '').trim().slice(0, 40)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) return fail(res, 400, 'Enter a valid email so we can reply.')
  if (msg.length < 5) return fail(res, 400, 'Write a short message first.')
  if (msg.length > 5000) return fail(res, 400, 'That message is too long.')
  if (!mailConfigured) return fail(res, 503, 'Contact isn’t set up yet. Email us directly.')
  const r = await sendEmail({
    to: CONTACT_TO,
    replyTo: from,
    subject: `SMPL contact${topic ? ` · ${topic}` : ''} from ${from}`,
    text: `From: ${from}\nTopic: ${topic || 'none'}\n\n${msg}`,
  })
  if (!r.ok) return fail(res, 502, 'Could not send. Try again or email us directly.')
  return ok(res, { sent: true })
})

// ----- profile editing -------------------------------------------------------
// handles that nobody can self-assign (house/staff/impersonation risks)
const RESERVED_ALIASES = new Set([
  'smpl', 'admin', 'curator', 'support', 'help', 'staff', 'team',
  'system', 'official', 'mod', 'moderator', 'root', 'security',
])

app.patch('/api/me', requireAuth, (req, res) => {
  const b = req.body || {}
  if (typeof b.avatar === 'string' && b.avatar.length > 1_500_000)
    return fail(res, 413, 'Image too large. Pick something smaller.')
  const fields = []
  const vals = []
  const set = (k, v) => {
    fields.push(`${k} = ?`)
    vals.push(v)
  }
  if (typeof b.bio === 'string') set('bio', b.bio.trim())
  if (typeof b.location === 'string') set('location', b.location.trim())
  if (typeof b.contactEmail === 'string') {
    const ce = b.contactEmail.trim()
    if (ce && !/^\S+@\S+\.\S+$/.test(ce)) return fail(res, 400, 'That contact email doesn’t look right.')
    set('contactEmail', ce)
  }
  if (typeof b.name === 'string') set('name', b.name.trim())
  if (typeof b.dob === 'string') set('dob', b.dob.trim())
  if (typeof b.phone === 'string') set('phone', b.phone.trim().slice(0, 40))
  if (typeof b.country === 'string') set('country', b.country.trim().slice(0, 80))
  if (typeof b.city === 'string') set('city', b.city.trim().slice(0, 80))
  if (typeof b.avatar === 'string') set('avatar', b.avatar)
  if (Array.isArray(b.links)) set('links', JSON.stringify(b.links))
  if (b.genres !== undefined) {
    const list = Array.isArray(b.genres)
      ? b.genres
      : String(b.genres || '').split(',').map((g) => g.trim()).filter(Boolean)
    set('genres', JSON.stringify(list))
  }
  // self-service identity: change your handle (alias) and/or login email
  let reverify = false
  if (typeof b.alias === 'string') {
    const a = normalizeHandle(b.alias)
    if (a !== req.user.alias) {
      if (a.length < 2) return fail(res, 400, 'Handle needs at least 2 letters or numbers.')
      if (RESERVED_ALIASES.has(a.toLowerCase())) return fail(res, 409, 'That handle is reserved.')
      const taken = getUserByAliasRow(a)
      if (taken && taken.id !== req.user.id) return fail(res, 409, 'That handle is taken.')
      set('alias', a)
    }
  }
  if (typeof b.email === 'string' && b.email.trim().toLowerCase() !== String(req.user.email || '').toLowerCase()) {
    const e = b.email.trim()
    if (!/^\S+@\S+\.\S+$/.test(e)) return fail(res, 400, 'That email doesn’t look right.')
    if (e.toLowerCase() === 'curator@smpl.app') return fail(res, 409, 'That email is reserved.')
    const taken = getUserByEmail(e)
    if (taken && taken.id !== req.user.id) return fail(res, 409, 'An account with that email already exists.')
    set('email', e)
    set('emailVerified', 0) // a new address must be re-verified (badge stays untouched)
    reverify = true
  }
  if (fields.length) {
    vals.push(req.user.id)
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  }
  if (reverify) sendVerificationEmail(getUserRow(req.user.id), langOf(req)).catch(() => {})
  return ok(res, { me: meUser(getUserRow(req.user.id)) })
})

// Self-service account type. A listener who decides to compete can become a
// producer/artist (and back); staff tiers (curator/admin) are NOT changeable here.
const SELF_ROLES = new Set(['listener', 'producer', 'artist'])
app.post('/api/me/role', requireAuth, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'curator')
    return fail(res, 403, 'Staff roles can’t be changed here.')
  const role = req.body?.role
  if (!SELF_ROLES.has(role)) return fail(res, 400, 'Pick listener, producer or artist.')
  // "dual" = also compete in the other type; only meaningful for producer/artist
  const dual = role !== 'listener' && req.body?.dual ? 1 : 0
  db.prepare('UPDATE users SET role = ?, dualRole = ? WHERE id = ?').run(role, dual, req.user.id)
  return ok(res, { me: meUser(getUserRow(req.user.id)) })
})

// Staff opt-in: a curator/admin may also compete in battles — but never in a
// battle they curate (enforced at /register). Turning it on requires accepting
// the extra terms.
app.post('/api/me/curator-competes', requireAuth, (req, res) => {
  if (!isStaff(req.user)) return fail(res, 403, 'Only curators can enable this.')
  const on = !!req.body?.on
  if (on && !req.body?.agree)
    return fail(res, 400, 'You must accept the competing terms to turn this on.')
  db.prepare('UPDATE users SET curatorCompetes = ? WHERE id = ?').run(on ? 1 : 0, req.user.id)
  return ok(res, { me: meUser(getUserRow(req.user.id)) })
})

// ----- community sample makers (phase 1: apply → review → submit) -------------
const SAMPLE_MODELS = new Set(['license', 'royalty', 'both'])

// Any member (producer/artist/listener) can apply to become a sample maker.
app.post('/api/me/sample-maker', requireAuth, (req, res) => {
  const model = String(req.body?.model || '')
  if (!SAMPLE_MODELS.has(model)) return fail(res, 400, 'Pick a payout model.')
  if (!req.body?.agree) return fail(res, 400, 'You must accept the sample-maker terms.')
  if (req.user.sampleMakerStatus === 'approved') {
    db.prepare('UPDATE users SET sampleMakerModel = ? WHERE id = ?').run(model, req.user.id)
  } else {
    db.prepare('UPDATE users SET sampleMakerStatus = ?, sampleMakerModel = ?, sampleMakerAt = ? WHERE id = ?').run(
      'pending', model, Date.now(), req.user.id,
    )
  }
  return ok(res, { me: meUser(getUserRow(req.user.id)) })
})

// An approved maker submits a sample (audio already uploaded) → goes to review.
app.post('/api/samples', requireAuth, (req, res) => {
  if (req.user.sampleMakerStatus !== 'approved')
    return fail(res, 403, 'Only approved sample makers can submit samples.')
  const b = req.body || {}
  const name = String(b.name || '').trim().slice(0, 120)
  const genre = String(b.genre || '').trim().slice(0, 60)
  const url = String(b.url || '')
  if (!name || !genre) return fail(res, 400, 'Add a name and a genre.')
  if (!/^\/?(api\/uploads|samples)\//.test(url)) return fail(res, 400, 'Upload the sample audio first.')
  const bpm = Number(b.bpm) || null
  const key = String(b.key || '').trim().slice(0, 12) || null
  const id = `s_${randomUUID().slice(0, 8)}`
  db.prepare('INSERT INTO samples (id,makerId,genre,name,bpm,sampleKey,url,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)').run(
    id, req.user.id, genre, name, bpm, key, url, 'pending', Date.now(),
  )
  return ok(res, { id })
})

// A maker's own submissions (any status).
app.get('/api/me/samples', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id,genre,name,bpm,sampleKey,url,status,createdAt FROM samples WHERE makerId = ? ORDER BY createdAt DESC')
    .all(req.user.id)
  return ok(res, { samples: rows.map((r) => ({ ...r, key: r.sampleKey })) })
})

// Approved community samples — feeds the curator's library picker.
app.get('/api/samples', requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT id,makerId,genre,name,bpm,sampleKey,url FROM samples WHERE status = 'approved' ORDER BY genre, name")
    .all()
  return ok(res, {
    samples: rows.map((r) => ({
      id: r.id,
      genre: r.genre,
      name: r.name,
      bpm: r.bpm,
      key: r.sampleKey,
      file: r.url,
      maker: getUserRow(r.makerId)?.alias || null,
    })),
  })
})

// Admin review queue: pending applicants + pending samples.
app.get('/api/admin/sample-makers', requireAuth, requireAdmin, (req, res) => {
  const apps = db
    .prepare("SELECT id, alias, role, sampleMakerModel, sampleMakerAt FROM users WHERE sampleMakerStatus = 'pending' ORDER BY sampleMakerAt")
    .all()
  const subs = db
    .prepare("SELECT id,makerId,genre,name,bpm,sampleKey,url,createdAt FROM samples WHERE status = 'pending' ORDER BY createdAt")
    .all()
  return ok(res, {
    applicants: apps.map((a) => ({ id: a.id, alias: a.alias, role: a.role, model: a.sampleMakerModel, at: a.sampleMakerAt })),
    samples: subs.map((s) => ({
      id: s.id, maker: getUserRow(s.makerId)?.alias || null, genre: s.genre, name: s.name, bpm: s.bpm, key: s.sampleKey, file: s.url, at: s.createdAt,
    })),
  })
})

app.post('/api/admin/sample-makers/:id', requireAuth, requireAdmin, (req, res) => {
  const status = req.body?.status === 'approved' ? 'approved' : 'rejected'
  const u = getUserRow(req.params.id)
  if (!u) return fail(res, 404, 'User not found.')
  db.prepare('UPDATE users SET sampleMakerStatus = ? WHERE id = ?').run(status, u.id)
  sendPush(u.id, {
    title: status === 'approved' ? 'Sample maker approved' : 'Sample maker update',
    body: status === 'approved' ? 'You can now submit samples to the library' : 'Your sample maker application wasn’t approved',
    tag: 'samplemaker',
    url: '/sample-maker',
  }).catch(() => {})
  return ok(res, { status })
})

app.post('/api/admin/samples/:id', requireAuth, requireAdmin, (req, res) => {
  const status = req.body?.status === 'approved' ? 'approved' : 'rejected'
  const s = db.prepare('SELECT * FROM samples WHERE id = ?').get(req.params.id)
  if (!s) return fail(res, 404, 'Sample not found.')
  db.prepare('UPDATE samples SET status = ? WHERE id = ?').run(status, s.id)
  sendPush(s.makerId, {
    title: status === 'approved' ? 'Sample approved' : 'Sample update',
    body: status === 'approved' ? `“${s.name}” is live in the library` : `“${s.name}” wasn’t approved`,
    tag: `sample-${s.id}`,
    url: '/sample-maker',
  }).catch(() => {})
  return ok(res, { status })
})

// AVG/GDPR right to data portability — everything we hold about you, as JSON.
app.get('/api/me/export', requireAuth, (req, res) => {
  const uid = req.user.id
  const data = {
    exportedAt: new Date().toISOString(),
    account: meUser(req.user),
    submissions: db.prepare('SELECT * FROM submissions WHERE producerId = ?').all(uid),
    votes: db.prepare('SELECT id, battleId, submissionId FROM votes WHERE userId = ?').all(uid),
    following: db.prepare('SELECT followeeId, createdAt FROM follows WHERE followerId = ?').all(uid),
    followers: db.prepare('SELECT followerId, createdAt FROM follows WHERE followeeId = ?').all(uid),
    comments: db.prepare('SELECT id, submissionId, battleId, body, createdAt FROM comments WHERE userId = ?').all(uid),
    messagesSent: db
      .prepare('SELECT id, toId, body, imageUrl, audioUrl, createdAt FROM messages WHERE fromId = ? AND deletedAt IS NULL')
      .all(uid),
  }
  return ok(res, { data })
})

// ----- two-factor auth (TOTP) ------------------------------------------------
app.post('/api/me/2fa/setup', requireAuth, (req, res) => {
  if (req.user.totpEnabled) return fail(res, 400, '2FA is already on. Turn it off first to re-enrol.')
  const secret = randomBase32(20)
  db.prepare('UPDATE users SET totpSecret = ? WHERE id = ?').run(secret, req.user.id)
  return ok(res, { secret, otpauth: otpauthURL(secret, req.user.email || req.user.alias) })
})

app.post('/api/me/2fa/enable', requireAuth, (req, res) => {
  if (req.user.totpEnabled) return fail(res, 400, '2FA is already on.')
  if (!req.user.totpSecret) return fail(res, 400, 'Start setup first.')
  if (!verifyTotp(req.user.totpSecret, req.body?.code))
    return fail(res, 401, 'That code is not right. Check your authenticator and try again.')
  const codes = makeBackupCodes(8)
  db.prepare('UPDATE users SET totpEnabled = 1, backupCodes = ? WHERE id = ?').run(
    JSON.stringify(codes.map(hashBackup)), req.user.id,
  )
  return ok(res, { backupCodes: codes })
})

app.post('/api/me/2fa/disable', requireAuth, (req, res) => {
  if (!verifyPassword(req.body?.password, req.user.passwordHash)) return fail(res, 401, 'Wrong password.')
  db.prepare('UPDATE users SET totpEnabled = 0, totpSecret = NULL, backupCodes = NULL WHERE id = ?').run(
    req.user.id,
  )
  return ok(res, { disabled: true })
})

// ----- delete account --------------------------------------------------------
// Re-auth with the password, then sever the person from the platform while
// keeping battle integrity: vote tallies + submissions stay (anonymised), any
// curated battles fall back to the house account, social edges are dropped.
app.post('/api/me/delete', requireAuth, (req, res) => {
  if (req.user.id === 'curator') return fail(res, 403, 'The house curator account cannot be deleted.')
  if (!verifyPassword(req.body?.password, req.user.passwordHash)) return fail(res, 401, 'Wrong password.')
  const uid = req.user.id
  try {
    db.exec('BEGIN')
    db.prepare("UPDATE votes SET userId = '__deleted__' WHERE userId = ?").run(uid)
    db.prepare("UPDATE submissions SET producerId = '__deleted__' WHERE producerId = ?").run(uid)
    db.prepare("UPDATE battles SET curatorId = 'curator' WHERE curatorId = ?").run(uid)
    for (const b of db.prepare('SELECT id, attendees, signups FROM battles').all()) {
      const att = JSON.parse(b.attendees || '[]').filter((x) => x !== uid)
      const sig = JSON.parse(b.signups || '[]').filter((x) => x !== uid)
      db.prepare('UPDATE battles SET attendees = ?, signups = ? WHERE id = ?').run(
        JSON.stringify(att), JSON.stringify(sig), b.id,
      )
    }
    db.prepare('DELETE FROM follows WHERE followerId = ? OR followeeId = ?').run(uid, uid)
    db.prepare('DELETE FROM users WHERE id = ?').run(uid)
    db.exec('COMMIT')
  } catch {
    db.exec('ROLLBACK')
    return fail(res, 500, 'Could not delete the account. Nothing was changed.')
  }
  return ok(res, { deleted: true })
})

// ----- feed / notifications --------------------------------------------------
app.get('/api/feed', (req, res) =>
  ok(res, { feed: personalize(activityItems().items, req.uid).filter((i) => i.type !== 'follow').slice(0, 60) }),
)

app.get('/api/notifications', requireAuth, (req, res) => {
  const personal = personalize(activityItems().items, req.user.id).filter((i) => i.personal)
  const lastSeen = req.user.lastSeenAt || 0
  return ok(res, {
    notifications: personal.slice(0, 40),
    unread: personal.filter((i) => i.ts > lastSeen).length,
    lastSeenAt: lastSeen,
  })
})

app.post('/api/notifications/seen', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?').run(Date.now(), req.user.id)
  return ok(res, {})
})

// ----- direct messages -------------------------------------------------------
// 1:1 DMs with an Instagram-style "requests" split: a thread from someone you
// don't follow and haven't replied to lands in Requests, not your main inbox.
app.get('/api/threads', requireAuth, (req, res) => {
  const uid = req.user.id
  const rows = db
    .prepare('SELECT * FROM messages WHERE fromId = ? OR toId = ? ORDER BY createdAt ASC')
    .all(uid, uid)
  const followees = new Set(
    db.prepare('SELECT followeeId FROM follows WHERE followerId = ?').all(uid).map((r) => r.followeeId),
  )
  const byPartner = {}
  for (const m of rows) {
    const partner = m.fromId === uid ? m.toId : m.fromId
    const t = (byPartner[partner] ||= { partner, last: null, unread: 0, sentByMe: false })
    t.last = m // rows are ascending, so the final assignment is the newest
    if (m.fromId === uid) t.sentByMe = true
    if (m.toId === uid && !m.readAt) t.unread++
  }
  const threads = Object.values(byPartner)
    .map((t) => {
      if (isBlocked(uid, t.partner)) return null // hide threads with blocked people
      const u = pubUser(getUserRow(t.partner))
      if (!u) return null
      const L = t.last
      const kind = L.deletedAt
        ? 'deleted'
        : L.imageUrl
          ? 'image'
          : L.audioUrl
            ? 'audio'
            : L.shareKind === 'profile'
              ? 'profile'
              : L.shareKind === 'event'
                ? 'event'
                : L.battleId || L.shareKind === 'battle'
                  ? 'battle'
                  : 'text'
      return {
        user: u,
        last: {
          body: L.deletedAt ? '' : L.body,
          createdAt: L.createdAt,
          mine: L.fromId === uid,
          battleId: L.deletedAt ? null : L.battleId || null,
          kind,
        },
        unread: t.unread,
        isRequest: !t.sentByMe && !followees.has(t.partner),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.last.createdAt - a.last.createdAt)
  return ok(res, { threads })
})

app.get('/api/threads/:alias', requireAuth, (req, res) => {
  const other = getUserByAliasRow(req.params.alias)
  if (!other) return fail(res, 404, 'User not found.')
  const uid = req.user.id
  if (other.id === uid) return fail(res, 400, 'That conversation is with yourself.')
  const msgs = db
    .prepare(
      'SELECT * FROM messages WHERE (fromId = ? AND toId = ?) OR (fromId = ? AND toId = ?) ORDER BY createdAt ASC',
    )
    .all(uid, other.id, other.id, uid)
  db.prepare('UPDATE messages SET readAt = ? WHERE toId = ? AND fromId = ? AND readAt IS NULL').run(
    Date.now(), uid, other.id,
  )
  const byId = {}
  for (const m of msgs) byId[m.id] = m
  // all reactions for the thread in one query, grouped per message + emoji
  const reactByMsg = {}
  const ids = msgs.map((m) => m.id)
  if (ids.length) {
    const ph = ids.map(() => '?').join(',')
    for (const r of db.prepare(`SELECT messageId, emoji, userId FROM message_reactions WHERE messageId IN (${ph})`).all(...ids)) {
      const list = (reactByMsg[r.messageId] ||= {})
      const e = (list[r.emoji] ||= { emoji: r.emoji, count: 0, mine: false })
      e.count++
      if (r.userId === uid) e.mine = true
    }
  }
  const preview = (m) => {
    if (!m) return null
    const mine = m.fromId === uid
    if (m.deletedAt) return { id: m.id, mine, kind: 'deleted' }
    if (m.imageUrl) return { id: m.id, mine, kind: 'image' }
    if (m.audioUrl) return { id: m.id, mine, kind: 'audio' }
    if (m.shareKind) return { id: m.id, mine, kind: m.shareKind }
    return { id: m.id, mine, kind: 'text', snippet: (m.body || '').slice(0, 90) }
  }
  return ok(res, {
    user: pubUser(other),
    messages: msgs.map((m) => ({
      id: m.id,
      body: m.deletedAt ? '' : m.body,
      createdAt: m.createdAt,
      mine: m.fromId === uid,
      battleId: m.deletedAt ? null : m.battleId || null,
      imageUrl: m.deletedAt ? null : m.imageUrl || null,
      audioUrl: m.deletedAt ? null : m.audioUrl || null,
      shareKind: m.deletedAt ? null : m.shareKind || null,
      shareRef: m.deletedAt ? null : m.shareRef || null,
      reply: m.deletedAt ? null : preview(byId[m.replyTo]),
      reactions: m.deletedAt ? [] : Object.values(reactByMsg[m.id] || {}),
      photoStamps: m.deletedAt ? [] : safeStamps(m.photoStamps),
      readAt: m.readAt || null,
      deleted: !!m.deletedAt,
    })),
  })
})

app.post('/api/messages', rateLimit('msg', 40, 60_000), requireAuth, (req, res) => {
  const { toAlias, body, battleId, replyTo, imageUrl, audioUrl, shareKind, shareRef } = req.body || {}
  const text = String(body || '').trim()
  let bId = null
  if (battleId) {
    if (!getBattleRow(battleId)) return fail(res, 404, 'Battle not found.')
    bId = battleId
  }
  // attachments must be our own opaque uploads
  const img = typeof imageUrl === 'string' && /^\/api\/uploads\/i_/.test(imageUrl) ? imageUrl : null
  const aud = typeof audioUrl === 'string' && /^\/api\/uploads\/a_/.test(audioUrl) ? audioUrl : null
  // a shared card: a profile (alias), a battle (id) or a future event (id)
  let sKind = null
  let sRef = null
  if (typeof shareKind === 'string' && typeof shareRef === 'string' && shareRef) {
    if (shareKind === 'profile') {
      const pu = getUserByAliasRow(shareRef)
      if (pu) {
        sKind = 'profile'
        sRef = pu.alias
      }
    } else if (shareKind === 'battle') {
      if (getBattleRow(shareRef)) {
        sKind = 'battle'
        sRef = shareRef
      }
    } else if (shareKind === 'event') {
      sKind = 'event'
      sRef = shareRef.slice(0, 64)
    }
  }
  if (!text && !bId && !img && !aud && !sKind) return fail(res, 400, 'Write something first.')
  if (text.length > 2000) return fail(res, 400, 'That message is too long.')
  const other = getUserByAliasRow(toAlias)
  if (!other) return fail(res, 404, 'User not found.')
  if (other.id === req.user.id) return fail(res, 400, 'You cannot message yourself.')
  if (isBlocked(req.user.id, other.id)) return fail(res, 403, 'You can’t message this person.')
  // a reply must point at a real message in THIS conversation
  let rId = null
  if (replyTo) {
    const rm = db.prepare('SELECT fromId, toId FROM messages WHERE id = ?').get(String(replyTo))
    if (rm && ((rm.fromId === req.user.id && rm.toId === other.id) || (rm.fromId === other.id && rm.toId === req.user.id))) {
      rId = String(replyTo)
    }
  }
  const id = `m_${randomUUID().slice(0, 10)}`
  db.prepare(
    'INSERT INTO messages (id, fromId, toId, body, createdAt, readAt, battleId, replyTo, imageUrl, audioUrl, shareKind, shareRef) VALUES (?,?,?,?,?,NULL,?,?,?,?,?,?)',
  ).run(id, req.user.id, other.id, text, Date.now(), bId, rId, img, aud, sKind, sRef)
  // notify the recipient on their devices (no-op if they have no subscriptions)
  const shareWord = sKind === 'profile' ? 'Shared a profile with you' : sKind === 'event' ? 'Shared an event with you' : 'Shared a battle with you'
  sendPush(other.id, {
    title: `@${req.user.alias}`,
    body: text ? text.slice(0, 140) : img ? 'Sent a photo' : aud ? 'Sent a voice clip' : shareWord,
    tag: `dm-${req.user.id}`,
    url: `/messages/${req.user.alias}`,
  }).catch(() => {})
  return ok(res, { id })
})

// toggle an emoji reaction on a message in your conversation
const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮', '😢', '🙏']
app.post('/api/messages/:id/react', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return fail(res, 404, 'Message not found.')
  const uid = req.user.id
  if (m.fromId !== uid && m.toId !== uid) return fail(res, 403, 'Not your conversation.')
  if (m.deletedAt) return fail(res, 400, 'That message was deleted.')
  const emoji = String(req.body?.emoji || '').trim()
  const existing = db.prepare('SELECT emoji FROM message_reactions WHERE messageId=? AND userId=?').get(m.id, uid)
  if (!emoji || (existing && existing.emoji === emoji)) {
    db.prepare('DELETE FROM message_reactions WHERE messageId=? AND userId=?').run(m.id, uid)
    return ok(res, { emoji: null })
  }
  if (!REACTIONS.includes(emoji)) return fail(res, 400, 'Unsupported reaction.')
  db.prepare(
    'INSERT INTO message_reactions (messageId, userId, emoji, createdAt) VALUES (?,?,?,?) ON CONFLICT(messageId, userId) DO UPDATE SET emoji=excluded.emoji, createdAt=excluded.createdAt',
  ).run(m.id, uid, emoji, Date.now())
  return ok(res, { emoji })
})

// emoji "stickers" stamped onto a DM photo at a point (x,y are 0..1 fractions)
const STAMP_EMOJI = ['❤️', '🔥', '😂', '😮', '👏', '💯', '🎤', '🎧', '👀', '🥲']
function safeStamps(raw) {
  try {
    const a = JSON.parse(raw || '[]')
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

app.post('/api/messages/:id/stamp', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return fail(res, 404, 'Message not found.')
  const uid = req.user.id
  if (m.fromId !== uid && m.toId !== uid) return fail(res, 403, 'Not your conversation.')
  if (m.deletedAt || !m.imageUrl) return fail(res, 400, 'That message has no photo.')
  const emoji = String(req.body?.emoji || '').trim()
  if (!STAMP_EMOJI.includes(emoji)) return fail(res, 400, 'Unsupported emoji.')
  const x = Number(req.body?.x)
  const y = Number(req.body?.y)
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return fail(res, 400, 'Bad position.')
  const stamps = safeStamps(m.photoStamps)
  if (stamps.length >= 60) return fail(res, 400, 'This photo is full of stickers.')
  stamps.push({ id: `st_${randomUUID().slice(0, 8)}`, emoji, x, y, by: uid })
  db.prepare('UPDATE messages SET photoStamps = ? WHERE id = ?').run(JSON.stringify(stamps), m.id)
  return ok(res, { stamps })
})

app.delete('/api/messages/:id/stamp/:stampId', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return fail(res, 404, 'Message not found.')
  const uid = req.user.id
  if (m.fromId !== uid && m.toId !== uid) return fail(res, 403, 'Not your conversation.')
  // you can only peel off your own stickers
  const stamps = safeStamps(m.photoStamps).filter((s) => !(s.id === req.params.stampId && s.by === uid))
  db.prepare('UPDATE messages SET photoStamps = ? WHERE id = ?').run(JSON.stringify(stamps), m.id)
  return ok(res, { stamps })
})

// unsend your own message (soft delete → renders as "message deleted")
app.delete('/api/messages/:id', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return fail(res, 404, 'Message not found.')
  if (m.fromId !== req.user.id) return fail(res, 403, 'You can only unsend your own messages.')
  if (m.deletedAt) return ok(res, {})
  db.prepare(
    "UPDATE messages SET deletedAt=?, body='', imageUrl=NULL, audioUrl=NULL, battleId=NULL, replyTo=NULL, photoStamps=NULL WHERE id=?",
  ).run(Date.now(), m.id)
  db.prepare('DELETE FROM message_reactions WHERE messageId=?').run(m.id)
  return ok(res, {})
})

// ----- audio uploads (curator-only) ------------------------------------------
// Served under /api/uploads so the dev Vite proxy (/api → api server) and the
// single-origin production server both reach the files without extra config.
app.use('/api/uploads', express.static(UPLOAD_DIR, { maxAge: '1y', immutable: true }))

const AUDIO_EXT = {
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/wave': 'wav', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac',
  'audio/ogg': 'ogg', 'audio/webm': 'webm', 'audio/flac': 'flac', 'audio/x-flac': 'flac',
}

// Strip ID3 tags so an uploaded beat can't carry the producer's name into the
// anonymous voting phase. Handles ID3v2 (front) + ID3v1 (last 128 bytes), which
// covers MP3; the magic-byte checks make it a safe no-op for other containers.
function stripAudioMetadata(buf) {
  let start = 0
  let end = buf.length
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size =
      ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f)
    start = 10 + size + (buf[5] & 0x10 ? 10 : 0) // +10 if a footer is present
  }
  if (end - start >= 128 && buf[end - 128] === 0x54 && buf[end - 127] === 0x41 && buf[end - 126] === 0x47) {
    end -= 128 // trailing 'TAG' (ID3v1)
  }
  return start > 0 || end < buf.length ? buf.subarray(start, end) : buf
}

// Any logged-in user can upload audio: curators (samples) + competitors
// (beats/verses). Files get an opaque name and stripped tags, so a beat stays
// anonymous when its URL is exposed during blind voting.
app.post(
  '/api/uploads/audio',
  rateLimit('upload', 30, 60 * 60_000),
  requireAuth,
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '30mb' }),
  (req, res) => {
    const buf = req.body
    if (!buf || !buf.length) return fail(res, 400, 'No audio received.')
    const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    const ext = AUDIO_EXT[ct]
    if (!ext) return fail(res, 415, 'Unsupported audio. Use mp3, wav, m4a, aac, ogg or flac.')
    const name = `a_${randomUUID().slice(0, 12)}.${ext}`
    try {
      writeFileSync(path.join(UPLOAD_DIR, name), stripAudioMetadata(buf))
    } catch {
      return fail(res, 500, 'Could not store the file.')
    }
    return ok(res, { url: `/api/uploads/${name}` })
  },
)

const IMAGE_EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic',
}

// Image attachments for DMs (and anywhere else). Stored opaque under /api/uploads.
app.post(
  '/api/uploads/image',
  rateLimit('upload', 40, 60 * 60_000),
  requireAuth,
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '12mb' }),
  (req, res) => {
    const buf = req.body
    if (!buf || !buf.length) return fail(res, 400, 'No image received.')
    const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    const ext = IMAGE_EXT[ct]
    if (!ext) return fail(res, 415, 'Unsupported image. Use jpg, png, webp or gif.')
    const name = `i_${randomUUID().slice(0, 12)}.${ext}`
    try {
      writeFileSync(path.join(UPLOAD_DIR, name), buf)
    } catch {
      return fail(res, 500, 'Could not store the image.')
    }
    return ok(res, { url: `/api/uploads/${name}` })
  },
)

// ----- SEO: a live sitemap of every public page (marketing + battles + profiles)
app.get('/sitemap.xml', (req, res) => {
  const base = (APP_URL || 'https://usesmpl.com').replace(/\/$/, '')
  const urls = []
  const add = (path, priority, freq) =>
    urls.push(
      `  <url><loc>${base}${path}</loc>${freq ? `<changefreq>${freq}</changefreq>` : ''}${
        priority ? `<priority>${priority}</priority>` : ''
      }</url>`,
    )
  add('/', '1.0', 'daily')
  add('/battles', '0.9', 'hourly')
  add('/people', '0.7', 'daily')
  add('/signup', '0.6', 'monthly')
  add('/help', '0.5', 'monthly')
  add('/contact', '0.4', 'yearly')
  add('/privacy', '0.3', 'yearly')
  add('/terms', '0.3', 'yearly')
  add('/guidelines', '0.3', 'yearly')
  add('/copyright', '0.3', 'yearly')
  try {
    for (const b of db.prepare('SELECT id FROM battles').all())
      add(`/battles/${encodeURIComponent(b.id)}`, '0.8', 'daily')
    for (const u of db.prepare('SELECT alias FROM users').all())
      add(`/profile/${encodeURIComponent(u.alias)}`, '0.5', 'weekly')
  } catch {
    /* a missing table shouldn't break the sitemap */
  }
  res.set('Content-Type', 'application/xml; charset=utf-8')
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  )
})

// ----- production: serve the built SPA from the same origin ------------------
const distDir = fileURLToPath(new URL('../dist', import.meta.url))
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(`${distDir}/index.html`)
  })
}

// Run scheduled battles forward on boot + every minute.
autoAdvance()
setInterval(autoAdvance, 60_000)

// Automated daily DB snapshots — on in production, opt-in elsewhere.
if (process.env.NODE_ENV === 'production' || process.env.SMPL_BACKUPS === '1') {
  scheduleBackups()
}

app.listen(PORT, () => {
  console.log(`[smpl-api] listening on http://localhost:${PORT}${seeded ? ' (seeded fresh db)' : ''}`)
})
