// Server-side page meta for the SPA. Shared links (WhatsApp, Instagram, X) and
// crawlers that don't run JS get the right title, description, image and
// canonical per page instead of the homepage's. Unknown ids answer 404, and
// private or unlisted pages carry noindex. Nothing here ever names the maker
// of an entry in a running blind battle: battle meta only uses battle fields.
import { readFileSync } from 'node:fs'

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}
// JSON-LD inside <script>: escape "<" so a value can never close the tag
const ld = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

// pages that are only ever personal or tools: keep them out of the index
const PRIVATE = /^\/(settings|dashboard|messages|notifications|login|forgot|reset|verify|auth|edit-profile|create|journal\/(write|desk)|share|sample-maker)(\/|$)/

export function createSeo({ db, indexPath, baseUrl }) {
  let template
  try {
    template = readFileSync(indexPath, 'utf8')
  } catch {
    return null
  }
  const base = String(baseUrl || 'https://usesmpl.com').replace(/\/$/, '')
  const abs = (p) => (!p ? '' : /^https?:\/\//.test(p) ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`)
  // only real files make a share image; data URLs and external links don't
  const img = (p) => (typeof p === 'string' && /^\/api\/uploads\/[\w.-]+$/.test(p) ? abs(p) : '')
  const DEFAULT_IMAGE = `${base}/og.png`

  const setTag = (html, re, value) => (re.test(html) ? html.replace(re, value) : html)
  function render(m) {
    let h = template
    const title = esc(m.title)
    const desc = esc(m.description)
    const url = esc(m.url)
    const image = esc(m.image || DEFAULT_IMAGE)
    h = setTag(h, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    h = setTag(h, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${desc}" />`)
    h = setTag(h, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    h = setTag(
      h,
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="${m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}" />`,
    )
    h = setTag(h, /<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${esc(m.type || 'website')}" />`)
    h = setTag(h, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
    h = setTag(h, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${desc}" />`)
    h = setTag(h, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    h = setTag(h, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${image}" />`)
    h = setTag(h, /<meta property="og:image:alt" content="[^"]*"\s*\/?>/, `<meta property="og:image:alt" content="${title}" />`)
    if (m.image) {
      // the 1024 square default doesn't describe page images: drop its size hints
      h = h.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*"\s*\/?>/g, '')
    }
    h = setTag(h, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`)
    h = setTag(h, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${desc}" />`)
    h = setTag(h, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${image}" />`)
    h = setTag(h, /<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/, `<meta name="twitter:image:alt" content="${title}" />`)
    if (m.jsonld) h = h.replace('</head>', `<script type="application/ld+json">${ld(m.jsonld)}</script>\n</head>`)
    return h
  }

  const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  const byAlias = (a) => db.prepare('SELECT * FROM users WHERE lower(alias) = lower(?)').get(a)

  // one entity per route; returning null means "no such page" (404)
  const routes = [
    [
      /^\/battles\/([^/]+)$/,
      (id) => {
        const b = db.prepare('SELECT * FROM battles WHERE id = ?').get(id)
        if (!b) return null
        const kind = b.kind === 'VERSES' ? 'Open verse battle' : 'Beat battle'
        return {
          title: `${b.title}: ${kind} on SMPL`,
          description: clip(b.description || `${kind} on SMPL. One source, many takes, the crowd crowns the winner.`, 200),
          image: img(b.cover),
          jsonld: { '@context': 'https://schema.org', '@type': 'Event', name: b.title, description: clip(b.description, 300), url: '', image: img(b.cover) || undefined, eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', organizer: { '@type': 'Organization', name: 'SMPL', url: base } },
        }
      },
    ],
    [
      /^\/profile\/([^/]+)$/,
      (alias) => {
        const u = byAlias(decodeURIComponent(alias))
        if (!u) return null
        const image = img(u.banner) || img(u.avatar)
        return {
          title: `@${u.alias}: SMPL`,
          description: clip(u.bio || `@${u.alias} on SMPL, the home of beat and verse battles.`, 200),
          image,
          type: 'profile',
          jsonld: { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: u.alias, alternateName: `@${u.alias}`, description: clip(u.bio, 300) || undefined, image: image || undefined } },
        }
      },
    ],
    [
      /^\/release\/([^/]+)$/,
      (id) => {
        const r = db.prepare("SELECT * FROM releases WHERE id = ? AND visibility != 'draft'").get(id)
        if (!r) return null
        const maker = user(r.userId)
        const n = db.prepare(
          "SELECT COUNT(*) c FROM release_tracks rt JOIN tracks t ON t.id = rt.trackId WHERE rt.releaseId = ? AND t.visibility != 'draft'",
        ).get(r.id).c
        const type = { single: 'Single', ep: 'EP', album: 'Album' }[r.type] || 'Release'
        return {
          title: `${r.title}${maker ? ` by @${maker.alias}` : ''}: ${type} on SMPL`,
          description: clip(r.description || `${type}${maker ? ` by @${maker.alias}` : ''}, ${n} track${n === 1 ? '' : 's'}.`, 200),
          image: img(r.coverUrl),
          type: 'music.album',
          noindex: r.visibility === 'unlisted',
          jsonld: { '@context': 'https://schema.org', '@type': 'MusicAlbum', name: r.title, numTracks: n, image: img(r.coverUrl) || undefined, byArtist: maker ? { '@type': 'MusicGroup', name: maker.alias } : undefined },
        }
      },
    ],
    [
      /^\/track\/([^/]+)$/,
      (id) => {
        const tr = db.prepare("SELECT * FROM tracks WHERE id = ? AND visibility != 'draft'").get(id)
        if (!tr) return null
        const maker = user(tr.userId)
        return {
          title: `${tr.title}${maker ? ` by @${maker.alias}` : ''}: SMPL`,
          description: clip(tr.description || `A track${maker ? ` by @${maker.alias}` : ''} on SMPL.`, 200),
          image: img(tr.coverUrl),
          type: 'music.song',
          noindex: tr.visibility === 'unlisted',
          jsonld: { '@context': 'https://schema.org', '@type': 'MusicRecording', name: tr.title, duration: tr.duration ? `PT${tr.duration}S` : undefined, byArtist: maker ? { '@type': 'MusicGroup', name: maker.alias } : undefined },
        }
      },
    ],
    [
      // write and desk are the writers' tools, not stories
      /^\/journal\/(?!write$|desk$)([^/]+)$/,
      (slug) => {
        const a = db.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published' AND publishedAt <= ?").get(slug, Date.now())
        if (!a) return null
        const author = user(a.authorId)
        return {
          title: `${a.seoTitle || a.title}: SMPL Journal`,
          description: clip(a.seoDescription || a.standfirst || a.title, 200),
          image: img(a.coverUrl),
          type: 'article',
          jsonld: {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: clip(a.title, 110),
            description: clip(a.standfirst, 300) || undefined,
            image: img(a.coverUrl) ? [img(a.coverUrl)] : undefined,
            datePublished: new Date(a.publishedAt).toISOString(),
            dateModified: new Date(a.updatedAt || a.publishedAt).toISOString(),
            author: author ? { '@type': 'Person', name: author.alias, url: `${base}/profile/${encodeURIComponent(author.alias)}` } : undefined,
            publisher: { '@type': 'Organization', name: 'SMPL', logo: { '@type': 'ImageObject', url: `${base}/icon-512.png` } },
          },
        }
      },
    ],
    [
      /^\/clip\/([^/]+)$/,
      (id) => {
        const v = db.prepare('SELECT * FROM waveform_videos WHERE id = ?').get(id)
        if (!v) return null
        const maker = user(v.userId)
        // a clip from a blind battle that is still running doesn't exist publicly
        if (v.battleId) {
          const b = db.prepare('SELECT blind, status FROM battles WHERE id = ?').get(v.battleId)
          if (b && b.blind && b.status !== 'WINNER_DECLARED') return null
        }
        return {
          title: `${v.title || 'Clip'}${maker ? ` by @${maker.alias}` : ''}: SMPL`,
          description: clip(v.tag || 'A clip on SMPL.', 200),
          image: img(v.poster),
          type: 'video.other',
        }
      },
    ],
  ]

  return function handle(req, res) {
    let path = req.path
    try {
      path = decodeURI(req.path)
    } catch {
      /* malformed escapes: use the raw path */
    }
    path = path.replace(/\/+$/, '') || '/'
    const url = `${base}${encodeURI(path)}`
    for (const [re, resolve] of routes) {
      const m = path.match(re)
      if (!m) continue
      let meta = null
      try {
        meta = resolve(m[1])
      } catch {
        meta = null
      }
      if (!meta) {
        res.status(404)
        return res.send(render({ title: 'Not found: SMPL', description: 'This page is not on SMPL.', url, noindex: true }))
      }
      if (meta.jsonld) meta.jsonld = { ...meta.jsonld, url }
      return res.send(render({ ...meta, url }))
    }
    // every other route: the defaults, with its own canonical; private tools noindexed
    return res.send(
      render({
        title: 'SMPL · Beat & Verse Battles · Same sample. Different soul.',
        description:
          'Beat & verse battles built on one shared sample. A curator drops the sample, producers and rappers flip it, and the crowd votes the winner.',
        url,
        noindex: PRIVATE.test(path),
      }),
    )
  }
}
