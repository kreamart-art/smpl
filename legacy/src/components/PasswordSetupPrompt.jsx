// src/components/PasswordSetupPrompt.jsx
// Logged-in accounts that signed up via an email magic link have no password.
// Now that email links are going away, prompt them (once per session, until
// they set one) to choose a password so they can keep logging in.
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Portal from './Portal.jsx'
import { Btn, Field, inputCls } from './ui.jsx'

const SNOOZE = 'smpl_setpw_snooze'

export default function PasswordSetupPrompt() {
  const { currentUser, changePassword } = useApp()
  const t = useT()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [snoozed, setSnoozed] = useState(() => {
    try {
      return !!sessionStorage.getItem(SNOOZE)
    } catch {
      return false
    }
  })

  // only signed-in accounts that have NO password yet
  if (!currentUser || currentUser.hasPassword !== false || snoozed) return null

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.length < 4) return setError(t('auth.changePw.tooShort'))
    if (pw !== confirm) return setError(t('auth.changePw.mismatch'))
    setBusy(true)
    const r = await changePassword(null, pw) // passwordless account → no current password
    setBusy(false)
    if (!r.ok) return setError(r.error || '')
    // hasPassword flips on refresh → this component unmounts itself
  }

  const later = () => {
    try {
      sessionStorage.setItem(SNOOZE, '1')
    } catch {
      /* ignore */
    }
    setSnoozed(true)
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="w-full max-w-[420px] border border-line-bright bg-panel p-6 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]">
          <h2 className="font-sans text-xl font-bold uppercase tracking-tight">{t('auth.setPw.title')}</h2>
          <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">{t('auth.setPw.body')}</p>
          <form onSubmit={save} className="mt-5 space-y-4">
            <Field label={t('auth.changePw.new')} hint={t('auth.field.passwordHint')}>
              <input
                type="password"
                className={inputCls}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label={t('auth.changePw.confirm')}>
              <input
                type="password"
                className={inputCls}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error ? (
              <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
            ) : null}
            <div className="flex items-center gap-3">
              <Btn type="submit" variant="solid" size="lg" full disabled={busy || pw.length < 4}>
                {busy ? t('auth.changePw.saving') : t('auth.changePw.save')}
              </Btn>
              <button
                type="button"
                onClick={later}
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                {t('auth.setPw.later')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
