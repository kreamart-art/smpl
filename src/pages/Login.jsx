import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Waveform from '../components/Waveform.jsx'
import { Btn, Field, inputCls } from '../components/ui.jsx'

const codeInputCls =
  'w-full bg-bg border border-line text-ink font-mono text-lg tracking-[0.4em] text-center px-3 h-12 outline-none focus:border-ink placeholder:text-muted'

export default function Login() {
  const { login, verify2fa, magicSend } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const [mode, setMode] = useState('magic') // 'magic' (passwordless, primary) | 'password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState('') // set when the account has 2FA on
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false) // magic link emailed
  const [devLink, setDevLink] = useState('')

  const land = (me) => navigate(me?.role === 'curator' ? '/dashboard' : '/battles')

  const sendLink = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await magicSend(email.trim().toLowerCase())
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setSent(true)
    if (r.devLink) setDevLink(r.devLink)
  }

  const go = async (mail, pw) => {
    setBusy(true)
    const r = await login(mail, pw)
    setBusy(false)
    if (!r.ok) return setError(r.error)
    if (r.needs2fa) {
      setTicket(r.ticket)
      setError('')
      return
    }
    land(r.me)
  }

  const submitCode = async () => {
    setBusy(true)
    const r = await verify2fa(ticket, code.trim())
    setBusy(false)
    if (!r.ok) return setError(r.error)
    land(r.me)
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{t('auth.login.eyebrow')}</div>
        <div className="mt-4 font-sans text-[clamp(2.5rem,6vw,5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {t('auth.login.heroLine1')}
          <br />
          {t('auth.login.heroLine2')}
        </div>
        <p className="mt-6 max-w-sm font-mono text-[12px] leading-relaxed text-muted">
          {t('auth.login.intro')}
        </p>
        <div className="mt-10">
          <Waveform seed="login-wave" bars={96} height={56} baseClass="bg-line-bright" />
        </div>
      </div>

      <div className="border border-line bg-panel p-6 sm:p-8">
        {ticket ? (
          /* ---------- step 2 — two-factor ---------- */
          <>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-tight">{t('auth.2fa.title')}</h1>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">
              {t('auth.2fa.intro')}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setError('')
                submitCode()
              }}
              className="mt-6 space-y-4"
            >
              <input
                className={codeInputCls}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t('auth.2fa.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
                autoFocus
              />
              {error ? (
                <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
              ) : null}
              <Btn type="submit" variant="solid" size="lg" full disabled={busy || code.length < 6}>
                {busy ? t('auth.2fa.checking') : t('auth.2fa.verify')}
              </Btn>
            </form>
            <button
              onClick={() => {
                setTicket('')
                setCode('')
                setError('')
              }}
              className="mt-6 font-mono text-[11px] text-muted underline underline-offset-4 hover:text-ink"
            >
              {t('auth.2fa.back')}
            </button>
          </>
        ) : (
          /* ---------- step 1 — log in ---------- */
          <>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-tight">{t('common.login')}</h1>

            {mode === 'magic' ? (
              /* passwordless: email a one-time login link (primary path) */
              sent ? (
                <div className="mt-6 space-y-5">
                  <p className="font-mono text-[12px] leading-relaxed text-ink">{t('auth.magic.sent')}</p>
                  {devLink ? (
                    <div className="border border-line-bright p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{t('auth.forgot.devNote')}</p>
                      <a href={devLink} className="mt-2 block break-all font-mono text-[11px] text-ink underline underline-offset-2">
                        {devLink}
                      </a>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false)
                      setDevLink('')
                    }}
                    className="font-mono text-[11px] text-muted underline underline-offset-4 hover:text-ink"
                  >
                    {t('auth.magic.otherEmail')}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">{t('auth.magic.intro')}</p>
                  <form onSubmit={sendLink} className="mt-6 space-y-4">
                    <Field label={t('auth.field.email')}>
                      <input
                        type="email"
                        className={inputCls}
                        placeholder={t('auth.field.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </Field>
                    {error ? (
                      <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
                    ) : null}
                    <Btn type="submit" variant="solid" size="lg" full disabled={busy || !email.trim()}>
                      {busy ? t('auth.magic.sending') : t('auth.magic.send')}
                    </Btn>
                  </form>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('password')
                      setError('')
                    }}
                    className="mt-4 font-mono text-[11px] text-muted underline underline-offset-4 hover:text-ink"
                  >
                    {t('auth.magic.orPassword')}
                  </button>
                </>
              )
            ) : (
              /* fallback: classic email + password */
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setError('')
                    go(email, password)
                  }}
                  className="mt-6 space-y-4"
                >
                  <Field label={t('auth.field.email')}>
                    <input
                      type="email"
                      className={inputCls}
                      placeholder={t('auth.field.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </Field>
                  <Field label={t('auth.field.password')} hint={t('auth.field.passwordHint')}>
                    <input
                      type="password"
                      className={inputCls}
                      placeholder={t('auth.field.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  {error ? (
                    <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
                  ) : null}
                  <Btn type="submit" variant="solid" size="lg" full disabled={busy}>
                    {busy ? t('auth.login.entering') : t('auth.login.enter')}
                  </Btn>
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link to="/forgot" className="font-mono text-[11px] text-muted underline underline-offset-4 hover:text-ink">
                    {t('auth.forgotLink')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('magic')
                      setError('')
                    }}
                    className="font-mono text-[11px] text-muted underline underline-offset-4 hover:text-ink"
                  >
                    {t('auth.magic.orMagic')}
                  </button>
                </div>
              </>
            )}

            <p className="mt-6 font-mono text-[11px] text-muted">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="text-ink underline underline-offset-4">{t('auth.signupArrow')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
