import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Kicker, DisplayTitle, EmptyState, SectionHead } from '../components/crate.jsx'
import { StoryRow } from '../components/journal.jsx'
import { IconBack, IconPlus } from '../components/icons.jsx'

// The writer's desk: your own stories, and for editors the stories waiting on them.
export default function JournalDesk() {
  const t = useT()
  const { fetchMyArticles, currentUser } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!currentUser) return
    fetchMyArticles().then((r) => setData(r.ok ? r : { error: r.error }))
  }, [currentUser, fetchMyArticles])

  if (!currentUser || data?.error) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('journal.ed.noRights')} action={<Link to="/journal" className="underline">{t('journal.back')}</Link>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Link to="/journal" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink">
        <IconBack size={14} />
        {t('journal.back')}
      </Link>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <Kicker>{t('journal.title')}</Kicker>
          <DisplayTitle size="md" className="mt-1 text-ink">
            {t('journal.desk')}
          </DisplayTitle>
        </div>
        <Link
          to="/journal/write"
          className="mb-1 inline-flex h-11 items-center gap-2 bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink hover:bg-bright"
        >
          <IconPlus size={15} />
          {t('journal.desk.new')}
        </Link>
      </div>

      {data ? (
        <>
          {data.canPublish ? (
            <section className="mt-10">
              <SectionHead title={t('journal.desk.queue')} />
              {data.queue.length ? (
                data.queue.map((s) => <StoryRow key={s.id} story={s} showStatus to={`/journal/write/${s.id}`} />)
              ) : (
                <p className="mt-4 font-sans text-[14px] text-muted">{t('journal.desk.empty')}</p>
              )}
            </section>
          ) : null}
          <section className="mt-10">
            <SectionHead title={t('journal.desk.mine')} />
            {data.mine.length ? (
              data.mine.map((s) => <StoryRow key={s.id} story={s} showStatus to={`/journal/write/${s.id}`} />)
            ) : (
              <EmptyState className="mt-4" title={t('journal.desk.empty')} />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
