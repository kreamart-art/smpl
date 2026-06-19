// src/pages/AuthMagic.jsx
// Consumes a magic-link token (/auth/magic?token=…). Three outcomes:
//   • existing account → logged straight in (2FA-aware)
//   • new email → alias-first finish: pick a handle + dob, become a listener
//   • bad/expired link → ask for a new one
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { ageFrom } from '../utils/wave.js'
import Waveform from '../components/Waveform.jsx'
import Avatar from '../components/Avatar.jsx'
import { Btn, Field, inputCls } from '../components/ui.jsx'

// Downscale a picked image to a small JPEG data URL (mirrors signup).
function fileToAvatar(file, cb) {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const max = 256
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      cb(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}

// Latest birth date that is still 16+ (caps the date input).
const maxDob = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 16)
  return d.toISOString().slice(0, 10)
})()

const codeInputCls =
  'w-full bg-bg border border-line text-ink font-mono text-lg tracking-[0.4em] text-center px-3 h-12 outline-none focus:border-ink placeholder:text-muted'

export default function AuthMagic() {
  const { magicConsume, verify2fa, finalizeSignup } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [phase, setPhase] = useState(token ? 'loading' : 'invalid') // loading | invalid | twofa | alias
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // 2FA branch
  const [ticket2fa, setTicket2fa] = useState('')
  const [code, setCode] = useState('')

  // alias-first finish branch
  const [signupTicket, setSignupTicket] = useState('')
  const [email, setEmail] = useState('')
  const [alias, setAlias] = useState('')
  const [dob, setDob] = useState('')
  const [avatar, setAvatar] = useState('')
  const [agree, setAgree] = useState(false)

  const land = (me) => navigate(me?.role === 'curator' ? '/dashboard' : '/battles', { replace: true })

  // Consume the token exactly once.
  // Consume the token exactly once. The ref (not an `alive` cleanup flag) guards
  // re-entry, so React StrictMode's double-invoke in dev can't burn the
  // single-use token twice or discard the result.
  const consumed = useRef(false)
  useEffect(() => {
    if (!token || consumed.current) return
    consumed.current = true
    // strip the token from the address bar / history straight away
    try {
      window.history.replaceState(null, '', '/auth/magic')
    } catch {
      /* ignore */
    }
    magicConsume(token).then((r) => {
      if (!r.ok) {
        setError(r.error || '')
        return setPhase('invalid')
      }
      if (r.token) return land(r.me) // existing account, signed in
      if (r.needs2fa) {
        setTicket2fa(r.ticket)
        return setPhase('twofa')
      }
      if (r.newAccount) {
        setSignupTicket(r.ticket)
        setEmail(r.email || '')
        return setPhase('alias')
      }
      setPhase('invalid')
    })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit2fa = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await verify2fa(ticket2fa, code.trim())
    setBusy(false)
    if (!r.ok) return setError(r.error || '')
    land(r.me)
  }

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (file) fileToAvatar(file, setAvatar)
  }

  const submitAlias = async (e) => {
    e.preventDefault()
    setError('')
    const age = ageFrom(dob, Date.now())
    if (age === null) return setError(t('auth.ageInvalid'))
    if (age < 16) return setError(t('auth.ageTooYoung'))
    if (!agree) return setError(t('auth.signup.mustAgree'))
    setBusy(true)
    const r = await finalizeSignup({ ticket: signupTicket, alias, dob, avatar, acceptTerms: true })
    setBusy(false)
    if (!r.ok) return setError(r.error || '')
    land(r.me)
  }

  // ---- loading / invalid: centered, matches the verify-email screen ----
  if (phase === 'loading' || phase === 'invalid') {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-24 text-center sm:px-6">
        <div className="font-sans text-2xl font-bold tracking-[0.3em]">SMPL</div>
        <p className="mt-8 font-mono text-[13px] leading-relaxed text-ink">
          {phase === 'loading' ? t('auth.magic.checking') : error || t('auth.magic.invalid')}
        </p>
        {phase === 'loading' ? (
          <div className="mt-8 flex justify-center">
            <Waveform seed="magic-wave" bars={40} height={36} baseClass="bg-line-bright" />
          </div>
        ) : (
          <div className="mt-8">
            <Btn to="/login" variant="solid" size="lg">
              {t('auth.magic.requestNew')}
            </Btn>
          </div>
        )}
      </div>
    )
  }

  // ---- two-factor (existing account had it on) ----
  if (phase === 'twofa') {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 sm:px-6">
        <div className="border border-line bg-panel p-6 sm:p-8">
          <h1 className="font-sans text-2xl font-bold uppercase tracking-tight">{t('auth.2fa.title')}</h1>
          <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">{t('auth.2fa.intro')}</p>
          <form onSubmit={submit2fa} className="mt-6 space-y-4">
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
        </div>
      </div>
    )
  }

  // ---- alias-first finish (brand-new account) ----
  return (
    <div className="mx-auto max-w-[480px] px-4 py-16 sm:px-6">
      <div className="border border-line bg-panel p-6 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{t('auth.magic.eyebrow')}</div>
        <h1 className="mt-3 font-sans text-2xl font-bold uppercase tracking-tight">{t('auth.magic.welcomeTitle')}</h1>
        <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">{t('auth.magic.welcomeIntro')}</p>

        <div className="mt-5 flex items-center gap-2 border border-line-bright px-3 py-2 font-mono text-[11px] text-muted">
          <span className="text-ink">✓</span>
          <span className="truncate">
            {t('auth.magic.emailConfirmed')} · <span className="text-ink">{email}</span>
          </span>
        </div>

        <form onSubmit={submitAlias} className="mt-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar alias={alias || '?'} src={avatar} size={56} />
            <label className="cursor-pointer border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg">
              {t('auth.signup.uploadPhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
            </label>
            {avatar ? (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                {t('auth.signup.removePhoto')}
              </button>
            ) : null}
          </div>

          <Field label={t('auth.field.alias')} hint={t('auth.field.aliasHint')}>
            <input
              className={inputCls}
              placeholder={t('auth.field.aliasPlaceholder')}
              value={alias}
              onChange={(e) => setAlias(e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, ''))}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </Field>

          <Field label={t('auth.field.dob')} hint={t('auth.magic.dobHint')}>
            <input
              type="date"
              max={maxDob}
              className={`${inputCls} [color-scheme:dark]`}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 border border-line px-4 py-3.5">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#f0eee9]"
            />
            <span className="font-mono text-[11px] leading-relaxed text-muted">
              {t('auth.signup.agreePre')}{' '}
              <Link to="/terms" target="_blank" className="text-ink underline underline-offset-4">
                {t('common.terms')}
              </Link>{' '}
              {t('auth.signup.agreeAnd')}{' '}
              <Link to="/privacy" target="_blank" className="text-ink underline underline-offset-4">
                {t('common.privacy')}
              </Link>
              .
            </span>
          </label>

          {error ? (
            <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
          ) : null}

          <Btn type="submit" variant="solid" size="lg" full disabled={busy || alias.length < 2 || !agree}>
            {busy ? t('auth.magic.finishing') : t('auth.magic.finish')}
          </Btn>
        </form>
      </div>
    </div>
  )
}
