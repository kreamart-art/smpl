import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Field, Label, inputCls, textareaCls } from '../components/ui.jsx'
import { Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import { canPublishMusic } from '../components/music.jsx'
import { mediaUrl } from '../api.js'
import { IconBack } from '../components/icons.jsx'

const MAX_BYTES = 60 * 1024 * 1024
const KINDS = ['studio', 'music', 'live']

// Upload a video to your profile: the same pipeline as waveform clips (it is
// converted to a clean MP4 with a poster), with a kind, a title and a few words.
export default function UploadVideo() {
  const t = useT()
  const navigate = useNavigate()
  const { currentUser, uploadVideo, saveWaveformVideo } = useApp()
  const [file, setFile] = useState(null) // { url, poster, name }
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', kind: 'studio', description: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

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

  const onPick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_BYTES) return setErr(t('upload.video.tooLarge'))
    setErr('')
    setUploading(true)
    const r = await uploadVideo(f)
    setUploading(false)
    if (r.ok) {
      setFile({ url: r.url, poster: r.poster || '', name: f.name })
      setForm((x) => ({ ...x, title: x.title || f.name.replace(/\.[^.]+$/, '') }))
    } else setErr(r.error || t('dashboard.msg.uploadFailed'))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setErr(t('upload.video.needFile'))
    setBusy(true)
    setErr('')
    const r = await saveWaveformVideo({
      url: file.url,
      poster: file.poster,
      battleId: '',
      tag: form.title,
      kind: form.kind,
      title: form.title,
      description: form.description,
    })
    setBusy(false)
    if (r.ok) navigate(`/clip/${r.video.id}`)
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
      <Kicker className="mt-6">{t('profile.tab.videos')}</Kicker>
      <DisplayTitle size="md" className="mt-1 text-ink">
        {t('upload.video.title')}
      </DisplayTitle>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <Label>{t('upload.video.file')}</Label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex h-11 cursor-pointer items-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-bg ${
                uploading ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {uploading ? t('upload.video.converting') : t('upload.video.choose')}
              <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={onPick} disabled={uploading} />
            </label>
            {file ? <span className="max-w-[240px] truncate font-mono text-[12px] text-ink">{file.name}</span> : null}
          </div>
          <p className="mt-2 font-sans text-[13px] text-muted">{t('upload.video.hint')}</p>
          {file?.poster ? (
            <img src={mediaUrl(file.poster)} alt="" className="mt-3 max-h-48 border border-line object-contain" />
          ) : null}
        </div>

        <div>
          <Label>{t('upload.video.kind')}</Label>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('upload.video.kind')}>
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={form.kind === k}
                onClick={() => setForm((x) => ({ ...x, kind: k }))}
                className={`h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.12em] ${
                  form.kind === k ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                }`}
              >
                {t(`video.kind.${k}`)}
              </button>
            ))}
          </div>
        </div>

        <Field label={t('upload.trackTitle')}>
          <input className={inputCls} maxLength={120} required value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
        </Field>
        <Field label={t('upload.description')}>
          <textarea rows={3} maxLength={1000} className={textareaCls} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
        </Field>

        {err ? <p className="font-sans text-[14px] text-accent">{err}</p> : null}
        <button
          type="submit"
          disabled={busy || uploading || !file}
          className="h-12 w-full bg-paper px-5 font-mono text-[12px] uppercase tracking-[0.12em] text-paper-ink transition-colors hover:bg-bright disabled:opacity-40 sm:w-auto"
        >
          {t('upload.save')}
        </button>
      </form>
    </div>
  )
}
