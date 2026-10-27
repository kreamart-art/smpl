import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Field, Label, inputCls, textareaCls } from '../components/ui.jsx'
import { Kicker, DisplayTitle, EmptyState, Cover } from '../components/crate.jsx'
import CoverPicker from '../components/CoverPicker.jsx'
import { VisibilityPicker, VisibilityTag, canPublishMusic } from '../components/music.jsx'
import { IconBack, IconPlus, IconClose } from '../components/icons.jsx'

const TYPES = ['single', 'ep', 'album']
const toDateInput = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '')

// Bundle your own tracks into a single / EP / album, or edit one (/create/release/:id).
export default function PublishRelease() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { currentUser, fetchMusic, fetchRelease, createRelease, updateRelease } = useApp()
  const [form, setForm] = useState({
    type: 'single',
    title: '',
    coverUrl: '',
    releaseDate: toDateInput(Date.now()),
    description: '',
    visibility: 'public',
  })
  const [mine, setMine] = useState(null) // the member's own tracks
  const [picked, setPicked] = useState([]) // ordered track ids
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const editing = !!id
  // the id, not the object: the bootstrap poll hands back a new currentUser
  // every 25 s, and keyed on that the form reloaded over your edits
  const uid = currentUser?.id

  useEffect(() => {
    if (!uid) return
    fetchMusic(uid).then((r) => setMine(r.ok ? r.tracks : []))
    if (!id) return
    fetchRelease(id).then((r) => {
      if (!r.ok || r.release.userId !== uid) return setErr(t('music.notFound'))
      const rel = r.release
      setForm({
        type: rel.type,
        title: rel.title,
        coverUrl: rel.coverUrl,
        releaseDate: toDateInput(rel.releaseDate),
        description: rel.description,
        visibility: rel.visibility,
      })
      setPicked(r.tracks.map((tr) => tr.id))
    })
  }, [uid, id, fetchMusic, fetchRelease, t])

  const byId = useMemo(() => new Map((mine || []).map((tr) => [tr.id, tr])), [mine])
  const available = (mine || []).filter((tr) => !picked.includes(tr.id))

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('create.joinSmpl')} action={<Link to="/login" className="underline">{t('create.login')}</Link>} />
      </div>
    )
  }
  if (!canPublishMusic(currentUser)) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24">
        <EmptyState title={t('upload.makerOnly')} action={<Link to="/settings" className="underline">{t('create.becomeMaker')}</Link>} />
      </div>
    )
  }

  const move = (i, d) =>
    setPicked((p) => {
      const n = [...p]
      const j = i + d
      if (j < 0 || j >= n.length) return p
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const ms = form.releaseDate ? new Date(`${form.releaseDate}T12:00:00`).getTime() : Date.now()
    const payload = { ...form, releaseDate: ms, trackIds: picked }
    const r = editing ? await updateRelease(id, payload) : await createRelease(payload)
    setBusy(false)
    if (r.ok) navigate(`/release/${r.release.id}`)
    else setErr(r.error)
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink"
      >
        <IconBack size={14} />
        {t('common.back')}
      </button>
      <Kicker className="mt-6">{t('profile.music.releases')}</Kicker>
      <DisplayTitle size="md" className="mt-1 text-ink">
        {editing ? t('release.editTitle') : t('release.title')}
      </DisplayTitle>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <Label>{t('release.type')}</Label>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t('release.type')}>
            {TYPES.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={form.type === k}
                onClick={() => setForm((f) => ({ ...f, type: k }))}
                className={`h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  form.type === k ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                }`}
              >
                {t(`music.type.${k}`)}
              </button>
            ))}
          </div>
        </div>

        <Field label={t('release.name')}>
          <input
            className={inputCls}
            maxLength={120}
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Field>

        <div>
          <Label>{t('battle.cover')}</Label>
          <CoverPicker className="mt-2" value={form.coverUrl} title={form.title} onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))} />
        </div>

        <Field label={t('release.date')}>
          <input
            type="date"
            className={inputCls}
            value={form.releaseDate}
            onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
          />
        </Field>

        <div>
          <Label>{t('release.pick')}</Label>
          <p className="mt-1 font-sans text-[13px] text-muted">{t('release.pickHint')}</p>
          {mine && !mine.length ? (
            <EmptyState
              className="mt-3"
              title={t('release.noTracks')}
              action={
                <Link to="/create/track" className="inline-flex h-10 items-center bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink">
                  {t('create.uploadTrack')}
                </Link>
              }
            />
          ) : null}

          {picked.length ? (
            <div className="mt-3">
              <div className="t-kicker text-ink-dim">{t('release.chosen')}</div>
              <ol className="mt-2 border-t border-line">
                {picked.map((tid, i) => {
                  const tr = byId.get(tid)
                  if (!tr) return null
                  return (
                    <li key={tid} className="flex items-center gap-3 border-b border-line py-2">
                      <span className="w-6 text-right font-mono text-[11px] text-faint tnum">{i + 1}</span>
                      <Cover src={tr.coverUrl} title={tr.title} id={tr.id} titleSize="xs" className="w-10 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-sans text-[15px] text-ink">{tr.title}</span>
                      <VisibilityTag visibility={tr.visibility} />
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('release.up')} className="h-9 w-8 font-mono text-muted hover:text-ink disabled:opacity-30">
                        ↑
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === picked.length - 1} aria-label={t('release.down')} className="h-9 w-8 font-mono text-muted hover:text-ink disabled:opacity-30">
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setPicked((p) => p.filter((x) => x !== tid))}
                        aria-label={t('release.remove')}
                        className="flex h-9 w-8 items-center justify-center text-muted hover:text-ink"
                      >
                        <IconClose size={14} />
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : null}

          {available.length ? (
            <div className="mt-4">
              <div className="t-kicker text-ink-dim">{t('release.available')}</div>
              <ul className="mt-2 border-t border-line">
                {available.map((tr) => (
                  <li key={tr.id}>
                    <button
                      type="button"
                      onClick={() => setPicked((p) => [...p, tr.id])}
                      className="flex w-full items-center gap-3 border-b border-line py-2 text-left hover:bg-panel"
                    >
                      <Cover src={tr.coverUrl} title={tr.title} id={tr.id} titleSize="xs" className="w-10 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-sans text-[15px] text-ink">{tr.title}</span>
                      <VisibilityTag visibility={tr.visibility} />
                      <IconPlus size={16} className="shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Field label={t('release.about')}>
          <textarea
            rows={4}
            maxLength={2000}
            className={textareaCls}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        <div>
          <Label>{t('music.visibility')}</Label>
          <div className="mt-2">
            <VisibilityPicker value={form.visibility} onChange={(v) => setForm((f) => ({ ...f, visibility: v }))} />
          </div>
        </div>

        {err ? <p className="font-sans text-[14px] text-accent">{err}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full bg-paper px-5 font-mono text-[12px] uppercase tracking-[0.12em] text-paper-ink transition-colors hover:bg-bright disabled:opacity-40 sm:w-auto"
        >
          {t('upload.save')}
        </button>
      </form>
    </div>
  )
}
