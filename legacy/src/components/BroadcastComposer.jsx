import { useState, useRef } from 'react'
import { api, mediaUrl } from '../api.js'
import { useT } from '../i18n/index.jsx'
import { textareaCls } from './ui.jsx'
import { IconBell, IconImage } from './icons.jsx'

// Admin-only: send a one-off message from @SMPL to everyone's DMs. Collapsed by
// default so it stays out of the way in the inbox.
export default function BroadcastComposer() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok, text }
  const fileRef = useRef(null)

  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    setResult(null)
    const up = await api.upload('/api/uploads/image', f)
    setBusy(false)
    if (up.ok && up.url) setImageUrl(up.url)
    else setResult({ ok: false, text: up.error || t('broadcast.failed') })
  }

  const send = async () => {
    if ((!body.trim() && !imageUrl) || busy) return
    setBusy(true)
    setResult(null)
    const r = await api.post('/api/admin/broadcast', { body: body.trim(), imageUrl: imageUrl || undefined })
    setBusy(false)
    if (r.ok) {
      setResult({ ok: true, text: t('broadcast.sent', { n: r.sent }) })
      setBody('')
      setImageUrl('')
    } else {
      setResult({ ok: false, text: r.error || t('broadcast.failed') })
    }
  }

  return (
    <div className="mt-6 border border-accent/40 bg-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
      >
        <IconBell size={16} className="text-accent" />
        <span>{t('broadcast.title')}</span>
        <span className="ml-auto text-muted">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line p-4">
          <p className="font-mono text-[11px] leading-relaxed text-muted">{t('broadcast.hint')}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('broadcast.placeholder')}
            className={textareaCls}
          />
          {imageUrl ? (
            <div className="flex items-center gap-3 border border-line bg-bg px-3 py-2">
              <img src={mediaUrl(imageUrl)} alt="" className="h-12 w-12 border border-line object-cover" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('broadcast.photoAttached')}</span>
              <button onClick={() => setImageUrl('')} className="ml-auto font-mono text-[12px] text-muted hover:text-ink">
                ✕
              </button>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-2 border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-50"
            >
              <IconImage size={14} /> {t('broadcast.photo')}
            </button>
            <button
              onClick={send}
              disabled={busy || (!body.trim() && !imageUrl)}
              className="ml-auto border border-accent bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? t('broadcast.sending') : t('broadcast.send')}
            </button>
          </div>
          {result ? <p className={`font-mono text-[11px] ${result.ok ? 'text-good' : 'text-accent'}`}>{result.text}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
