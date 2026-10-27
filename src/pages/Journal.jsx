import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import { StoryLead, StoryRow, JOURNAL_CATEGORIES } from '../components/journal.jsx'

const canWriteJournal = (u) => !!u && (u.editorRole === 'author' || u.editorRole === 'editor' || u.role === 'admin' || u.alias === 'SMPL')

// The Journal index: one lead story, then the rest as rows, per section.
export default function Journal() {
  const t = useT()
  const { fetchJournal, currentUser } = useApp()
  const [params, setParams] = useSearchParams()
  const cat = JOURNAL_CATEGORIES.includes(params.get('c')) ? params.get('c') : 'all'
  const [items, setItems] = useState(null)

  useEffect(() => {
    let alive = true
    setItems(null)
    fetchJournal(cat === 'all' ? null : cat, 30).then((r) => alive && setItems(r.ok ? r.articles : []))
    return () => {
      alive = false
    }
  }, [cat, fetchJournal])

  const lead = items?.[0]
  const rest = items?.slice(1) || []

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker>{t('journal.kicker')}</Kicker>
          <DisplayTitle size="lg" className="mt-2 text-ink">
            {t('journal.title')}
          </DisplayTitle>
        </div>
        {canWriteJournal(currentUser) ? (
          <Link
            to="/journal/desk"
            className="mb-2 inline-flex h-10 items-center border border-line-bright px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-bg"
          >
            {t('journal.desk')}
          </Link>
        ) : null}
      </div>

      <div role="tablist" aria-label={t('journal.title')} className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {['all', ...JOURNAL_CATEGORIES].map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={cat === k}
            onClick={() => setParams(k === 'all' ? {} : { c: k }, { replace: true })}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              cat === k ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t(`journal.cat.${k}`)}
          </button>
        ))}
      </div>

      {items === null ? null : !items.length ? (
        <EmptyState className="mt-8" title={cat === 'all' ? t('journal.empty') : t('journal.emptyCat')} />
      ) : (
        <>
          <div className="mt-8">
            <StoryLead story={lead} />
          </div>
          {rest.length ? (
            <div className="mt-8 grid grid-cols-1 gap-x-10 border-t border-line lg:grid-cols-2">
              {rest.map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
