import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db, seedIfEmpty, pubUser, meUser, rowToBattle, rowToSubmission } from './db.js'
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js'
import { STATUS, nextStatus } from '../src/data/status.js'

// In dev, Vite owns 5190 and proxies /api here (5191). Only honour PORT in
// production, where this server serves everything on one port.
const PORT =
  process.env.NODE_ENV === 'production'
    ? process.env.PORT || 5191
    : process.env.SMPL_API_PORT || 5191
const seeded = seedIfEmpty()

const app = express()
app.use(cors())
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

// Serialise a submission with phase-aware anonymity. Identity + tallies are
// only exposed once the winner is declared; otherwise just a `mine` flag.
function serSub(s, battle, uid, counts) {
  const base = {
    id: s.id,
    battleId: s.battleId,
    duration: s.duration,
    createdAt: s.createdAt,
    approved: !!s.approved,
  }
  if (battle && battle.status === STATUS.WINNER_DECLARED) {
    return { ...base, producerId: s.producerId, votes: counts[s.id] || 0 }
  }
  return { ...base, mine: !!uid && s.producerId === uid }
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
  if (userRow) {
    const personal = personalize(activityItems().items, userRow.id).filter((i) => i.personal)
    unread = personal.filter((i) => i.ts > (userRow.lastSeenAt || 0)).length
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
  return items.map((i) => ({
    ...i,
    personal: !!((i.userId && followees.has(i.userId)) || i.userId === uid || mine.has(i.battleId)),
  }))
}

// ----- auth middleware -------------------------------------------------------
app.use((req, _res, next) => {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  const payload = token ? verifyToken(token) : null
  req.uid = payload?.uid || null
  req.user = req.uid ? getUserRow(req.uid) : null
  next()
})
const requireAuth = (req, res, next) => (req.user ? next() : fail(res, 401, 'Log in first.'))
const requireCurator = (req, res, next) =>
  req.user?.role === 'curator' ? next() : fail(res, 403, 'Curator only.')

// ----- health ----------------------------------------------------------------
app.get('/api/health', (_req, res) => ok(res, { seeded }))

// ----- auth ------------------------------------------------------------------
app.post('/api/auth/signup', (req, res) => {
  const { alias, email, role, name, dob, location, bio, genres, links, avatar, password } =
    req.body || {}
  const cleanAlias = String(alias || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanAlias || !cleanEmail) return fail(res, 400, 'Alias and email are required.')
  if (!password || String(password).length < 4) return fail(res, 400, 'Choose a password (min 4 chars).')
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
    role: role === 'producer' || role === 'vocalist' ? role : 'listener',
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
  }
  db.prepare(
    `INSERT INTO users (id,alias,email,role,name,dob,bio,location,links,genres,pastHistory,avatar,joinedAt,lastSeenAt,passwordHash)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    user.id, user.alias, user.email, user.role, user.name, user.dob, user.bio, user.location,
    user.links, user.genres, user.pastHistory, user.avatar, user.joinedAt, user.lastSeenAt,
    user.passwordHash,
  )
  const row = getUserRow(id)
  return ok(res, { token: signToken({ uid: id }), me: meUser(row) })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const row = getUserByEmail(String(email || '').trim())
  if (!row) return fail(res, 404, 'No account for that email. Try a quick-login chip or sign up.')
  if (!password) return fail(res, 400, 'Password required.')
  if (!verifyPassword(password, row.passwordHash)) return fail(res, 401, 'Wrong password.')
  return ok(res, { token: signToken({ uid: row.id }), me: meUser(row) })
})

app.get('/api/auth/me', requireAuth, (req, res) => ok(res, { me: meUser(req.user) }))

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
app.post('/api/battles', requireCurator, (req, res) => {
  const d = req.body || {}
  const t = Date.now()
  const DAY = 86400000
  const id = `b_${randomUUID().slice(0, 8)}`
  db.prepare(
    `INSERT INTO battles (id,kind,title,sampleUrl,sampleArtist,sampleSong,sampleDuration,sampleRevealed,description,curatorId,maxProducers,signupStart,signupEnd,submitStart,submitEnd,voteStart,voteEnd,status,attendees,signups,winnerSubmissionId)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id, d.kind === 'VERSES' ? 'VERSES' : 'BEATS',
    String(d.title || '').trim() || 'UNTITLED BATTLE', d.sampleUrl || '',
    String(d.sampleArtist || '').trim() || 'Unknown', String(d.sampleSong || '').trim() || 'Untitled sample',
    10, d.sampleRevealed ? 1 : 0, String(d.description || '').trim(), req.user.id,
    Number(d.maxProducers) || 8, t, t + 3 * DAY, t + 3 * DAY, t + 7 * DAY, t + 7 * DAY, t + 10 * DAY,
    STATUS.ANNOUNCED, '[]', '[]', null,
  )
  return ok(res, { battle: rowToBattle(getBattleRow(id)) })
})

app.patch('/api/battles/:id/status', requireCurator, (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  const status = req.body?.status || nextStatus(b.status)
  db.prepare('UPDATE battles SET status = ? WHERE id = ?').run(status, b.id)
  return ok(res, { battle: rowToBattle(getBattleRow(b.id)) })
})

app.post('/api/battles/:id/winner', requireCurator, (req, res) => {
  const b = getBattleRow(req.params.id)
  if (!b) return fail(res, 404, 'Battle not found.')
  const sub = getSubmissionRow(req.body?.submissionId)
  if (!sub || sub.battleId !== b.id) return fail(res, 400, 'Beat not in this battle.')
  db.prepare('UPDATE battles SET status = ?, winnerSubmissionId = ? WHERE id = ?').run(
    STATUS.WINNER_DECLARED, sub.id, b.id,
  )
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
  const need = b.kind === 'VERSES' ? 'vocalist' : 'producer'
  if (req.user.role !== need)
    return fail(
      res,
      403,
      need === 'vocalist' ? 'Only vocalists can claim a verse slot.' : 'Only producers can claim a slot.',
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
  if (!audioUrl && !soundcloudUrl && !youtubeUrl) return fail(res, 400, 'Add at least one link to your beat.')
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
  return ok(res, {})
})

app.patch('/api/submissions/:id/approve', requireCurator, (req, res) => {
  const s = getSubmissionRow(req.params.id)
  if (!s) return fail(res, 404, 'Beat not found.')
  db.prepare('UPDATE submissions SET approved = ? WHERE id = ?').run(s.approved ? 0 : 1, s.id)
  return ok(res, {})
})

// ----- votes -----------------------------------------------------------------
app.post('/api/battles/:id/vote', requireAuth, (req, res) => {
  const b = rowToBattle(getBattleRow(req.params.id))
  if (!b) return fail(res, 404, 'Battle not found.')
  if (b.status !== STATUS.VOTING_PHASE) return fail(res, 400, 'Voting is not open.')
  const already = db
    .prepare('SELECT 1 FROM votes WHERE battleId = ? AND userId = ?')
    .get(b.id, req.user.id)
  if (already) return fail(res, 409, 'You already voted in this battle.')
  const sub = getSubmissionRow(req.body?.submissionId)
  if (!sub || sub.battleId !== b.id) return fail(res, 400, 'Beat not found.')
  if (sub.producerId === req.user.id) return fail(res, 400, 'You cannot vote for your own beat.')
  db.prepare('INSERT INTO votes (id,battleId,submissionId,userId) VALUES (?,?,?,?)').run(
    `v_${randomUUID().slice(0, 8)}`, b.id, sub.id, req.user.id,
  )
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
  db.prepare('INSERT INTO follows (followerId,followeeId) VALUES (?,?)').run(req.user.id, target.id)
  return ok(res, { following: true })
})

// ----- profile editing -------------------------------------------------------
app.patch('/api/me', requireAuth, (req, res) => {
  const b = req.body || {}
  if (typeof b.avatar === 'string' && b.avatar.length > 1_500_000)
    return fail(res, 413, 'Image too large — pick something smaller.')
  const fields = []
  const vals = []
  const set = (k, v) => {
    fields.push(`${k} = ?`)
    vals.push(v)
  }
  if (typeof b.bio === 'string') set('bio', b.bio.trim())
  if (typeof b.location === 'string') set('location', b.location.trim())
  if (typeof b.name === 'string') set('name', b.name.trim())
  if (typeof b.dob === 'string') set('dob', b.dob.trim())
  if (typeof b.avatar === 'string') set('avatar', b.avatar)
  if (Array.isArray(b.links)) set('links', JSON.stringify(b.links))
  if (b.genres !== undefined) {
    const list = Array.isArray(b.genres)
      ? b.genres
      : String(b.genres || '').split(',').map((g) => g.trim()).filter(Boolean)
    set('genres', JSON.stringify(list))
  }
  if (fields.length) {
    vals.push(req.user.id)
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  }
  return ok(res, { me: meUser(getUserRow(req.user.id)) })
})

// ----- feed / notifications --------------------------------------------------
app.get('/api/feed', (req, res) => ok(res, { feed: personalize(activityItems().items, req.uid).slice(0, 60) }))

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

// ----- production: serve the built SPA from the same origin ------------------
const distDir = fileURLToPath(new URL('../dist', import.meta.url))
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(`${distDir}/index.html`)
  })
}

app.listen(PORT, () => {
  console.log(`[smpl-api] listening on http://localhost:${PORT}${seeded ? ' (seeded fresh db)' : ''}`)
})
