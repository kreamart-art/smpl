import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Field, Label, inputCls, textareaCls } from '../components/ui.jsx'
import { Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import CoverPicker from '../components/CoverPicker.jsx'
import { VisibilityPicker, canPublishMusic } from '../components/music.jsx'
import { IconBack } from '../components/icons.jsx'

const MAX_BYTES = 30 * 1024 * 1024
const blank = { title: '', audioUrl: '', coverUrl: '', genre: '', bpm: '', musicalKey: '', description: '', visibility: 'public' }

// Upload a new track, or edit one of yours (/create/track/:id). The audio of an
// existing track stays as it is; a new recording is a new track.
export default function UploadTrack() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { currentUser, uploadAudio, createTrack, updateTrack, fetchTrack } = useApp()
  const [form, setForm] = useState(blank)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(!id)
  const editing = !!id

  useEffect(() => {
    if (!id) return
    fetchTrack(id).then((r) => {
      if (r.ok && r.track.userId === currentUser?.id) {
        const tr = r.track
        setForm({
          title: tr.title,
          audioUrl: tr.audioUrl,
          coverUrl: tr.coverUrl,
          genre: tr.genre,
          bpm: tr.bpm || '',
          musicalKey: tr.musicalKey,
          description: tr.description,
          visibility: tr.visibility,
        })
      } else setErr(t('music.notFound'))
      setLoaded(true)
    })
  }, [id, fetchTrack, currentUser, t])

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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onPickAudio = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_BYTES) return setErr(t('upload.tooLarge'))
    setErr('')
    setUploading(true)
    const r = await uploadAudio(file)
    setUploading(false)
    if (r.ok) {
      setForm((f) => ({ ...f, audioUrl: r.url, title: f.title || file.name.replace(/\.[^.]+$/, '') }))
      setFileName(file.name)
    } else setErr(r.error || t('dashboard.msg.uploadFailed'))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!editing && !form.audioUrl) return setErr(t('upload.needAudio'))
    setBusy(true)
    setErr('')
    const payload = {
      title: form.title,
      coverUrl: form.coverUrl,
      genre: form.genre,
      bpm: form.bpm,
      musicalKey: form.musicalKey,
      description: form.description,
      visibility: form.visibility,
    }
    const r = editing ? await updateTrack(id, payload) : await createTrack({ ...payload, audioUrl: form.audioUrl })
    setBusy(false)
    if (r.ok) navigate(`/track/${r.track.id}`)
    else setErr(r.error)
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink"
      >
        <IconBack size={14} />
        {t('common.back')}
      </button>
      <Kicker className="mt-6">{t('music.track')}</Kicker>
      <DisplayTitle size="md" className="mt-1 text-ink">
        {editing ? t('upload.track.editTitle') : t('upload.track.title')}
      </DisplayTitle>

      {!loaded ? null : (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {!editing ? (
            <div>
              <Label>{t('upload.audio')}</Label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex h-11 cursor-pointer items-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-bg ${
                    uploading ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  {uploading ? t('upload.uploading') : form.audioUrl ? t('upload.replaceAudio') : t('upload.chooseAudio')}
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac"
                    className="hidden"
                    onChange={onPickAudio}
                    disabled={uploading}
                  />
                </label>
                {fileName ? <span className="max-w-[220px] truncate font-mono text-[12px] text-ink">{fileName}</span> : null}
              </div>
              <p className="mt-2 font-sans text-[13px] text-muted">{t('upload.audioHint')}</p>
            </div>
          ) : null}

          <Field label={t('upload.trackTitle')}>
            <input className={inputCls} maxLength={120} required value={form.title} onChange={set('title')} />
          </Field>

          <div>
            <Label>{t('battle.cover')}</Label>
            <CoverPicker className="mt-2" value={form.coverUrl} title={form.title} onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label={t('host.genre')}>
              <input className={inputCls} maxLength={40} value={form.genre} onChange={set('genre')} />
            </Field>
            <Field label={t('battle.bpm')}>
              <input className={inputCls} type="number" inputMode="numeric" min={40} max={300} value={form.bpm} onChange={set('bpm')} />
            </Field>
            <Field label={t('battle.key')}>
              <input className={inputCls} maxLength={16} placeholder="F# minor" value={form.musicalKey} onChange={set('musicalKey')} />
            </Field>
          </div>

          <Field label={t('upload.description')}>
            <textarea rows={4} maxLength={2000} className={textareaCls} value={form.description} onChange={set('description')} />
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
            disabled={busy || uploading || (!editing && !form.audioUrl)}
            className="h-12 w-full bg-paper px-5 font-mono text-[12px] uppercase tracking-[0.12em] text-paper-ink transition-colors hover:bg-bright disabled:opacity-40 sm:w-auto"
          >
            {t('upload.save')}
          </button>
        </form>
      )}
    </div>
  )
}
