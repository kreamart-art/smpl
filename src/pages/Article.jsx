import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { mediaUrl } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import ShareSheet from '../components/ShareSheet.jsx'
import ArticleBody, { RefCard } from '../components/ArticleBody.jsx'
import { StoryRow, StoryLabel, useStoryDate } from '../components/journal.jsx'
import { EmptyState, SectionHead } from '../components/crate.jsx'
import { IconBack } from '../components/icons.jsx'

// One Journal story: cover, section, headline, standfirst, byline (with its
// editorial / artist / sponsored label), the body, what it links to, more.
export default function Article() {
  const { slug } = useParams()
  const t = useT()
  const fmtDate = useStoryDate()
  const { fetchStory } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    setData(null)
    fetchStory(slug).then((r) => alive && setData(r.ok ? r : { error: true }))
    return () => {
      alive = false
    }
  }, [slug, fetchStory])

  useEffect(() => {
    if (data?.article) document.title = `${data.article.seoTitle || data.article.title}: SMPL Journal`
  }, [data])

  if (!data) return <div className="px-4 py-24 text-center font-mono text-[12px] text-muted">{t('common.loading')}</div>
  if (data.error)
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('journal.notFound')} action={<Link to="/journal" className="underline">{t('journal.back')}</Link>} />
      </div>
    )

  const { article: a, refs, more } = data
  // embeds already sit in the body; the list below shows the rest it links to
  const inBody = new Set([...String(a.body).matchAll(/^@(artist|battle|release|track):([\w.-]+)\s*$/gm)].map((m) => `${m[1]}:${m[2]}`))
  const extra = refs.filter((r) => !inBody.has(r.key))

  return (
    <article className="pb-16">
      <div className="relative">
        {a.coverUrl ? (
          <figure>
            <img src={mediaUrl(a.coverUrl)} alt={a.coverAlt || ''} className="photocopy max-h-[70vh] w-full object-cover" />
            {a.coverCredit ? (
              <figcaption className="mx-auto max-w-[760px] px-4 pt-2 font-mono text-[11px] text-faint sm:px-6">
                {t('journal.credit', { credit: a.coverCredit })}
              </figcaption>
            ) : null}
          </figure>
        ) : (
          <div className="sleeve-grid h-32 border-b border-line bg-panel-2" aria-hidden="true" />
        )}
      </div>

      <div className="mx-auto max-w-[760px] px-4 pt-6 sm:px-6 sm:pt-8">
        <Link to="/journal" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink">
          <IconBack size={14} />
          {t('journal.back')}
        </Link>

        <div className="mt-6">
          <Link
            to={`/journal?c=${a.category}`}
            className="inline-block bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-accent-ink"
          >
            {t(`journal.cat.${a.category}`)}
          </Link>
        </div>
        <h1 className="t-display mt-4 text-[clamp(2.6rem,10vw,5rem)] text-ink">{a.title}</h1>
        {a.standfirst ? <p className="mt-5 font-sans text-[20px] leading-snug text-ink-dim">{a.standfirst}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-line py-3">
          {a.author ? (
            <Link to={`/profile/${encodeURIComponent(a.author.alias)}`} className="flex items-center gap-2">
              <Avatar alias={a.author.alias} src={a.author.avatar} size={32} />
              <span className="font-mono text-[12px] text-ink">
                {t('journal.by')} @{a.author.alias}
              </span>
              {a.author.verified ? <VerifiedBadge size={12} /> : null}
            </Link>
          ) : null}
          <span className="font-mono text-[11px] text-muted">
            {a.publishedAt ? fmtDate(a.publishedAt) : t(`journal.status.${a.status}`)} · {t('journal.read', { n: a.readMinutes })}
          </span>
          <StoryLabel story={a} />
          <ShareSheet className="ml-auto h-9 w-9" title={a.title} text={a.standfirst || a.title} />
        </div>

        <div className="mt-8">
          <ArticleBody body={a.body} refs={refs} />
        </div>

        {a.tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {a.tags.map((tag) => (
              <span key={tag} className="border border-line-bright px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {extra.length ? (
          <section className="mt-12">
            <SectionHead title={t('journal.related')} />
            <div className="mt-4 space-y-3">
              {extra.map((r) => (
                <RefCard key={r.key} item={r} />
              ))}
            </div>
          </section>
        ) : null}

        {more?.length ? (
          <section className="mt-12">
            <SectionHead title={t('journal.more')} to="/journal" more={t('journal.back')} />
            <div>
              {more.map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
