// Renders a Journal story from its small markdown subset into React elements
// only (never HTML), so a story can't inject markup or script.
//   ## heading   ### subheading   > quote   - list item
//   **bold**  _italic_  [text](https://… or /path)
//   ![alt](/api/uploads/i_… "credit")         on its own line
//   @artist:ALIAS  @battle:id  @release:id  @track:id   on its own line
import { Link } from 'react-router-dom'
import { useT } from '../i18n/index.jsx'
import { usePlayback } from '../context/AppContext.jsx'
import { safeHref } from '../utils/safeHref.js'
import { mediaUrl } from '../api.js'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { Cover, PlayButton } from './crate.jsx'
import { trackMeta } from './music.jsx'
import { IconChevronRight } from './icons.jsx'

export function parseBlocks(body) {
  const lines = String(body || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []
  let list = []
  const flushPara = () => {
    if (para.length) blocks.push({ t: 'p', text: para.join(' ') })
    para = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ t: 'ul', items: list })
    list = []
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    let m
    if (!line.trim()) {
      flushPara()
      flushList()
    } else if ((m = line.match(/^###\s+(.+)/))) {
      flushPara()
      flushList()
      blocks.push({ t: 'h3', text: m[1] })
    } else if ((m = line.match(/^##\s+(.+)/))) {
      flushPara()
      flushList()
      blocks.push({ t: 'h2', text: m[1] })
    } else if ((m = line.match(/^>\s?(.*)/))) {
      flushPara()
      flushList()
      const prev = blocks[blocks.length - 1]
      if (prev?.t === 'quote') prev.text += ` ${m[1]}`
      else blocks.push({ t: 'quote', text: m[1] })
    } else if ((m = line.match(/^[-*]\s+(.+)/))) {
      flushPara()
      list.push(m[1])
    } else if ((m = line.match(/^@(artist|battle|release|track):([\w.-]+)\s*$/))) {
      flushPara()
      flushList()
      blocks.push({ t: 'embed', key: `${m[1]}:${m[2]}` })
    } else if ((m = line.match(/^!\[([^\]]*)\]\((\/api\/uploads\/[\w.-]+)(?:\s+"([^"]*)")?\)\s*$/))) {
      flushPara()
      flushList()
      blocks.push({ t: 'img', alt: m[1], src: m[2], credit: m[3] || '' })
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return blocks
}

// **bold**, _italic_ (only between word boundaries, so snake_case stays) and links
const INLINE = /(\*\*([^*]+)\*\*)|((?<![\w])_([^_\n]+)_(?![\w]))|(\[([^\]]+)\]\(([^)\s]+)\))/g
function inline(text, k) {
  const out = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${k}-${i++}`
    if (m[1]) out.push(<strong key={key} className="font-semibold text-ink">{m[2]}</strong>)
    else if (m[3]) out.push(<em key={key}>{m[4]}</em>)
    else {
      const label = m[6]
      const url = m[7]
      if (url.startsWith('/') && !url.startsWith('//')) {
        out.push(
          <Link key={key} to={url} className="text-ink underline decoration-line-bright underline-offset-4 hover:decoration-ink">
            {label}
          </Link>,
        )
      } else {
        const href = safeHref(url)
        out.push(
          href ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-ink underline decoration-line-bright underline-offset-4 hover:decoration-ink"
            >
              {label}
            </a>
          ) : (
            label
          ),
        )
      }
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// A linked SMPL item inside a story (or in its "in this story" list).
export function RefCard({ item }) {
  const t = useT()
  const { track, playing, toggle } = usePlayback()
  if (item.type === 'artist') {
    return (
      <Link to={`/profile/${encodeURIComponent(item.alias)}`} className="group flex items-center gap-4 border border-line bg-panel p-4 hover:border-line-bright">
        <Avatar alias={item.alias} src={item.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-sans text-[16px] font-semibold uppercase tracking-tight text-ink">
            @{item.alias}
            {item.verified ? <VerifiedBadge size={13} /> : null}
          </div>
          {item.bio ? <p className="mt-1 line-clamp-2 font-sans text-[13px] text-muted">{item.bio}</p> : null}
        </div>
        <IconChevronRight size={16} className="shrink-0 text-muted group-hover:text-ink" />
      </Link>
    )
  }
  if (item.type === 'track') {
    const meta = trackMeta(item, item.maker)
    const on = track?.id === meta.id && playing
    return (
      <div className="flex items-center gap-4 border border-line bg-panel p-3">
        <Cover src={item.coverUrl} title={item.title} id={item.id} titleSize="xs" className="w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <Link to={`/track/${item.id}`} className="block truncate font-sans text-[16px] text-ink hover:underline">
            {item.title}
          </Link>
          {item.maker ? <div className="truncate font-mono text-[11px] text-muted">@{item.maker.alias}</div> : null}
        </div>
        {meta.src ? <PlayButton size={40} playing={on} onClick={() => toggle(meta)} label={on ? t('common.pause') : t('common.play')} /> : null}
      </div>
    )
  }
  const to = item.type === 'battle' ? `/battles/${item.id}` : `/release/${item.id}`
  const cover = item.type === 'battle' ? item.cover : item.coverUrl
  const sub =
    item.type === 'battle'
      ? `${t(`kind.long.${item.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)} · ${t(`status.${item.status}`)}`
      : `${t(`music.type.${item.releaseType}`)}${item.maker ? ` · @${item.maker.alias}` : ''}`
  return (
    <Link to={to} className="group flex items-center gap-4 border border-line bg-panel p-3 hover:border-line-bright">
      <Cover src={cover} title={item.title} id={item.id} titleSize="xs" className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[16px] text-ink">{item.title}</div>
        <div className="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{sub}</div>
      </div>
      <IconChevronRight size={16} className="shrink-0 text-muted group-hover:text-ink" />
    </Link>
  )
}

export default function ArticleBody({ body, refs = [] }) {
  const t = useT()
  const byKey = new Map(refs.map((r) => [r.key, r]))
  return (
    <div className="space-y-6">
      {parseBlocks(body).map((b, i) => {
        const k = `b${i}`
        if (b.t === 'h2') return <h2 key={k} className="t-display pt-4 text-[2rem] text-ink">{inline(b.text, k)}</h2>
        if (b.t === 'h3') return <h3 key={k} className="pt-2 font-sans text-[1.3rem] font-semibold text-ink">{inline(b.text, k)}</h3>
        if (b.t === 'quote')
          return (
            <blockquote key={k} className="paper my-2 px-6 py-5 t-display text-[1.7rem] leading-tight text-paper-ink">
              {inline(b.text, k)}
            </blockquote>
          )
        if (b.t === 'ul')
          return (
            <ul key={k} className="list-[square] space-y-2 pl-5 font-sans text-[17px] leading-relaxed text-ink-dim marker:text-faint">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, `${k}-${j}`)}</li>
              ))}
            </ul>
          )
        if (b.t === 'img')
          return (
            <figure key={k}>
              <img src={mediaUrl(b.src)} alt={b.alt} loading="lazy" decoding="async" className="w-full border border-line" />
              {b.credit ? <figcaption className="mt-2 font-mono text-[11px] text-faint">{t('journal.credit', { credit: b.credit })}</figcaption> : null}
            </figure>
          )
        if (b.t === 'embed') {
          const item = byKey.get(b.key)
          return item ? <RefCard key={k} item={item} /> : null
        }
        return (
          <p key={k} className="font-sans text-[17px] leading-[1.7] text-ink-dim">
            {inline(b.text, k)}
          </p>
        )
      })}
    </div>
  )
}
