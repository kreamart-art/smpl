// End-to-end smoke test for the API and the server-rendered page meta.
//
// It boots a throwaway server on a fresh, seeded database in a temp folder, so
// the real server/data.db and server/uploads are never read or written. The
// server gets a minimal environment (no SMTP, push or Resend keys), so nothing
// can be mailed or pushed. Run with `npm run smoke`; run `npm run build` first
// to include the page-meta checks (they are reported as skipped otherwise).
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const HAS_DIST = existsSync(path.join(ROOT, 'dist', 'index.html'))
// both layouts built: the server runs the preview switch (server/layout.js)
const DUAL = HAS_DIST && existsSync(path.join(ROOT, 'dist-legacy', 'index.html'))
const SITE = 'https://usesmpl.com'
const TMP = mkdtempSync(path.join(tmpdir(), 'smpl-smoke-'))
const DB = path.join(TMP, 'data.db')
const UP = path.join(TMP, 'uploads')

// ---------- results ----------
const results = []
let section = ''
const heading = (name) => {
  section = name
}
const check = (name, ok, detail = '') => results.push({ section, name, ok: !!ok, detail })
const skip = (name, why) => results.push({ section, name, skipped: why })

// ---------- throwaway server ----------
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer()
    s.on('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })

let child = null
let serverLog = ''
async function boot(port) {
  serverLog = ''
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR || tmpdir(),
      NODE_ENV: 'development',
      SMPL_DB_PATH: DB,
      SMPL_UPLOAD_DIR: UP,
      SMPL_API_PORT: String(port),
      SMPL_APP_URL: SITE,
      SMPL_SECRET: `smoke-${process.pid}-${Date.now()}`,
      // the seed house account plays the founder (admin) in this run
      SMPL_ADMIN_EMAIL: 'curator@smpl.app',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not start\n${serverLog}`)), 30_000)
    const onData = (d) => {
      serverLog += d
      if (serverLog.includes('listening on')) {
        clearTimeout(timer)
        resolve()
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.once('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`server exited (${code})\n${serverLog}`))
    })
  })
}
async function stop() {
  const c = child
  child = null
  if (!c || c.exitCode !== null) return
  await new Promise((resolve) => {
    c.once('exit', resolve)
    c.kill('SIGTERM')
  })
}

// ---------- fixtures the API can't create (old data, blind clips, DM videos) ----------
const DAY = 24 * 60 * 60_000
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 0, 0xff, 0xfb, 0x90, 0x64, 0, 0, 0, 0, 0, 0])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

function prepareFixtures() {
  const old = Date.now() - 3 * DAY
  const file = (name, bytes = 'x', mtime = 0) => {
    const p = path.join(UP, name)
    writeFileSync(p, bytes)
    if (mtime) utimesSync(p, mtime / 1000, mtime / 1000)
  }
  mkdirSync(UP, { recursive: true })
  file('v_dm1_v.mp4', 'x', old) // a video sent in a DM...
  file('v_dm1.jpg', 'x', old) // ...and its poster
  file('w_saved_v.mp4', 'x', old) // a clip saved to a profile
  file('v_orphan_v.mp4', 'x', old) // clips nobody saved
  file('w_orphan_v.mp4', 'x', old)
  file('w_orphan.jpg', 'x', old)
  file('i_old.jpg', 'x', old) // images are never swept
  file('a_testkoder.mp3', MP3) // KODER's entry in the crowned battle b3

  const db = new DatabaseSync(DB)
  // links saved before they were cleaned: the boot migration must fix them
  db.prepare('UPDATE users SET links = ? WHERE id = ?').run(
    JSON.stringify([
      { label: 'bad', url: 'javascript:alert(1)' },
      { label: 'IG', url: 'instagram.com/mono' },
      { label: 'Mail', url: 'mailto:mono@x.nl' },
    ]),
    'u_mono',
  )
  const now = Date.now()
  const insB = db.prepare(
    `INSERT INTO battles (id,kind,title,description,curatorId,maxProducers,signupStart,signupEnd,submitStart,submitEnd,voteStart,voteEnd,status,attendees,signups,blind)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  // a blind battle still voting, and a closed battle without a recorded winner
  insB.run('b_blind', 'BEATS', 'Blind test', '', 'curator', 8, now - 4 * DAY, now - 3 * DAY, now - 3 * DAY, now - 2 * DAY, now - 2 * DAY, now + DAY, 'VOTING_PHASE', '[]', '["u_koder"]', 1)
  insB.run('b_nowin', 'BEATS', 'No winner yet', '', 'curator', 8, now - 9 * DAY, now - 8 * DAY, now - 8 * DAY, now - 7 * DAY, now - 7 * DAY, now - 6 * DAY, 'WINNER_DECLARED', '[]', '["u_vhs","u_null"]', 0)
  const insS = db.prepare('INSERT INTO submissions (id,battleId,producerId,audioUrl,duration,createdAt,approved) VALUES (?,?,?,?,?,?,1)')
  insS.run('s_nw1', 'b_nowin', 'u_vhs', 'mock://nw/vhs', 15, now - 7 * DAY)
  insS.run('s_nw2', 'b_nowin', 'u_null', 'mock://nw/null', 15, now - 7 * DAY)
  db.prepare("UPDATE submissions SET audioUrl = '/api/uploads/a_testkoder.mp3' WHERE id = 's3_koder'").run()

  const insV = db.prepare('INSERT INTO waveform_videos (id,userId,battleId,url,tag,createdAt,poster,kind,title,description) VALUES (?,?,?,?,?,?,?,?,?,?)')
  insV.run('wv_open', 'u_koder', '', '/api/uploads/w_saved_v.mp4', 'open', old, '', 'waveform', 'Open clip', '')
  insV.run('wv_blind', 'u_koder', 'b_blind', '/api/uploads/w_blind_v.mp4', 'blind', old, '', 'waveform', 'Blind clip', '')
  db.prepare('INSERT INTO messages (id,fromId,toId,body,createdAt,videoUrl) VALUES (?,?,?,?,?,?)').run('m_dm1', 'u_mono', 'u_koder', '', old, '/api/uploads/v_dm1_v.mp4')
  // KODER previews the new layout; MONO keeps the current one
  db.prepare('UPDATE users SET newLayout = 1 WHERE id = ?').run('u_koder')
  db.close()
}

// ---------- client ----------
let B = ''
async function call(method, p, token, body, type) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (body instanceof Uint8Array) {
    headers['Content-Type'] = type
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const r = await fetch(B + p, { method, headers, body: payload, signal: AbortSignal.timeout(60_000) })
  let data = null
  try {
    data = await r.json()
  } catch {
    /* not JSON */
  }
  return { status: r.status, data }
}
const page = async (p, cookie = '') => {
  const r = await fetch(B + p, { headers: cookie ? { cookie } : {}, signal: AbortSignal.timeout(30_000) })
  return { status: r.status, html: await r.text() }
}
// a raw bootstrap, to read the layout answer and its Set-Cookie header
const bootstrapAs = async (token, cookie = '') => {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (cookie) headers.cookie = cookie
  const r = await fetch(`${B}/api/bootstrap`, { headers, signal: AbortSignal.timeout(30_000) })
  return { layout: (await r.json()).layout, setCookie: r.headers.get('set-cookie') || '' }
}
const login = async (email) => (await call('POST', '/api/auth/login', null, { email, password: 'smpl' })).data?.token
const upload = async (token, kind) =>
  (await call('POST', `/api/uploads/${kind}`, token, kind === 'audio' ? MP3 : PNG, kind === 'audio' ? 'audio/mpeg' : 'image/png')).data?.url
const has = (dir, name) => existsSync(path.join(dir, name))
const meta = (html, re) => (html.match(re) || [])[1] || ''
const robots = (html) => meta(html, /<meta name="robots" content="([^"]*)"/)
const canonical = (html) => meta(html, /<link rel="canonical" href="([^"]*)"/)
const layoutOf = (html) => meta(html, /<meta name="smpl-layout" content="([^"]*)"/)

// ---------- the checks ----------
async function run() {
  const koder = await login('koder@smpl.app')
  const mono = await login('mono@smpl.app')
  const house = await login('curator@smpl.app')
  const listener = await login('listener@smpl.app')

  heading('Accounts and stored data')
  check('seed accounts can log in', koder && mono && house && listener)
  const boot = await call('GET', '/api/bootstrap', mono)
  const monoLinks = boot.data?.users?.find((u) => u.id === 'u_mono')?.links || []
  check('boot migration drops javascript: links', !monoLinks.some((l) => /javascript/i.test(l.url)), JSON.stringify(monoLinks))
  check('boot migration turns a bare domain into https', monoLinks.some((l) => l.url === 'https://instagram.com/mono'))
  check('boot migration keeps mailto:', monoLinks.some((l) => l.url === 'mailto:mono@x.nl'))
  const patched = await call('PATCH', '/api/me', koder, {
    links: [
      { label: 'x', url: 'javascript:alert(document.cookie)' },
      { label: 'y', url: 'data:text/html,<script>alert(1)</script>' },
      { label: 'Spotify', url: 'https://open.spotify.com/artist/1' },
    ],
  })
  const kl = patched.data?.me?.links || []
  check('PATCH /api/me drops javascript: and data: links', kl.length === 1 && kl[0].label === 'Spotify', JSON.stringify(kl))
  check('bootstrap votes carry no voter id', (boot.data?.votes || []).every((v) => !('userId' in v)), `${(boot.data?.votes || []).length} votes`)
  const roles = await call('PATCH', '/api/me', koder, { creativeRoles: ['producer', 'dj', 'admin', 'hacker', 'engineer', 'rapper', 'singer'] })
  check('creative roles are whitelisted and capped at 4', JSON.stringify(roles.data?.me?.creativeRoles) === '["producer","dj","engineer","rapper"]', JSON.stringify(roles.data?.me?.creativeRoles))
  check('creative roles leave the account role alone', roles.data?.me?.role === 'producer')

  heading('Uploads belong to their uploader')
  const monoImg = await upload(mono, 'image')
  const monoAudio = await upload(mono, 'audio')
  const koderAudio = await upload(koder, 'audio')
  const koderImg = await upload(koder, 'image')
  check('uploads return a url', monoImg && monoAudio && koderAudio && koderImg)
  const r1 = await call('POST', '/api/waveform/render', koder, { bgUrl: monoImg, audioUrl: koderAudio })
  check("render with someone else's still is refused", r1.status === 403, `${r1.status} ${r1.data?.error || ''}`)
  check("someone else's still is still on disk", has(UP, path.basename(monoImg || 'x')))
  const r2 = await call('POST', '/api/waveform/render', koder, { bgUrl: koderImg, audioUrl: monoAudio })
  check("render with someone else's audio is refused", r2.status === 403, `${r2.status} ${r2.data?.error || ''}`)
  const r3 = await call('POST', '/api/waveform/render', koder, { bgUrl: koderImg, audioUrl: koderAudio })
  check('render with your own still and audio passes the owner check', r3.status !== 403, `${r3.status} ${r3.data?.error || ''}`)
  const c1 = await call('POST', '/api/me/waveform-video', koder, { url: monoImg, battleId: '', tag: 'x' })
  check("saving a clip from someone else's file is refused", c1.status === 403, `${c1.status} ${c1.data?.error || ''}`)
  const banner = await call('PATCH', '/api/me', koder, { banner: monoImg })
  check("someone else's image as profile banner is refused", banner.status === 400, `${banner.status}`)

  heading('Battle rules')
  const p1 = await call('PATCH', '/api/battles/b4/status', house, { status: 'WINNER_DECLARED' })
  check('status cannot jump to WINNER_DECLARED', p1.status === 400, `${p1.status} ${p1.data?.error || ''}`)
  const p2 = await call('PATCH', '/api/battles/b4/status', house)
  check('"next" from voting is refused (close voting crowns)', p2.status === 400, `${p2.status} ${p2.data?.error || ''}`)
  const p3 = await call('PATCH', '/api/battles/b4/status', house, { status: 'BOGUS' })
  check('unknown status is refused', p3.status === 400, `${p3.status}`)
  const p4 = await call('PATCH', '/api/battles/b3/status', house, { status: 'VOTING_PHASE' })
  check('a crowned battle stays crowned', p4.status === 400, `${p4.status} ${p4.data?.error || ''}`)
  const p5 = await call('PATCH', '/api/battles/b2/status', house)
  check('a normal step forward still works', p5.status === 200 && p5.data?.battle?.status === 'SUBMISSION_PHASE', `${p5.status} ${p5.data?.battle?.status}`)
  const s1 = await call('POST', '/api/battles/b2/submissions', koder, { audioUrl: monoAudio })
  check("an entry with someone else's audio is refused", s1.status === 403, `${s1.status} ${s1.data?.error || ''}`)
  const s2 = await call('POST', '/api/battles/b2/submissions', koder, { audioUrl: koderAudio })
  check('an entry with your own audio works', s2.status === 200, `${s2.status} ${s2.data?.error || ''}`)
  const e1 = await call('PATCH', '/api/battles/b2', house, { sampleUrl: 'javascript:alert(1)' })
  check('a javascript: sample url is stored empty', e1.status === 200 && !e1.data?.battle?.sampleUrl, `${e1.status} ${JSON.stringify(e1.data?.battle?.sampleUrl ?? e1.data?.error)}`)
  const feed = (await call('GET', '/api/feed', koder)).data?.feed || []
  check('feed names no winner for a battle without one', !feed.some((i) => i.type === 'winner' && i.battleId === 'b_nowin'))
  check('feed lists no placings for a battle without a winner', !feed.some((i) => i.type === 'placement' && i.battleId === 'b_nowin'))
  check('feed does name the real winner', feed.some((i) => i.type === 'winner' && i.battleId === 'b3'))

  heading('Clips in a running blind battle')
  const ids = (r) => (r.data?.videos || []).map((v) => v.id)
  const anonList = await call('GET', '/api/users/u_koder/waveform-videos')
  const ownList = await call('GET', '/api/users/u_koder/waveform-videos', koder)
  check('hidden from visitors on the profile', !ids(anonList).includes('wv_blind') && ids(anonList).includes('wv_open'), ids(anonList).join(','))
  check('visible to the maker', ids(ownList).includes('wv_blind'))
  check('hidden from the global clip list', !ids(await call('GET', '/api/waveform-videos')).includes('wv_blind'))
  check('the clip page is 404 for visitors', (await call('GET', '/api/waveform-videos/wv_blind')).status === 404)

  heading('Clean-up of unsaved clip files (runs at boot)')
  check('a DM video stays', has(UP, 'v_dm1_v.mp4'))
  check("a DM video's poster stays", has(UP, 'v_dm1.jpg'))
  check('a saved clip stays', has(UP, 'w_saved_v.mp4'))
  check('an unsaved v_ clip is removed', !has(UP, 'v_orphan_v.mp4'))
  check('an unsaved w_ render and poster are removed', !has(UP, 'w_orphan_v.mp4') && !has(UP, 'w_orphan.jpg'))
  check('images are left alone', has(UP, 'i_old.jpg'))

  heading('Music: tracks and releases')
  const kA = await upload(koder, 'audio')
  const kA2 = await upload(koder, 'audio')
  const kImg = await upload(koder, 'image')
  check('listeners cannot publish', (await call('POST', '/api/tracks', listener, { title: 'x', audioUrl: kA })).status === 403)
  check("a track with someone else's audio is refused", (await call('POST', '/api/tracks', koder, { title: 'x', audioUrl: monoAudio })).status === 400)
  check("a track with someone else's cover is refused", (await call('POST', '/api/tracks', koder, { title: 'x', audioUrl: kA, coverUrl: monoImg })).status === 400)
  check('a track needs a title', (await call('POST', '/api/tracks', koder, { title: '  ', audioUrl: kA })).status === 400)
  const pub = await call('POST', '/api/tracks', koder, { title: 'Night Flip', audioUrl: kA, coverUrl: kImg, genre: 'boom bap', bpm: 92, musicalKey: 'F# minor', visibility: 'public' })
  check('a public track is created', pub.status === 200 && pub.data?.track?.visibility === 'public' && pub.data.track.publishedAt, `${pub.status} ${pub.data?.error || ''}`)
  const draft = await call('POST', '/api/tracks', koder, { title: 'Sketch', audioUrl: kA2 })
  check('a track defaults to draft', draft.data?.track?.visibility === 'draft')
  const tP = pub.data?.track?.id
  const tD = draft.data?.track?.id
  const anonMusic = await call('GET', '/api/users/u_koder/music')
  check('visitors only see public tracks', (anonMusic.data?.tracks || []).map((t) => t.id).join() === tP)
  check('the maker also sees drafts', (await call('GET', '/api/users/u_koder/music', koder)).data?.tracks?.length === 2)
  check('a draft track is 404 for visitors', (await call('GET', `/api/tracks/${tD}`)).status === 404)
  check('a draft track opens for the maker', (await call('GET', `/api/tracks/${tD}`, koder)).status === 200)
  const monoT = (await call('POST', '/api/tracks', mono, { title: 'Mono', audioUrl: monoAudio, visibility: 'public' })).data?.track?.id
  check("a release with someone else's track is refused", (await call('POST', '/api/releases', koder, { type: 'ep', title: 'X', trackIds: [tP, monoT], visibility: 'public' })).status === 400)
  check('an empty release cannot be public', (await call('POST', '/api/releases', koder, { type: 'single', title: 'Empty', trackIds: [], visibility: 'public' })).status === 400)
  const rel = await call('POST', '/api/releases', koder, { type: 'ep', title: 'Late Nights', coverUrl: kImg, trackIds: [tP, tD], visibility: 'public' })
  check('an EP is created', rel.status === 200, rel.data?.error)
  const relId = rel.data?.release?.id
  const relAnon = await call('GET', `/api/releases/${relId}`)
  check('visitors do not see the draft in the tracklist', relAnon.data?.tracks?.length === 1 && relAnon.data?.release?.trackCount === 1)
  const relOwn = await call('GET', `/api/releases/${relId}`, koder)
  check('the maker sees the full tracklist in order', relOwn.data?.tracks?.length === 2 && relOwn.data.tracks[0].id === tP)
  const latest = await call('GET', '/api/music/latest')
  check('latest music lists the EP, not its tracks again', latest.data?.releases?.some((r) => r.id === relId) && !latest.data?.tracks?.some((t) => t.id === tP))
  const pTitle = await call('PATCH', `/api/tracks/${tD}`, koder, { title: 'Sketch 2', visibility: 'unlisted' })
  check('editing a track works', pTitle.data?.track?.title === 'Sketch 2' && pTitle.data.track.visibility === 'unlisted')
  check('an unlisted track opens by link', (await call('GET', `/api/tracks/${tD}`)).status === 200)
  check('an unlisted track stays out of lists', !(await call('GET', '/api/users/u_koder/music')).data?.tracks?.some((t) => t.id === tD))
  check("editing someone else's track is refused", (await call('PATCH', `/api/tracks/${tP}`, mono, { title: 'hack' })).status === 404)
  check('publishing an entry before the result is refused', (await call('POST', '/api/submissions/s1_koder/publish', koder, {})).status === 400)
  check("publishing someone else's entry is refused", (await call('POST', '/api/submissions/s3_mono/publish', koder, {})).status === 404)
  const pubEntry = await call('POST', '/api/submissions/s3_koder/publish', koder, { title: 'Ghost flip' })
  check('your entry becomes a track after the result, same file', pubEntry.status === 200 && pubEntry.data?.track?.audioUrl === '/api/uploads/a_testkoder.mp3', `${pubEntry.status} ${pubEntry.data?.error || ''}`)
  const again = await call('POST', '/api/submissions/s3_koder/publish', koder, {})
  check('publishing it twice returns the same track', again.data?.existing === true && again.data?.track?.id === pubEntry.data?.track?.id)
  check('the track knows its battle', (await call('GET', `/api/tracks/${pubEntry.data?.track?.id}`)).data?.source?.battleId === 'b3')
  const del = await call('DELETE', `/api/tracks/${tD}`, koder)
  check('a deleted track leaves the release', del.status === 200 && (await call('GET', `/api/releases/${relId}`, koder)).data?.tracks?.length === 1)

  heading('Journal: roles and workflow')
  check('no article without a Journal role', (await call('POST', '/api/articles', koder, { title: 'x' })).status === 403)
  check('only admins grant Journal roles', (await call('POST', '/api/admin/users/u_mono/editor', koder, { role: 'editor' })).status === 403)
  check('an admin makes KODER an author', (await call('POST', '/api/admin/users/u_koder/editor', house, { role: 'author' })).data?.editorRole === 'author')
  const body = 'Intro paragraph about the flip.\n\n## How it was made\n\nAn SP-404, a broken DX7.\n\n@battle:b1\n\n@artist:KODER\n\n- tape\n- dust'
  const a = await call('POST', '/api/articles', koder, { title: 'Behind the Beat', standfirst: 'Inside the process.', body, category: 'artists', label: 'editorial', tags: 'process, sampling' })
  check('an author creates a draft', a.status === 200 && a.data?.article?.status === 'draft', a.data?.error)
  check('an author cannot use the editorial label', a.data?.article?.label === 'artist', a.data?.article?.label)
  const aid = a.data?.article?.id
  const slug = a.data?.article?.slug
  check('the slug comes from the headline', slug === 'behind-the-beat', slug)
  check('an author sends it for review', (await call('POST', `/api/articles/${aid}/submit`, koder)).data?.article?.status === 'review')
  check('an author cannot publish', (await call('POST', `/api/articles/${aid}/publish`, koder)).status === 403)
  check('unpublished stories are 404 for visitors', (await call('GET', `/api/journal/${slug}`)).status === 404)
  check('the author can still open it', (await call('GET', `/api/journal/${slug}`, koder)).status === 200)
  check('the editor sees it in the review queue', (await call('GET', '/api/me/articles', house)).data?.queue?.some((x) => x.id === aid))
  check('an editor publishes', (await call('POST', `/api/articles/${aid}/publish`, house)).data?.article?.status === 'published')
  const read = await call('GET', `/api/journal/${slug}`)
  const refTypes = (read.data?.refs || []).map((r) => r.type).sort().join(',')
  check('visitors can read it, embeds resolved', read.status === 200 && refTypes === 'artist,battle', refTypes)
  check('the author cannot change a published story', (await call('PATCH', `/api/articles/${aid}`, koder, { title: 'Hijack' })).status === 403)
  check('the section filter works', (await call('GET', '/api/journal?category=artists')).data?.articles?.length === 1 && (await call('GET', '/api/journal?category=scene')).data?.articles?.length === 0)
  const sp = await call('POST', '/api/articles', house, { title: 'Brand X presents', body: 'text', label: 'sponsored' })
  const spId = sp.data?.article?.id
  check('sponsored without a sponsor name is refused', (await call('POST', `/api/articles/${spId}/publish`, house)).status === 400)
  check("someone else's image as cover is refused", (await call('PATCH', `/api/articles/${spId}`, house, { coverUrl: monoImg })).status === 400)
  await call('PATCH', `/api/articles/${spId}`, house, { sponsorName: 'Brand X' })
  check('scheduling works', (await call('POST', `/api/articles/${spId}/publish`, house, { at: Date.now() + 3600_000 })).data?.article?.status === 'scheduled')
  check('a scheduled story is not public yet', (await call('GET', '/api/journal')).data?.articles?.length === 1)

  heading('Two layouts while the new one is in preview')
  let previewCookie = ''
  if (!DUAL) {
    skip('all layout checks', 'run `npm run build` first (it builds both layouts)')
  } else {
    const visitor = await page('/')
    check('visitors get the current layout', visitor.status === 200 && layoutOf(visitor.html) === 'legacy', layoutOf(visitor.html))
    const anon = await bootstrapAs(null)
    check('a visitor is told the current layout, without a cookie', anon.layout === 'legacy' && !anon.setCookie, `${anon.layout} ${anon.setCookie}`)
    const monoB = await bootstrapAs(mono)
    check('an account without the flag stays on the current layout', monoB.layout === 'legacy' && !monoB.setCookie, `${monoB.layout} ${monoB.setCookie}`)
    check('the house account starts in the preview', (await bootstrapAs(house)).layout === 'new')
    const koderB = await bootstrapAs(koder)
    previewCookie = koderB.setCookie.split(';')[0]
    check('a flagged account is told the new layout', koderB.layout === 'new')
    check('...with a signed, http-only cookie for it', /^smpl_layout=u_koder\.[\w-]{20,}$/.test(previewCookie) && /HttpOnly/i.test(koderB.setCookie) && /SameSite=Lax/i.test(koderB.setCookie), koderB.setCookie)
    const again = await bootstrapAs(koder, previewCookie)
    check('a matching cookie is not sent again', again.layout === 'new' && !again.setCookie, again.setCookie)
    check('with the cookie the page is the new layout', layoutOf((await page('/', previewCookie)).html) === 'new')
    check('a forged signature gets the current layout', layoutOf((await page('/', 'smpl_layout=u_koder.forged')).html) === 'legacy')
    check("a valid signature can't be moved to another account", layoutOf((await page('/', previewCookie.replace('u_koder.', 'u_mono.'))).html) === 'legacy')
    const startUrl = async (cookie) => (await (await fetch(`${B}/manifest.webmanifest`, { headers: cookie ? { cookie } : {} })).json()).start_url
    check('each layout gets its own app manifest', (await startUrl()) === '/battles' && (await startUrl(previewCookie)) === '/home')
    check('shared files reach both layouts', (await fetch(`${B}/sw.js`)).status === 200 && (await fetch(`${B}/og.png`, { headers: { cookie: previewCookie } })).status === 200)
    const switched = await bootstrapAs(mono, previewCookie)
    check('switching to an account without the flag clears the cookie', switched.layout === 'legacy' && /^smpl_layout=;/.test(switched.setCookie) && /Max-Age=0/i.test(switched.setCookie), switched.setCookie)
    check('logging out clears it too', /^smpl_layout=;/.test((await bootstrapAs(null, previewCookie)).setCookie))
    const legacyBattle = await page('/battles/b1')
    check('the current layout keeps its page meta', layoutOf(legacyBattle.html) === 'legacy' && /<title>[^<]*Beat battle on SMPL<\/title>/.test(legacyBattle.html))
    check('pages the current layout lacks are 404 for visitors', (await page(`/release/${relId}`)).status === 404 && (await page('/journal')).status === 404 && (await page('/home')).status === 404)
    check('...and open in the new layout', (await page(`/release/${relId}`, previewCookie)).status === 200 && (await page('/home', previewCookie)).status === 200)
  }

  heading('Sitemap and robots')
  const sm = await (await fetch(`${B}/sitemap.xml`)).text()
  if (DUAL) {
    check('sitemap leaves out pages only the new layout has', !sm.includes('/release/') && !sm.includes('/track/') && !sm.includes('/journal/'))
  } else {
    check('sitemap lists the public release', sm.includes(`/release/${relId}`))
    check('sitemap lists the published story', sm.includes(`/journal/${slug}`))
    check('sitemap leaves out scheduled stories', !sm.includes('/journal/brand-x-presents'))
    check('sitemap leaves out unlisted and deleted tracks', !sm.includes(`/track/${tD}`))
  }
  check('sitemap lists battles and profiles', sm.includes('/battles/b1') && sm.includes('/profile/KODER'))
  if (HAS_DIST) {
    const rb = await (await fetch(`${B}/robots.txt`)).text()
    check('robots.txt keeps private tools out', rb.includes('Disallow: /settings') && rb.includes('Disallow: /journal/write'))
  } else skip('robots.txt keeps private tools out', 'no build')

  heading('Page meta for shared links and search')
  if (!HAS_DIST) {
    skip('all page-meta checks', 'run `npm run build` first')
  } else {
    // the new layout's pages (with the preview cookie while both are served)
    const pg = (p) => page(p, previewCookie)
    const battle = await pg('/battles/b1')
    check('a battle page has its own title', battle.status === 200 && /<title>[^<]*Beat battle on SMPL<\/title>/.test(battle.html))
    check('a battle page has its canonical', canonical(battle.html) === `${SITE}/battles/b1`, canonical(battle.html))
    check('a battle page carries Event data', battle.html.includes('"@type":"Event"'))
    const missing = await pg('/battles/does-not-exist')
    check('an unknown battle is a real 404 with noindex', missing.status === 404 && robots(missing.html).startsWith('noindex'))
    const prof = await pg('/profile/KODER')
    check('a profile page names the artist', prof.status === 200 && prof.html.includes('<title>@KODER: SMPL</title>') && prof.html.includes('"@type":"ProfilePage"'))
    const relPage = await pg(`/release/${relId}`)
    check('a release page is indexable with album data', relPage.status === 200 && robots(relPage.html).startsWith('index') && relPage.html.includes('"@type":"MusicAlbum"'))
    check('a deleted track is 404', (await pg(`/track/${tD}`)).status === 404)
    const story = await pg(`/journal/${slug}`)
    check('a story page carries NewsArticle data', story.status === 200 && story.html.includes('"@type":"NewsArticle"'))
    const writer = await pg('/journal/write')
    check('the writing tool is a page, kept out of the index', writer.status === 200 && robots(writer.html).startsWith('noindex'))
    check('settings are kept out of the index', robots((await pg('/settings')).html).startsWith('noindex'))
    check('signup stays indexable', robots((await pg('/signup')).html).startsWith('index'))
    check('a clip from a running blind battle is 404', (await pg('/clip/wv_blind')).status === 404)
    check('an open clip has a page', (await pg('/clip/wv_open')).status === 200)
    const kX = await upload(koder, 'audio')
    const evil = await call('POST', '/api/tracks', koder, { title: '"><script>alert(1)</script>', audioUrl: kX, visibility: 'public' })
    const evilPage = await pg(`/track/${evil.data?.track?.id}`)
    check('titles are escaped in the page head', evilPage.status === 200 && !evilPage.html.includes('<script>alert(1)') && evilPage.html.includes('&quot;&gt;&lt;script&gt;'))
    await call('PATCH', `/api/tracks/${evil.data?.track?.id}`, koder, { visibility: 'unlisted' })
    check('an unlisted track page carries noindex', robots((await pg(`/track/${evil.data?.track?.id}`)).html).startsWith('noindex'))
  }
  check('the journal story can be taken offline', (await call('POST', `/api/articles/${aid}/unpublish`, house)).data?.article?.status === 'draft' && (await call('GET', `/api/journal/${slug}`)).status === 404)
}

// ---------- main ----------
let failed = false
try {
  const port = await freePort()
  B = `http://127.0.0.1:${port}`
  await boot(port) // first boot: fresh seed, migrations, every table
  await stop()
  prepareFixtures()
  await boot(port) // second boot: migrations + clean-up run over the fixtures
  await run()
} catch (err) {
  failed = true
  console.error(`\nsmoke test aborted: ${err.stack || err}`)
  if (serverLog) console.error(`\n--- server log ---\n${serverLog}`)
} finally {
  await stop()
  rmSync(TMP, { recursive: true, force: true })
}

let last = ''
for (const r of results) {
  if (r.section !== last) console.log(`\n${(last = r.section)}`)
  if (r.skipped) console.log(`  SKIP  ${r.name}  (${r.skipped})`)
  else console.log(`  ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${!r.ok && r.detail ? `  [${r.detail}]` : ''}`)
}
const ran = results.filter((r) => !r.skipped)
const bad = ran.filter((r) => !r.ok)
const skipped = results.length - ran.length
console.log(`\n${ran.length - bad.length}/${ran.length} passed${skipped ? `, ${skipped} skipped` : ''}`)
process.exit(failed || bad.length ? 1 : 0)
