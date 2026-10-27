// Journal building blocks: the lead story and compact story rows, shared by the
// Journal index, Home and the article's "more" list.
import { Link } from 'react-router-dom'
import { useT, useI18n } from '../i18n/index.jsx'
import { mediaUrl } from '../api.js'
import { Tape } from './crate.jsx'

export const JOURNAL_CATEGORIES = ['artists', 'sound', 'scene', 'industry', 'originals']

// "27 Oct 2026" / "27 okt 2026"
export function useStoryDate() {
  const { lang } = useI18n()
  const f = new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (ts) => (ts ? f.format(ts) : '')
}

export function StoryLabel({ story, className = '' }) {
  const t = useT()
  const text =
    story.label === 'sponsored'
      ? t('journal.label.sponsored', { name: story.sponsorName || '?' })
      : t(`journal.label.${story.label === 'artist' ? 'artist' : 'editorial'}`)
  return (
    <span
      className={`inline-block font-mono text-[10px] uppercase tracking-[0.1em] ${
        story.label === 'sponsored' ? 'bg-paper px-1.5 py-0.5 text-paper-ink' : 'text-muted'
      } ${className}`}
    >
      {text}
    </span>
  )
}

function StoryImage({ story, className = '', duo = false }) {
  if (!story.coverUrl) return <div className={`sleeve-grid bg-panel-2 ${className}`} aria-hidden="true" />
  return (
    <div className={`overflow-hidden bg-panel ${duo ? 'duo-red' : ''} ${className}`}>
      <img
        src={mediaUrl(story.coverUrl)}
        alt={story.coverAlt || ''}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover ${duo ? '' : 'photocopy'}`}
      />
    </div>
  )
}

// The big front story: image (red duotone), section tag, headline, standfirst.
export function StoryLead({ story }) {
  const t = useT()
  const fmtDate = useStoryDate()
  return (
    <Link to={`/journal/${story.slug}`} className="group relative block border border-line-bright bg-panel">
      <Tape className="-top-2 right-8" rotate={4} />
      {/* wide screens: a flatter frame so the headline sits in the first view */}
      <StoryImage story={story} duo className="aspect-[16/10] w-full lg:aspect-[21/9]" />
      <div className="relative -mt-16 px-5 pb-6 sm:-mt-24 sm:px-8 sm:pb-8">
        <span className="inline-block bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-paper-ink">
          {t(`journal.cat.${story.category}`)}
        </span>
        <h2 className="t-display mt-3 text-[clamp(2.2rem,8vw,4.4rem)] text-ink group-hover:text-bright">{story.title}</h2>
        {story.standfirst ? (
          <p className="mt-3 max-w-prose font-sans text-[16px] leading-relaxed text-ink-dim">{story.standfirst}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
          {story.publishedAt ? <span>{fmtDate(story.publishedAt)}</span> : null}
          <span>{t('journal.read', { n: story.readMinutes })}</span>
          <StoryLabel story={story} />
        </div>
      </div>
    </Link>
  )
}

// A compact row: square thumb, section, headline, read time.
export function StoryRow({ story, showStatus = false, to }) {
  const t = useT()
  return (
    <Link to={to || `/journal/${story.slug}`} className="group flex gap-4 border-b border-line py-4">
      <StoryImage story={story} className="h-24 w-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <span>{t(`journal.cat.${story.category}`)}</span>
          {showStatus ? <span className="border border-line-bright px-1.5 py-0.5 text-ink-dim">{t(`journal.status.${story.status}`)}</span> : null}
        </div>
        <div className="mt-1 line-clamp-3 font-sans text-[17px] font-semibold leading-snug text-ink group-hover:underline">
          {story.title}
        </div>
        <div className="mt-1.5 font-mono text-[11px] text-faint">
          {t('journal.read', { n: story.readMinutes })}
          {story.author ? ` · @${story.author.alias}` : ''}
        </div>
      </div>
    </Link>
  )
}
