// The Journal: SMPL's editorial layer. Articles move draft -> review ->
// scheduled/published. Authors write, editors (and the house accounts) publish;
// nobody gets editorial rights automatically. Every article carries a label
// (editorial / artist / sponsored) so paid placement never reads as SMPL's own
// endorsement.
//
// The body is plain text in a small markdown subset (##, ###, >, -, **bold**,
// _italic_, [text](url), ![alt](/api/uploads/i_.. "credit") and embed lines like
// @battle:b_x / @release:r_x / @track:t_x / @artist:ALIAS). It is stored as
// text and rendered by the client into React elements only: no HTML ever.
import { randomUUID } from 'node:crypto'

export const CATEGORIES = ['artists', 'sound', 'scene', 'industry', 'originals']
const LABELS = new Set(['editorial', 'artist', 'sponsored'])
const STATUSES = new Set(['draft', 'review', 'scheduled', 'published'])

const str = (v, max) => String(v ?? '').trim().slice(0, max)
const readMinutes = (body) => Math.max(1, Math.round(String(body || '').split(/\s+/).filter(Boolean).length / 200))

export function slugify(s) {
  return (
    String(s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'story'
  )
}

export function mountJournal(app, deps) {
  const { db, ok, fail, rateLimit, requireAuth, requireAdmin, isHouse, uploadOwner, getUserRow, getUserByAliasRow } = deps

  db.exec(`CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY, slug TEXT UNIQUE, title TEXT, standfirst TEXT, body TEXT,
    coverUrl TEXT, coverAlt TEXT, coverCredit TEXT, category TEXT, tags TEXT,
    authorId TEXT, label TEXT, sponsorName TEXT, status TEXT,
    scheduledAt INTEGER, publishedAt INTEGER, createdAt INTEGER, updatedAt INTEGER,
    seoTitle TEXT, seoDescription TEXT, related TEXT, reviewedBy TEXT
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles (status, publishedAt)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_articles_author ON articles (authorId, updatedAt)')
  // who may write for the Journal: '' | 'author' | 'editor' (admin-granted)
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
  if (!cols.includes('editorRole')) db.exec('ALTER TABLE users ADD COLUMN editorRole TEXT')

  const canWrite = (u) => !!u && (u.editorRole === 'author' || u.editorRole === 'editor' || isHouse(u))
  const canPublish = (u) => !!u && (u.editorRole === 'editor' || isHouse(u))

  const P = (v, d = []) => {
    try {
      return JSON.parse(v) ?? d
    } catch {
      return d
    }
  }
  const authorOf = (id) => {
    const u = getUserRow(id)
    return u ? { id: u.id, alias: u.alias, avatar: u.avatar || '', verified: !!u.verified } : null
  }
  const getById = (id) => db.prepare('SELECT * FROM articles WHERE id = ?').get(String(id))
  const getBySlug = (slug) => db.prepare('SELECT * FROM articles WHERE slug = ?').get(String(slug))
  const isLive = (a) => a.status === 'published' && (a.publishedAt || 0) <= Date.now()
  const canSee = (a, u) => isLive(a) || (u && (u.id === a.authorId || canPublish(u)))

  const card = (a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    standfirst: a.standfirst || '',
    coverUrl: a.coverUrl || '',
    coverAlt: a.coverAlt || '',
    category: a.category,
    label: a.label,
    sponsorName: a.label === 'sponsored' ? a.sponsorName || '' : '',
    author: authorOf(a.authorId),
    status: a.status,
    publishedAt: a.publishedAt || null,
    scheduledAt: a.scheduledAt || null,
    updatedAt: a.updatedAt,
    readMinutes: readMinutes(a.body),
  })
  const full = (a) => ({
    ...card(a),
    body: a.body || '',
    coverCredit: a.coverCredit || '',
    tags: P(a.tags),
    seoTitle: a.seoTitle || '',
    seoDescription: a.seoDescription || '',
    related: P(a.related),
    createdAt: a.createdAt,
  })

  // Embeds and related items, resolved to small public summaries. Anything not
  // public (a draft release, a blind battle's names) simply doesn't resolve.
  const resolveRef = (type, ref) => {
    if (type === 'artist') {
      const u = getUserByAliasRow(ref)
      return u ? { type, id: u.id, alias: u.alias, avatar: u.avatar || '', verified: !!u.verified, bio: u.bio || '' } : null
    }
    if (type === 'battle') {
      const b = db.prepare('SELECT id, title, kind, status, cover, genre FROM battles WHERE id = ?').get(ref)
      return b ? { type, ...b } : null
    }
    if (type === 'release') {
      const r = db.prepare("SELECT id, title, type AS releaseType, coverUrl, userId FROM releases WHERE id = ? AND visibility = 'public'").get(ref)
      return r ? { type, ...r, maker: authorOf(r.userId) } : null
    }
    if (type === 'track') {
      const tr = db.prepare("SELECT id, title, coverUrl, audioUrl, duration, userId FROM tracks WHERE id = ? AND visibility != 'draft'").get(ref)
      return tr ? { type, ...tr, maker: authorOf(tr.userId) } : null
    }
    return null
  }
  const refsIn = (body) => {
    const out = []
    for (const m of String(body || '').matchAll(/^@(artist|battle|release|track):([\w.-]+)\s*$/gm)) out.push({ type: m[1], id: m[2] })
    return out
  }
  const resolveAll = (a) => {
    const seen = new Set()
    const items = []
    for (const r of [...refsIn(a.body), ...P(a.related)]) {
      const key = `${r.type}:${r.id}`
      if (seen.has(key)) continue
      seen.add(key)
      const x = resolveRef(r.type, r.id)
      if (x) items.push({ key, ...x })
    }
    return items
  }

  // Validate an editable field set. Cover images must be the writer's own upload.
  const readFields = (d, user) => {
    const f = {}
    if (d.title !== undefined) {
      f.title = str(d.title, 160)
      if (!f.title) return { error: 'Give the story a headline.' }
    }
    if (d.standfirst !== undefined) f.standfirst = str(d.standfirst, 400)
    if (d.body !== undefined) f.body = String(d.body ?? '').slice(0, 60_000)
    if (d.category !== undefined) f.category = CATEGORIES.includes(d.category) ? d.category : 'scene'
    if (d.tags !== undefined) {
      const tags = (Array.isArray(d.tags) ? d.tags : String(d.tags || '').split(','))
        .map((x) => str(x, 30).toLowerCase())
        .filter(Boolean)
      f.tags = JSON.stringify([...new Set(tags)].slice(0, 8))
    }
    if (d.label !== undefined) f.label = LABELS.has(d.label) ? d.label : 'editorial'
    if (d.sponsorName !== undefined) f.sponsorName = str(d.sponsorName, 80)
    if (d.coverUrl !== undefined) {
      const c = d.coverUrl
      if (c === '' || c === null) f.coverUrl = ''
      else if (typeof c === 'string' && /^\/api\/uploads\/i_[\w-]+\.(jpg|png|webp|gif)$/.test(c) && uploadOwner(c) === user.id) f.coverUrl = c
      else return { error: 'Upload the cover yourself first.' }
    }
    if (d.coverAlt !== undefined) f.coverAlt = str(d.coverAlt, 200)
    if (d.coverCredit !== undefined) f.coverCredit = str(d.coverCredit, 120)
    if (d.seoTitle !== undefined) f.seoTitle = str(d.seoTitle, 70)
    if (d.seoDescription !== undefined) f.seoDescription = str(d.seoDescription, 170)
    if (d.related !== undefined) {
      const rel = (Array.isArray(d.related) ? d.related : [])
        .filter((r) => r && ['artist', 'battle', 'release', 'track'].includes(r.type))
        .map((r) => ({ type: r.type, id: str(r.id, 60) }))
        .filter((r) => r.id)
        .slice(0, 12)
      f.related = JSON.stringify(rel)
    }
    return { fields: f }
  }
  const uniqueSlug = (base, ownId) => {
    let slug = slugify(base)
    for (let i = 2; ; i++) {
      const hit = getBySlug(slug)
      if (!hit || hit.id === ownId) return slug
      slug = `${slugify(base)}-${i}`
    }
  }
  const save = (id, f) => {
    const keys = Object.keys(f)
    if (!keys.length) return
    db.prepare(`UPDATE articles SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => f[k]), id)
  }
  // sponsored stories must name who paid, so the label means something
  const sponsorCheck = (a) => a.label !== 'sponsored' || !!(a.sponsorName || '').trim()

  // ---- reading -------------------------------------------------------------
  app.get('/api/journal', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50)
    const before = Number(req.query.before) || Date.now() + 1
    const cat = CATEGORIES.includes(req.query.category) ? req.query.category : null
    const rows = db
      .prepare(
        `SELECT * FROM articles WHERE status = 'published' AND publishedAt <= ? AND publishedAt < ? ${
          cat ? 'AND category = ?' : ''
        } ORDER BY publishedAt DESC LIMIT ?`,
      )
      .all(...[Date.now(), before, ...(cat ? [cat] : []), limit])
    return ok(res, { articles: rows.map(card) })
  })

  app.get('/api/journal/:slug', (req, res) => {
    const a = getBySlug(req.params.slug) || getById(req.params.slug)
    if (!a || !canSee(a, req.user)) return fail(res, 404, 'Story not found.')
    const more = db
      .prepare(
        "SELECT * FROM articles WHERE status = 'published' AND publishedAt <= ? AND id != ? ORDER BY (category = ?) DESC, publishedAt DESC LIMIT 3",
      )
      .all(Date.now(), a.id, a.category)
      .map(card)
    return ok(res, { article: full(a), refs: resolveAll(a), more })
  })

  // the writer's desk: your own stories; editors also see what waits for review
  app.get('/api/me/articles', requireAuth, (req, res) => {
    if (!canWrite(req.user)) return fail(res, 403, 'The Journal desk is for its writers.')
    const mine = db.prepare('SELECT * FROM articles WHERE authorId = ? ORDER BY updatedAt DESC').all(req.user.id).map(card)
    const queue = canPublish(req.user)
      ? db
          .prepare("SELECT * FROM articles WHERE status IN ('review','scheduled') AND authorId != ? ORDER BY updatedAt DESC")
          .all(req.user.id)
          .map(card)
      : []
    return ok(res, { mine, queue, canPublish: canPublish(req.user) })
  })

  app.get('/api/articles/:id', requireAuth, (req, res) => {
    const a = getById(req.params.id)
    if (!a || !(a.authorId === req.user.id || canPublish(req.user))) return fail(res, 404, 'Story not found.')
    return ok(res, { article: full(a), refs: resolveAll(a) })
  })

  // ---- writing -------------------------------------------------------------
  app.post('/api/articles', rateLimit('article', 30, 60 * 60_000), requireAuth, (req, res) => {
    if (!canWrite(req.user)) return fail(res, 403, 'Writing for the Journal is by invitation.')
    const d = req.body || {}
    const r = readFields({ title: d.title || 'Untitled story', ...d }, req.user)
    if (r.error) return fail(res, 400, r.error)
    const now = Date.now()
    const id = `a_${randomUUID().slice(0, 10)}`
    db.prepare(
      `INSERT INTO articles (id,slug,title,standfirst,body,coverUrl,coverAlt,coverCredit,category,tags,authorId,label,sponsorName,status,createdAt,updatedAt,seoTitle,seoDescription,related)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id, uniqueSlug(r.fields.title, null), r.fields.title, r.fields.standfirst || '', r.fields.body || '',
      r.fields.coverUrl || '', r.fields.coverAlt || '', r.fields.coverCredit || '', r.fields.category || 'scene',
      r.fields.tags || '[]', req.user.id,
      // only editors decide a story is SMPL's own editorial voice
      canPublish(req.user) ? r.fields.label || 'editorial' : r.fields.label === 'sponsored' ? 'sponsored' : 'artist',
      r.fields.sponsorName || '', 'draft', now, now, r.fields.seoTitle || '', r.fields.seoDescription || '',
      r.fields.related || '[]',
    )
    return ok(res, { article: full(getById(id)) })
  })

  app.patch('/api/articles/:id', requireAuth, (req, res) => {
    const a = getById(req.params.id)
    if (!a) return fail(res, 404, 'Story not found.')
    const editor = canPublish(req.user)
    // authors edit their own stories until an editor has them; editors edit any
    if (!(editor || (a.authorId === req.user.id && (a.status === 'draft' || a.status === 'review'))))
      return fail(res, 403, 'This story is with the editors now.')
    const r = readFields(req.body || {}, req.user)
    if (r.error) return fail(res, 400, r.error)
    const f = r.fields
    if (f.label === 'editorial' && !editor) f.label = 'artist'
    if (f.title && a.status !== 'published') f.slug = uniqueSlug(f.title, a.id)
    f.updatedAt = Date.now()
    save(a.id, f)
    return ok(res, { article: full(getById(a.id)) })
  })

  app.post('/api/articles/:id/submit', requireAuth, (req, res) => {
    const a = getById(req.params.id)
    if (!a || a.authorId !== req.user.id) return fail(res, 404, 'Story not found.')
    if (a.status !== 'draft') return fail(res, 400, 'Only a draft can go to review.')
    if (!sponsorCheck(a)) return fail(res, 400, 'Name the sponsor of a sponsored story.')
    save(a.id, { status: 'review', updatedAt: Date.now() })
    return ok(res, { article: full(getById(a.id)) })
  })

  // publish now, or schedule for later (`at`, ms). Editors and the house only.
  app.post('/api/articles/:id/publish', requireAuth, (req, res) => {
    if (!canPublish(req.user)) return fail(res, 403, 'Only editors publish.')
    const a = getById(req.params.id)
    if (!a) return fail(res, 404, 'Story not found.')
    if (!a.title?.trim() || !String(a.body || '').trim()) return fail(res, 400, 'A story needs a headline and a body.')
    if (!sponsorCheck(a)) return fail(res, 400, 'Name the sponsor of a sponsored story.')
    const at = Number(req.body?.at)
    const now = Date.now()
    if (Number.isFinite(at) && at > now + 60_000) {
      save(a.id, { status: 'scheduled', scheduledAt: at, reviewedBy: req.user.id, updatedAt: now })
    } else {
      save(a.id, { status: 'published', publishedAt: a.publishedAt || now, scheduledAt: null, reviewedBy: req.user.id, updatedAt: now })
    }
    return ok(res, { article: full(getById(a.id)) })
  })

  app.post('/api/articles/:id/unpublish', requireAuth, (req, res) => {
    if (!canPublish(req.user)) return fail(res, 403, 'Only editors can take a story down.')
    const a = getById(req.params.id)
    if (!a) return fail(res, 404, 'Story not found.')
    save(a.id, { status: 'draft', scheduledAt: null, updatedAt: Date.now() })
    return ok(res, { article: full(getById(a.id)) })
  })

  app.delete('/api/articles/:id', requireAuth, (req, res) => {
    const a = getById(req.params.id)
    if (!a) return fail(res, 404, 'Story not found.')
    const own = a.authorId === req.user.id && a.status === 'draft'
    if (!(own || canPublish(req.user))) return fail(res, 403, 'Not yours to delete.')
    db.prepare('DELETE FROM articles WHERE id = ?').run(a.id)
    return ok(res, {})
  })

  // admin grants Journal rights; never automatic, never via the role field
  app.post('/api/admin/users/:id/editor', requireAuth, requireAdmin, (req, res) => {
    const u = getUserRow(req.params.id)
    if (!u) return fail(res, 404, 'User not found.')
    const role = ['author', 'editor'].includes(req.body?.role) ? req.body.role : ''
    db.prepare('UPDATE users SET editorRole = ? WHERE id = ?').run(role, u.id)
    return ok(res, { editorRole: role })
  })

  return {
    // scheduled stories go live on the minute tick
    tick() {
      db.prepare(
        "UPDATE articles SET status = 'published', publishedAt = scheduledAt, scheduledAt = NULL WHERE status = 'scheduled' AND scheduledAt <= ?",
      ).run(Date.now())
    },
    publicUrls() {
      return db
        .prepare("SELECT slug FROM articles WHERE status = 'published' AND publishedAt <= ?")
        .all(Date.now())
        .map((a) => `/journal/${a.slug}`)
    },
    bySlug: getBySlug,
    isLive,
    deleteForUser(userId) {
      // published stories stay (they are SMPL's record); drafts leave with the writer
      db.prepare("DELETE FROM articles WHERE authorId = ? AND status != 'published'").run(userId)
      db.prepare("UPDATE articles SET authorId = '__deleted__' WHERE authorId = ?").run(userId)
    },
    canWrite,
  }
}
