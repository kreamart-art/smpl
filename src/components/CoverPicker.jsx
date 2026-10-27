import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import AvatarCropper from './AvatarCropper.jsx'
import { Cover } from './crate.jsx'
import { mediaUrl } from '../api.js'

// Artwork picker: pick, crop, upload. Square for sleeves (battles, tracks,
// releases), wide for a profile cover photo. The crop is re-encoded to a JPEG,
// which also strips the photo's location data.
export default function CoverPicker({ value, onChange, title, className = '', aspect = 1, size = 1400, cropTitle, hint }) {
  const wide = aspect > 1
  const t = useT()
  const { uploadImage } = useApp()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onPick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setErr(t('cover.notImage'))
      return
    }
    setErr('')
    setFile(f)
  }

  const onSave = async (blob) => {
    setFile(null)
    setBusy(true)
    const r = await uploadImage(new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
    setBusy(false)
    if (r.ok) onChange(r.url)
    else setErr(r.error || t('cover.failed'))
  }

  return (
    <div className={`${wide ? 'space-y-3' : 'flex items-start gap-4'} ${className}`}>
      {wide ? (
        <div className="sleeve-grid w-full overflow-hidden border border-line bg-panel-2" style={{ aspectRatio: String(aspect) }}>
          {value ? <img src={mediaUrl(value)} alt="" className="h-full w-full object-cover" /> : null}
        </div>
      ) : (
        <div className="w-24 shrink-0">
          <Cover src={value} title={title || '?'} titleSize="xs" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`inline-flex h-10 cursor-pointer items-center border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-bg ${
              busy ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            {busy ? t('cover.uploading') : value ? t('cover.replace') : t('cover.add')}
            <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="h-10 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
            >
              {t('cover.remove')}
            </button>
          ) : null}
        </div>
        <p className="mt-2 font-sans text-[13px] leading-snug text-muted">{hint || t('cover.hint')}</p>
        {err ? <p className="mt-1 font-sans text-[13px] text-accent">{err}</p> : null}
      </div>
      {file ? (
        <AvatarCropper
          file={file}
          size={size}
          aspect={aspect}
          asBlob
          title={cropTitle || t('cover.cropTitle')}
          onSave={onSave}
          onCancel={() => setFile(null)}
        />
      ) : null}
    </div>
  )
}
