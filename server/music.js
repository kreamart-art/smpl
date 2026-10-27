// Music publishing: tracks (a recording) and releases (single / EP / album, an
// ordered list of tracks). Files are the maker's own uploads, never copies: a
// track published from a battle entry points at that entry's audio file.
//
// Visibility: draft (owner only), unlisted (anyone with the link, never listed)
// or public. A draft's file name is unguessable and only ever sent to its owner.
// No play or like counters anywhere: SMPL has no public popularity numbers.
import { randomUUID } from 'node:crypto'

const VISIBILITY = new Set(['draft', 'unlisted', 'public'])
const RELEASE_TYPES = new Set(['single', 'ep', 'album'])
export const CREATIVE_ROLES = [
  'producer', 'beatmaker', 'rapper', 'vocalist', 'singer', 'songwriter', 'dj', 'engineer', 'musician', 'visual',
]

const str = (v, max) => String(v ?? '').trim().slice(0, max)
const vis = (v, fallback) => (VISIBILITY.has(v) ? v : fallback)

export function mountMusic(app, deps) {
  const { db, ok, fail, rateLimit, requireAuth, isStaff, uploadOwner, getUserRow, isBlocked, probeDuration, cleanBpm, cleanKey, STATUS } = deps

  db.exec(`CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY, userId TEXT, title TEXT, audioUrl TEXT, duration INTEGER,
    coverUrl TEXT, genre TEXT, bpm INTEGER, musicalKey TEXT, description TEXT,
    visibility TEXT, sourceSubmissionId TEXT, createdAt INTEGER, publishedAt INTEGER
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_tracks_user ON tracks (userId, createdAt)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_tracks_public ON tracks (visibility, publishedAt)')
  db.exec(`CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY, userId TEXT, type TEXT, title TEXT, coverUrl TEXT, description TEXT,
    releaseDate INTEGER, visibility TEXT, createdAt INTEGER, publishedAt INTEGER
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_releases_user ON releases (userId, createdAt)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_releases_public ON releases (visibility, publishedAt)')
  db.exec(`CREATE TABLE IF NOT EXISTS release_tracks (
    releaseId TEXT, trackId TEXT, position INTEGER, PRIMARY KEY (releaseId, trackId)
  )`)

  // Producers, artists (and dual-role makers) publish; staff too. Listeners
  // switch their account type first.
  const canPublish = (u) => !!u && (u.role === 'producer' || u.role === 'artist' || !!u.dualRole || isStaff(u))

  // Artwork must be the caller's own uploaded image; '' clears it.
  const ownImage = (v, user) => {
    if (v === '' || v === null) return ''
    if (typeof v !== 'string' || !/^\/api\/uploads\/i_[\w-]+\.(jpg|png|webp|gif)$/.test(v)) return undefined
    return uploadOwner(v) === user.id ? v : undefined
  }

  const makerOf = (userId) => {
    const u = getUserRow(userId)
    return u ? { id: u.id, alias: u.alias, avatar: u.avatar || '', verified: !!u.verified } : null
  }
  const canSee = (row, viewer) => !!row && (row.visibility !== 'draft' || viewer?.id === row.userId)
  const hiddenFrom = (row, viewer) => !!viewer && isBlocked(viewer.id, row.userId)

  const serTrack = (r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    audioUrl: r.audioUrl,
    duration: r.duration || 0,
    coverUrl: r.coverUrl || '',
    genre: r.genre || '',
    bpm: r.bpm || null,
    musicalKey: r.musicalKey || '',
    description: r.description || '',
    visibility: r.visibility,
    sourceSubmissionId: r.sourceSubmissionId || null,
    createdAt: r.createdAt,
    publishedAt: r.publishedAt || null,
  })
  const serRelease = (r, trackCount) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    title: r.title,
    coverUrl: r.coverUrl || '',
    description: r.description || '',
    releaseDate: r.releaseDate || r.createdAt,
    visibility: r.visibility,
    createdAt: r.createdAt,
    publishedAt: r.publishedAt || null,
    trackCount,
  })
  const getTrack = (id) => db.prepare('SELECT * FROM tracks WHERE id = ?').get(String(id))
  const getRelease = (id) => db.prepare('SELECT * FROM releases WHERE id = ?').get(String(id))
  const releaseTracks = (releaseId) =>
    db
      .prepare(
        'SELECT t.* FROM release_tracks rt JOIN tracks t ON t.id = rt.trackId WHERE rt.releaseId = ? ORDER BY rt.position',
      )
      .all(releaseId)
  // within a release, draft tracks show to the owner only
  const visibleTracks = (rows, viewer) => rows.filter((t) => canSee(t, viewer))
  const trackCountFor = (releaseId, viewer, ownerId) =>
    visibleTracks(releaseTracks(releaseId), viewer?.id === ownerId ? viewer : null).length

  const sourceOf = (track) => {
    if (!track.sourceSubmissionId) return null
    const sub = db.prepare('SELECT battleId FROM submissions WHERE id = ?').get(track.sourceSubmissionId)
    const b = sub ? db.prepare('SELECT id, title FROM battles WHERE id = ?').get(sub.battleId) : null
    return b ? { battleId: b.id, battleTitle: b.title } : null
  }

  const readTrackFields = (d, user, { creating }) => {
    const out = {}
    if (creating || d.title !== undefined) {
      const title = str(d.title, 120)
      if (!title) return { error: 'Give the track a title.' }
      out.title = title
    }
    if (d.coverUrl !== undefined) {
      const c = ownImage(d.coverUrl, user)
      if (c === undefined) return { error: 'Upload the cover yourself first.' }
      out.coverUrl = c
    }
    if (d.genre !== undefined) out.genre = str(d.genre, 40)
    if (d.bpm !== undefined) out.bpm = cleanBpm(d.bpm)
    if (d.musicalKey !== undefined) out.musicalKey = cleanKey(d.musicalKey)
    if (d.description !== undefined) out.description = str(d.description, 2000)
    if (d.visibility !== undefined) out.visibility = vis(d.visibility, 'draft')
    return { fields: out }
  }

  // ---- reading -------------------------------------------------------------
  app.get('/api/users/:id/music', (req, res) => {
    const owner = getUserRow(req.params.id)
    if (!owner || (req.user && isBlocked(req.user.id, owner.id))) return ok(res, { tracks: [], releases: [] })
    const self = req.user?.id === owner.id
    const where = self ? 'userId = ?' : "userId = ? AND visibility = 'public'"
    const tracks = db.prepare(`SELECT * FROM tracks WHERE ${where} ORDER BY COALESCE(publishedAt, createdAt) DESC`).all(owner.id)
    const releases = db
      .prepare(`SELECT * FROM releases WHERE ${where} ORDER BY COALESCE(releaseDate, createdAt) DESC`)
      .all(owner.id)
    return ok(res, {
      tracks: tracks.map(serTrack),
      releases: releases.map((r) => serRelease(r, trackCountFor(r.id, req.user, owner.id))),
    })
  })

  // the newest public releases and tracks across SMPL (Home "the drops", Discover)
  app.get('/api/music/latest', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48)
    const releases = db
      .prepare("SELECT * FROM releases WHERE visibility = 'public' ORDER BY publishedAt DESC LIMIT ?")
      .all(limit * 2)
      .filter((r) => !hiddenFrom(r, req.user))
      .map((r) => ({ ...serRelease(r, trackCountFor(r.id, null, r.userId)), maker: makerOf(r.userId) }))
      .filter((r) => r.trackCount > 0 && r.maker)
      .slice(0, limit)
    // a track that sits on a public release is shown through that release
    const tracks = db
      .prepare(
        `SELECT * FROM tracks WHERE visibility = 'public' AND id NOT IN (
           SELECT rt.trackId FROM release_tracks rt JOIN releases r ON r.id = rt.releaseId WHERE r.visibility = 'public'
         ) ORDER BY publishedAt DESC LIMIT ?`,
      )
      .all(limit * 2)
      .filter((t) => !hiddenFrom(t, req.user))
      .map((t) => ({ ...serTrack(t), maker: makerOf(t.userId) }))
      .filter((t) => t.maker)
      .slice(0, limit)
    return ok(res, { releases, tracks })
  })

  app.get('/api/tracks/:id', (req, res) => {
    const row = getTrack(req.params.id)
    if (!canSee(row, req.user) || hiddenFrom(row, req.user)) return fail(res, 404, 'Track not found.')
    const self = req.user?.id === row.userId
    const releases = db
      .prepare(
        'SELECT r.* FROM release_tracks rt JOIN releases r ON r.id = rt.releaseId WHERE rt.trackId = ? ORDER BY r.releaseDate DESC',
      )
      .all(row.id)
      .filter((r) => self || r.visibility === 'public')
      .map((r) => ({ id: r.id, title: r.title, type: r.type, coverUrl: r.coverUrl || '' }))
    return ok(res, { track: serTrack(row), maker: makerOf(row.userId), releases, source: sourceOf(row) })
  })

  app.get('/api/releases/:id', (req, res) => {
    const row = getRelease(req.params.id)
    if (!canSee(row, req.user) || hiddenFrom(row, req.user)) return fail(res, 404, 'Release not found.')
    const self = req.user?.id === row.userId
    const tracks = visibleTracks(releaseTracks(row.id), self ? req.user : null).map(serTrack)
    return ok(res, { release: serRelease(row, tracks.length), maker: makerOf(row.userId), tracks })
  })

  // ---- tracks --------------------------------------------------------------
  app.post('/api/tracks', rateLimit('track', 30, 60 * 60_000), requireAuth, async (req, res) => {
    if (!canPublish(req.user)) return fail(res, 403, 'Switch your account to producer or artist to publish music.')
    const d = req.body || {}
    const audioUrl = String(d.audioUrl || '')
    if (!/^\/api\/uploads\/a_[\w-]+\.\w+$/.test(audioUrl) || uploadOwner(audioUrl) !== req.user.id)
      return fail(res, 400, 'Upload your own audio first.')
    const r = readTrackFields(d, req.user, { creating: true })
    if (r.error) return fail(res, 400, r.error)
    const f = r.fields
    const now = Date.now()
    const visibility = f.visibility || 'draft'
    const id = `t_${randomUUID().slice(0, 10)}`
    db.prepare(
      `INSERT INTO tracks (id,userId,title,audioUrl,duration,coverUrl,genre,bpm,musicalKey,description,visibility,sourceSubmissionId,createdAt,publishedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id, req.user.id, f.title, audioUrl, await probeDuration(audioUrl), f.coverUrl || '', f.genre || '',
      f.bpm ?? null, f.musicalKey || '', f.description || '', visibility, null, now,
      visibility === 'public' ? now : null,
    )
    return ok(res, { track: serTrack(getTrack(id)) })
  })

  app.patch('/api/tracks/:id', requireAuth, (req, res) => {
    const row = getTrack(req.params.id)
    if (!row || row.userId !== req.user.id) return fail(res, 404, 'Track not found.')
    const r = readTrackFields(req.body || {}, req.user, { creating: false })
    if (r.error) return fail(res, 400, r.error)
    const f = r.fields
    // first time it goes public = its publish date
    if (f.visibility === 'public' && !row.publishedAt) f.publishedAt = Date.now()
    const keys = Object.keys(f)
    if (keys.length) {
      db.prepare(`UPDATE tracks SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => f[k]), row.id)
    }
    return ok(res, { track: serTrack(getTrack(row.id)) })
  })

  app.delete('/api/tracks/:id', requireAuth, (req, res) => {
    const row = getTrack(req.params.id)
    if (!row || row.userId !== req.user.id) return fail(res, 404, 'Track not found.')
    db.prepare('DELETE FROM release_tracks WHERE trackId = ?').run(row.id)
    db.prepare('DELETE FROM tracks WHERE id = ?').run(row.id)
    return ok(res, {})
  })

  // A finished battle entry becomes a track on the maker's profile, pointing at
  // the same file. Only after the result, so a blind entry is never unmasked.
  app.post('/api/submissions/:id/publish', rateLimit('track', 30, 60 * 60_000), requireAuth, (req, res) => {
    if (!canPublish(req.user)) return fail(res, 403, 'Switch your account to producer or artist to publish music.')
    const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id)
    if (!sub || sub.producerId !== req.user.id) return fail(res, 404, 'Entry not found.')
    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(sub.battleId)
    if (!battle || battle.status !== STATUS.WINNER_DECLARED) return fail(res, 400, 'Publish it once the battle has its result.')
    if (!/^\/?api\/uploads\//.test(sub.audioUrl || '')) return fail(res, 400, 'This entry has no uploaded audio.')
    const existing = db.prepare('SELECT * FROM tracks WHERE sourceSubmissionId = ? AND userId = ?').get(sub.id, req.user.id)
    if (existing) return ok(res, { track: serTrack(existing), existing: true })
    const title = str(req.body?.title, 120) || battle.title
    const visibility = vis(req.body?.visibility, 'public')
    const now = Date.now()
    const id = `t_${randomUUID().slice(0, 10)}`
    db.prepare(
      `INSERT INTO tracks (id,userId,title,audioUrl,duration,coverUrl,genre,bpm,musicalKey,description,visibility,sourceSubmissionId,createdAt,publishedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id, req.user.id, title, sub.audioUrl, sub.duration || 0, battle.cover || '', battle.genre || '',
      battle.bpm ?? null, battle.musicalKey || '', '', visibility, sub.id, now, visibility === 'public' ? now : null,
    )
    return ok(res, { track: serTrack(getTrack(id)) })
  })

  // ---- releases ------------------------------------------------------------
  const readReleaseFields = (d, user, { creating }) => {
    const out = {}
    if (creating || d.title !== undefined) {
      const title = str(d.title, 120)
      if (!title) return { error: 'Give the release a title.' }
      out.title = title
    }
    if (creating || d.type !== undefined) out.type = RELEASE_TYPES.has(d.type) ? d.type : 'single'
    if (d.coverUrl !== undefined) {
      const c = ownImage(d.coverUrl, user)
      if (c === undefined) return { error: 'Upload the cover yourself first.' }
      out.coverUrl = c
    }
    if (d.description !== undefined) out.description = str(d.description, 2000)
    if (d.releaseDate !== undefined) {
      const ms = Number(d.releaseDate)
      out.releaseDate = Number.isFinite(ms) && ms > 0 ? ms : null
    }
    if (d.visibility !== undefined) out.visibility = vis(d.visibility, 'draft')
    let trackIds
    if (d.trackIds !== undefined) {
      if (!Array.isArray(d.trackIds)) return { error: 'Pick the tracks for this release.' }
      trackIds = [...new Set(d.trackIds.map(String))].slice(0, 40)
      for (const tid of trackIds) {
        const t = getTrack(tid)
        if (!t || t.userId !== user.id) return { error: 'You can only add your own tracks.' }
      }
    }
    return { fields: out, trackIds }
  }
  const setTracks = (releaseId, trackIds) => {
    db.prepare('DELETE FROM release_tracks WHERE releaseId = ?').run(releaseId)
    const ins = db.prepare('INSERT INTO release_tracks (releaseId, trackId, position) VALUES (?,?,?)')
    trackIds.forEach((tid, i) => ins.run(releaseId, tid, i + 1))
  }

  app.post('/api/releases', rateLimit('release', 20, 60 * 60_000), requireAuth, (req, res) => {
    if (!canPublish(req.user)) return fail(res, 403, 'Switch your account to producer or artist to publish music.')
    const r = readReleaseFields(req.body || {}, req.user, { creating: true })
    if (r.error) return fail(res, 400, r.error)
    const f = r.fields
    const trackIds = r.trackIds || []
    const visibility = f.visibility || 'draft'
    if (visibility !== 'draft' && !trackIds.length) return fail(res, 400, 'Add at least one track before publishing.')
    const now = Date.now()
    const id = `r_${randomUUID().slice(0, 10)}`
    db.prepare(
      `INSERT INTO releases (id,userId,type,title,coverUrl,description,releaseDate,visibility,createdAt,publishedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id, req.user.id, f.type, f.title, f.coverUrl || '', f.description || '', f.releaseDate ?? now, visibility, now,
      visibility === 'public' ? now : null,
    )
    setTracks(id, trackIds)
    return ok(res, { release: serRelease(getRelease(id), trackIds.length) })
  })

  app.patch('/api/releases/:id', requireAuth, (req, res) => {
    const row = getRelease(req.params.id)
    if (!row || row.userId !== req.user.id) return fail(res, 404, 'Release not found.')
    const r = readReleaseFields(req.body || {}, req.user, { creating: false })
    if (r.error) return fail(res, 400, r.error)
    const f = r.fields
    const nextCount = r.trackIds ? r.trackIds.length : releaseTracks(row.id).length
    const nextVis = f.visibility || row.visibility
    if (nextVis !== 'draft' && !nextCount) return fail(res, 400, 'Add at least one track before publishing.')
    if (f.visibility === 'public' && !row.publishedAt) f.publishedAt = Date.now()
    const keys = Object.keys(f)
    if (keys.length) {
      db.prepare(`UPDATE releases SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => f[k]), row.id)
    }
    if (r.trackIds) setTracks(row.id, r.trackIds)
    return ok(res, { release: serRelease(getRelease(row.id), nextCount) })
  })

  app.delete('/api/releases/:id', requireAuth, (req, res) => {
    const row = getRelease(req.params.id)
    if (!row || row.userId !== req.user.id) return fail(res, 404, 'Release not found.')
    db.prepare('DELETE FROM release_tracks WHERE releaseId = ?').run(row.id)
    db.prepare('DELETE FROM releases WHERE id = ?').run(row.id)
    return ok(res, {})
  })

  return {
    // account deletion: a member's music leaves with them
    deleteForUser(userId) {
      const rel = db.prepare('SELECT id FROM releases WHERE userId = ?').all(userId)
      for (const r of rel) db.prepare('DELETE FROM release_tracks WHERE releaseId = ?').run(r.id)
      db.prepare('DELETE FROM releases WHERE userId = ?').run(userId)
      const trk = db.prepare('SELECT id FROM tracks WHERE userId = ?').all(userId)
      for (const t of trk) db.prepare('DELETE FROM release_tracks WHERE trackId = ?').run(t.id)
      db.prepare('DELETE FROM tracks WHERE userId = ?').run(userId)
    },
    exportForUser(userId) {
      return {
        tracks: db.prepare('SELECT * FROM tracks WHERE userId = ?').all(userId).map(serTrack),
        releases: db.prepare('SELECT * FROM releases WHERE userId = ?').all(userId).map((r) => serRelease(r, releaseTracks(r.id).length)),
      }
    },
    // public items for the sitemap
    publicUrls() {
      return [
        ...db.prepare("SELECT id FROM releases WHERE visibility = 'public'").all().map((r) => `/release/${r.id}`),
        ...db.prepare("SELECT id FROM tracks WHERE visibility = 'public'").all().map((t) => `/track/${t.id}`),
      ]
    },
  }
}
