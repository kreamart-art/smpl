import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { useI18n, useT } from '../i18n/index.jsx'
import Waveform from '../components/Waveform.jsx'
import Portal from '../components/Portal.jsx'
import { Btn, Field, inputCls } from '../components/ui.jsx'

// Shared two-column auth shell, matching the Login page.
function AuthShell({ title, intro, children }) {
  const t = useT()
  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{t('auth.login.eyebrow')}</div>
        <div className="mt-4 font-sans text-[clamp(2.5rem,6vw,5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {t('auth.login.heroLine1')}
          <br />
          {t('auth.login.heroLine2')}
        </div>
        <div className="mt-10">
          <Waveform seed="recover-wave" bars={96} height={56} baseClass="bg-line-bright" />
        </div>
      </div>
      <div className="border border-line bg-panel p-6 sm:p-8">
        <h1 className="font-sans text-2xl font-bold uppercase tracking-tight">{title}</h1>
        {intro ? <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">{intro}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

// /forgot — request a reset link by email.
export function ForgotPassword() {
  const { requestPasswordReset } = useApp()
  const { lang } = useI18n()
  const t = useT()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const r = await requestPasswordReset(email.trim(), lang)
    setBusy(false)
    if (r.ok) {
      setSent(true)
      if (r.devLink) setDevLink(r.devLink)
    }
  }

  return (
    <AuthShell title={t('auth.forgot.title')} intro={sent ? '' : t('auth.forgot.intro')}>
      {sent ? (
        <div className="space-y-5">
          <p className="font-mono text-[12px] leading-relaxed text-ink">{t('auth.forgot.sent')}</p>
          {devLink ? (
            <div className="border border-line-bright p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{t('auth.forgot.devNote')}</p>
              <a href={devLink} className="mt-2 block break-all font-mono text-[11px] text-ink underline underline-offset-2">
                {devLink}
              </a>
            </div>
          ) : null}
          <Link to="/login" className="inline-block font-mono text-[11px] text-muted hover:text-ink">
            {t('auth.forgot.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('auth.field.email')}>
            <input
              type="email"
              className={inputCls}
              placeholder={t('auth.forgot.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </Field>
          <Btn type="submit" variant="solid" size="lg" full disabled={busy || !email.trim()}>
            {busy ? t('auth.forgot.sending') : t('auth.forgot.send')}
          </Btn>
          <Link to="/login" className="inline-block font-mono text-[11px] text-muted hover:text-ink">
            {t('auth.forgot.backToLogin')}
          </Link>
        </form>
      )}
    </AuthShell>
  )
}

// /reset?token=… — set a new password.
export function ResetPassword() {
  const { resetPassword } = useApp()
  const t = useT()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // null | 'in' | '2fa'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.length < 4) return setError(t('auth.reset.tooShort'))
    if (pw !== confirm) return setError(t('auth.reset.mismatch'))
    setBusy(true)
    const r = await resetPassword(token, pw)
    setBusy(false)
    if (!r.ok) return setError(r.error || t('auth.reset.invalid'))
    setDone(r.needs2fa ? '2fa' : 'in')
  }

  if (!token) {
    return (
      <AuthShell title={t('auth.reset.title')}>
        <p className="font-mono text-[12px] leading-relaxed text-ink">{t('auth.reset.noToken')}</p>
        <Link to="/forgot" className="mt-5 inline-block font-mono text-[11px] text-muted hover:text-ink">
          {t('auth.reset.requestNew')}
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title={t('auth.reset.title')}>
        <p className="font-mono text-[12px] leading-relaxed text-ink">
          {t(done === '2fa' ? 'auth.reset.done2fa' : 'auth.reset.done')}
        </p>
        <div className="mt-6">
          <Btn to={done === '2fa' ? '/login' : '/battles'} variant="solid" size="lg">
            {t(done === '2fa' ? 'auth.reset.toLogin' : 'auth.reset.continue')}
          </Btn>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('auth.reset.title')} intro={t('auth.reset.intro')}>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          className={inputCls}
          placeholder={t('auth.reset.newPlaceholder')}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className={inputCls}
          placeholder={t('auth.reset.confirmPlaceholder')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? (
          <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
        ) : null}
        <Btn type="submit" variant="solid" size="lg" full disabled={busy}>
          {busy ? t('auth.reset.submitting') : t('auth.reset.submit')}
        </Btn>
      </form>
    </AuthShell>
  )
}

// /verify?token=… — confirm an email address.
export function VerifyEmail() {
  const { verifyEmailToken } = useApp()
  const { standalone } = usePWA()
  const t = useT()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState(token ? 'checking' : 'notoken')
  const [appPrompt, setAppPrompt] = useState(false)

  useEffect(() => {
    if (!token) return
    let alive = true
    verifyEmailToken(token).then((r) => {
      if (!alive) return
      setState(r.ok ? 'done' : 'failed')
      // The verify link opens in the browser. If they're not already in the
      // installed app and they're on a phone, nudge them back to it.
      if (r.ok && !standalone && isPhone()) setAppPrompt(true)
    })
    return () => {
      alive = false
    }
  }, [token, verifyEmailToken, standalone])

  const openApp = () => {
    try {
      localStorage.setItem('smpl_app', '1')
    } catch {
      /* ignore */
    }
    window.location.href = '/?app=1'
  }

  const body = {
    checking: t('auth.verify.checking'),
    done: t('auth.verify.done'),
    failed: t('auth.verify.failed'),
    notoken: t('auth.verify.noToken'),
  }[state]

  return (
    <div className="mx-auto max-w-[520px] px-4 py-24 text-center sm:px-6">
      <div className="font-sans text-2xl font-bold tracking-[0.3em]">SMPL</div>
      <p className="mt-8 font-mono text-[13px] leading-relaxed text-ink">{body}</p>
      {state === 'checking' ? (
        <div className="mt-8 flex justify-center">
          <Waveform seed="verify-wave" bars={40} height={36} baseClass="bg-line-bright" />
        </div>
      ) : (
        <div className="mt-8">
          <Btn to="/battles" variant="solid" size="lg">
            {t('auth.verify.continue')}
          </Btn>
        </div>
      )}

      {appPrompt ? (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
            onClick={() => setAppPrompt(false)}
          >
            <div className="w-full max-w-sm border border-line-bright bg-panel p-6 text-left" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="" className="h-10 w-10 border border-line-bright" aria-hidden />
                <div className="font-sans text-lg font-bold uppercase tracking-tight">{t('auth.verify.appTitle')}</div>
              </div>
              <p className="mt-4 font-mono text-[12px] leading-relaxed text-ink-dim">{t('auth.verify.appBody')}</p>
              <button
                onClick={openApp}
                className="mt-5 h-11 w-full border border-ink bg-ink font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright"
              >
                {t('auth.verify.openApp')}
              </button>
              <button
                onClick={() => setAppPrompt(false)}
                className="mt-2 h-10 w-full border border-line font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
              >
                {t('auth.verify.continueBrowser')}
              </button>
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  )
}

// A phone-ish browser, where "open the home-screen app" actually makes sense.
function isPhone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(max-width: 820px)')?.matches ||
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
  )
}
