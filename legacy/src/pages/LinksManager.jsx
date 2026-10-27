// Dedicated page for managing your profile links. Reached from the "Manage
// links" bar in the profile editor. Add a link with a URL + a title, or remove
// existing ones. Each change saves straight away via updateProfile.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Btn, Field, inputCls } from '../components/ui.jsx'
import { useT } from '../i18n/index.jsx'

export default function LinksManager() {
  const { currentUser, updateProfile } = useApp()
  const navigate = useNavigate()
  const t = useT()
  const [links, setLinks] = useState(() => (currentUser?.links || []).map((l) => ({ ...l })))
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!currentUser) return <Navigate to="/login" replace />

  const persist = async (next) => {
    setBusy(true)
    setErr('')
    const r = await updateProfile({ links: next })
    setBusy(false)
    if (r.ok) setLinks(next)
    else setErr(r.error || t('settings.saveFailed'))
    return r.ok
  }

  const add = async () => {
    const u = url.trim()
    const lb = label.trim()
    if (!u || !lb) {
      setErr(t('profile.linkBothRequired'))
      return
    }
    // add a scheme if the user left it off, so the link actually opens
    const href = /^https?:\/\//i.test(u) ? u : `https://${u}`
    const ok = await persist([...links, { label: lb, url: href }])
    if (ok) {
      setUrl('')
      setLabel('')
    }
  }

  const remove = (i) => persist(links.filter((_, idx) => idx !== i))

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/edit-profile')}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {t('profile.editProfile')}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">{t('profile.links')}</span>
      </div>

      <div className="border border-line-bright bg-panel">
        <div className="divide-y divide-line">
          {links.length ? (
            links.map((l, i) => (
              <div key={`${l.label}-${i}`} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12px] uppercase tracking-[0.1em] text-ink">{l.label}</div>
                  <div className="truncate font-mono text-[10px] text-muted">{l.url}</div>
                </div>
                <button
                  onClick={() => remove(i)}
                  disabled={busy}
                  aria-label={t('common.delete')}
                  className="shrink-0 border border-line-bright px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-ink disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 font-mono text-[11px] text-muted">{t('profile.linksEmpty')}</div>
          )}
        </div>

        <div className="space-y-4 border-t border-line p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t('profile.linkAdd')}</div>
          <Field label={t('profile.linkUrl')}>
            <input
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>
          <Field label={t('profile.linkTitle')}>
            <input
              className={inputCls}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('profile.linkTitlePh')}
              maxLength={40}
            />
          </Field>
          {err ? <p className="font-mono text-[11px] text-ink">{err}</p> : null}
          <Btn onClick={add} variant="solid" disabled={busy}>
            {busy ? t('profile.saving') : t('profile.linkAddBtn')}
          </Btn>
        </div>
      </div>
    </div>
  )
}
