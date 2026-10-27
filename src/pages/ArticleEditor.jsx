import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Field, Label, inputCls, textareaCls } from '../components/ui.jsx'
import { Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import CoverPicker from '../components/CoverPicker.jsx'
import ArticleBody from '../components/ArticleBody.jsx'
import { JOURNAL_CATEGORIES } from '../components/journal.jsx'
import { IconBack } from '../components/icons.jsx'

const blank = {
  title: '',
  standfirst: '',
  body: '',
  category: 'scene',
  tags: '',
  label: 'editorial',
  sponsorName: '',
  coverUrl: '',
  coverAlt: '',
  coverCredit: '',
  seoTitle: '',
  seoDescription: '',
}
const isEditor = (u) => !!u && (u.editorRole === 'editor' || u.role === 'admin' || u.alias === 'SMPL')
const canWrite = (u) => isEditor(u) || u?.editorRole === 'author'

// Write or edit a Journal story. Authors save and send to the editors; editors
// (and the house) publish, schedule or take a story offline.
export default function ArticleEditor() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { currentUser, fetchArticle, createArticle, updateArticle, articleAction, deleteArticle } = useApp()
  const [form, setForm] = useState(blank)
  const [meta, setMeta] = useState(null) // { status, slug, authorId }
  const [refs, setRefs] = useState([])
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [scheduleAt, setScheduleAt] = useState('')
  const editor = isEditor(currentUser)

  useEffect(() => {
    if (!id) return
    fetchArticle(id).then((r) => {
      if (!r.ok) return setMsg({ ok: false, text: r.error })
      const a = r.article
      setForm({
        title: a.title,
        standfirst: a.standfirst,
        body: a.body,
        category: a.category,
        tags: (a.tags || []).join(', '),
        label: a.label,
        sponsorName: a.sponsorName,
        coverUrl: a.coverUrl,
        coverAlt: a.coverAlt,
        coverCredit: a.coverCredit,
        seoTitle: a.seoTitle,
        seoDescription: a.seoDescription,
      })
      setMeta({ status: a.status, slug: a.slug, authorId: a.author?.id })
      setRefs(r.refs || [])
    })
  }, [id, fetchArticle])

  if (!canWrite(currentUser)) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('journal.ed.noRights')} />
      </div>
    )
  }

  const locked = !!meta && !editor && (meta.status === 'published' || meta.status === 'scheduled')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // save, creating the story on the first save; returns its id
  const save = async () => {
    setBusy(true)
    setMsg(null)
    const r = id ? await updateArticle(id, form) : await createArticle(form)
    setBusy(false)
    if (!r.ok) {
      setMsg({ ok: false, text: r.error })
      return null
    }
    setMeta({ status: r.article.status, slug: r.article.slug, authorId: r.article.author?.id })
    if (!id) navigate(`/journal/write/${r.article.id}`, { replace: true })
    else setMsg({ ok: true, text: t('journal.ed.saved') })
    return r.article.id
  }

  const act = async (action, data) => {
    const aid = await save()
    if (!aid) return
    setBusy(true)
    const r = await articleAction(aid, action, data)
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: r.error })
    setMeta({ status: r.article.status, slug: r.article.slug, authorId: r.article.author?.id })
    setMsg({ ok: true, text: t(`journal.status.${r.article.status}`) })
  }

  const showPreview = async () => {
    const aid = await save()
    if (!aid) return
    const r = await fetchArticle(aid)
    if (r.ok) setRefs(r.refs || [])
    setPreview(true)
  }

  const onDelete = async () => {
    if (!id || !window.confirm(t('journal.ed.confirmDelete'))) return
    const r = await deleteArticle(id)
    if (r.ok) navigate('/journal/desk')
    else setMsg({ ok: false, text: r.error })
  }

  const btn = 'inline-flex h-11 items-center px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-40'

  return (
    <div className="mx-auto max-w-[820px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Link to="/journal/desk" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink">
        <IconBack size={14} />
        {t('journal.desk')}
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Kicker>
            {t('journal.title')}
            {meta ? ` · ${t(`journal.status.${meta.status}`)}` : ''}
          </Kicker>
          <DisplayTitle size="sm" className="mt-1 text-ink">
            {form.title || t('journal.desk.new')}
          </DisplayTitle>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (preview ? setPreview(false) : showPreview())}
            className={`${btn} border border-line-bright text-ink hover:bg-ink hover:text-bg`}
            disabled={busy}
          >
            {preview ? t('journal.ed.edit') : t('journal.ed.preview')}
          </button>
          {meta?.status === 'published' && meta.slug ? (
            <Link to={`/journal/${meta.slug}`} className={`${btn} border border-line text-muted hover:text-ink`}>
              {t('journal.title')}
            </Link>
          ) : null}
        </div>
      </div>

      {locked ? <p className="mt-6 border border-line bg-panel px-4 py-3 font-sans text-[14px] text-ink-dim">{t('journal.ed.lockedNote')}</p> : null}

      {preview ? (
        <div className="mt-8">
          <h1 className="t-display text-[clamp(2.4rem,9vw,4.5rem)] text-ink">{form.title}</h1>
          {form.standfirst ? <p className="mt-4 font-sans text-[20px] leading-snug text-ink-dim">{form.standfirst}</p> : null}
          <div className="mt-8">
            <ArticleBody body={form.body} refs={refs} />
          </div>
        </div>
      ) : (
        <fieldset disabled={locked} className="mt-8 space-y-6">
          <Field label={t('journal.ed.headline')}>
            <input className={inputCls} maxLength={160} value={form.title} onChange={set('title')} />
          </Field>
          <Field label={t('journal.ed.standfirst')} hint={t('journal.ed.standfirstHint')}>
            <textarea rows={2} maxLength={400} className={textareaCls} value={form.standfirst} onChange={set('standfirst')} />
          </Field>

          <div>
            <Label>{t('journal.ed.category')}</Label>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('journal.ed.category')}>
              {JOURNAL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.category === c}
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={`h-9 border px-3 font-mono text-[11px] uppercase tracking-[0.1em] ${
                    form.category === c ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                  }`}
                >
                  {t(`journal.cat.${c}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t('journal.ed.label')}</Label>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('journal.ed.label')}>
              {(editor ? ['editorial', 'artist', 'sponsored'] : ['artist', 'sponsored']).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={form.label === l}
                  onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={`h-9 border px-3 font-mono text-[11px] uppercase tracking-[0.1em] ${
                    form.label === l ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                  }`}
                >
                  {l === 'sponsored' ? t('journal.label.sponsoredShort') : t(`journal.label.${l}`)}
                </button>
              ))}
            </div>
            {form.label === 'sponsored' ? (
              <div className="mt-3">
                <Field label={t('journal.ed.sponsor')}>
                  <input className={inputCls} maxLength={80} value={form.sponsorName} onChange={set('sponsorName')} />
                </Field>
              </div>
            ) : null}
          </div>

          <div>
            <Label>{t('journal.ed.cover')}</Label>
            <CoverPicker
              className="mt-2"
              aspect={16 / 10}
              size={1600}
              value={form.coverUrl}
              hint={t('journal.ed.coverHint')}
              cropTitle={t('journal.ed.cover')}
              onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
            />
            {form.coverUrl ? (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('journal.ed.coverAlt')}>
                  <input className={inputCls} maxLength={200} value={form.coverAlt} onChange={set('coverAlt')} />
                </Field>
                <Field label={t('journal.ed.coverCredit')}>
                  <input className={inputCls} maxLength={120} value={form.coverCredit} onChange={set('coverCredit')} />
                </Field>
              </div>
            ) : null}
          </div>

          <div>
            <Label>{t('journal.ed.body')}</Label>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">{t('journal.ed.bodyHint')}</p>
            <textarea
              rows={18}
              className={`${textareaCls} mt-2 font-mono text-[14px] leading-relaxed`}
              value={form.body}
              onChange={set('body')}
            />
          </div>

          <Field label={t('journal.ed.tags')} hint={t('journal.ed.tagsHint')}>
            <input className={inputCls} value={form.tags} onChange={set('tags')} />
          </Field>

          <details className="border border-line px-4 py-3">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">{t('journal.ed.seo')}</summary>
            <div className="mt-4 space-y-4">
              <Field label={t('journal.ed.seoTitle')}>
                <input className={inputCls} maxLength={70} value={form.seoTitle} onChange={set('seoTitle')} />
              </Field>
              <Field label={t('journal.ed.seoDescription')}>
                <textarea rows={2} maxLength={170} className={textareaCls} value={form.seoDescription} onChange={set('seoDescription')} />
              </Field>
            </div>
          </details>
        </fieldset>
      )}

      {msg ? <p className={`mt-6 font-sans text-[14px] ${msg.ok ? 'text-ink-dim' : 'text-accent'}`}>{msg.text}</p> : null}

      {!locked ? (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <button type="button" onClick={save} disabled={busy} className={`${btn} border border-line-bright text-ink hover:bg-ink hover:text-bg`}>
            {t('journal.ed.save')}
          </button>
          {!editor && (!meta || meta.status === 'draft') ? (
            <button type="button" onClick={() => act('submit')} disabled={busy} className={`${btn} bg-paper text-paper-ink hover:bg-bright`}>
              {t('journal.ed.submit')}
            </button>
          ) : null}
          {editor ? (
            <>
              <button type="button" onClick={() => act('publish')} disabled={busy} className={`${btn} bg-paper text-paper-ink hover:bg-bright`}>
                {t('journal.ed.publish')}
              </button>
              <label className="flex items-center gap-2">
                <span className="sr-only">{t('journal.ed.scheduleAt')}</span>
                <input type="datetime-local" className={`${inputCls} h-11 w-auto`} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              </label>
              <button
                type="button"
                onClick={() => act('publish', { at: new Date(scheduleAt).getTime() })}
                disabled={busy || !scheduleAt}
                className={`${btn} border border-line-bright text-ink hover:bg-ink hover:text-bg`}
              >
                {t('journal.ed.schedule')}
              </button>
              {meta && (meta.status === 'published' || meta.status === 'scheduled') ? (
                <button type="button" onClick={() => act('unpublish')} disabled={busy} className={`${btn} text-muted hover:text-ink`}>
                  {t('journal.ed.unpublish')}
                </button>
              ) : null}
            </>
          ) : null}
          {id && (editor || meta?.status === 'draft') ? (
            <button type="button" onClick={onDelete} disabled={busy} className={`${btn} ml-auto text-muted hover:text-ink`}>
              {t('journal.ed.delete')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
