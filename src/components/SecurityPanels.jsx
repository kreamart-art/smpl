import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { Btn, Field, inputCls, Label } from './ui.jsx'
import { useT } from '../i18n/index.jsx'

const codeInputCls =
  'w-full bg-black border border-line text-ink font-mono text-lg tracking-[0.4em] text-center px-3 h-12 outline-none focus:border-ink placeholder:text-muted'

// ---------------------------------------------------------------------------
// TWO-FACTOR (TOTP) — enrol with an authenticator app, store backup codes.
// ---------------------------------------------------------------------------
export function TwoFactorPanel({ onBack }) {
  const { currentUser, setup2fa, enable2fa, disable2fa } = useApp()
  const t = useT()
  const enabled = !!currentUser?.twoFactor
  const [stage, setStage] = useState('idle') // idle | setup | codes | disable
  const [secret, setSecret] = useState('')
  const [otpauth, setOtpauth] = useState('')
  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [codes, setCodes] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Render the QR from the otpauth URI (lazy-loaded so it never bloats the app).
  useEffect(() => {
    let alive = true
    if (!otpauth) return
    ;(async () => {
      try {
        const QR = await import('qrcode')
        const url = await QR.toDataURL(otpauth, { margin: 2, width: 200 })
        if (alive) setQr(url)
      } catch {
        /* fall back to the manual key */
      }
    })()
    return () => {
      alive = false
    }
  }, [otpauth])

  const startSetup = async () => {
    setErr('')
    setBusy(true)
    const r = await setup2fa()
    setBusy(false)
    if (r.ok) {
      setSecret(r.secret)
      setOtpauth(r.otpauth)
      setStage('setup')
    } else setErr(r.error || t('profile.tfa.startError'))
  }

  const confirmEnable = async () => {
    setErr('')
    setBusy(true)
    const r = await enable2fa(code.trim())
    setBusy(false)
    if (r.ok) {
      setCodes(r.backupCodes || [])
      setCode('')
      setStage('codes')
    } else setErr(r.error || t('profile.tfa.wrongCode'))
  }

  const confirmDisable = async () => {
    setErr('')
    setBusy(true)
    const r = await disable2fa(pw)
    setBusy(false)
    if (r.ok) {
      setPw('')
      setStage('idle')
    } else setErr(r.error || t('profile.tfa.wrongPassword'))
  }

  const copyCodes = () => {
    try {
      navigator.clipboard.writeText(codes.join('\n'))
    } catch {
      /* ignore */
    }
  }

  return (
    <Shell title={t('profile.twoFactorAuth')} onBack={onBack}>
      {stage === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]">
            <span className={`block h-1.5 w-1.5 ${enabled ? 'bg-ink' : 'bg-faint'}`} />
            <span className={enabled ? 'text-ink' : 'text-muted'}>{enabled ? t('profile.tfa.onLabel') : t('profile.tfa.offLabel')}</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {enabled ? t('profile.tfa.onExplain') : t('profile.tfa.offExplain')}
          </p>
          {err ? <ErrLine msg={err} /> : null}
          {enabled ? (
            <Btn onClick={() => setStage('disable')} variant="ghost" disabled={busy}>
              {t('profile.tfa.turnOff')}
            </Btn>
          ) : (
            <Btn onClick={startSetup} variant="solid" disabled={busy}>
              {busy ? t('profile.tfa.starting') : t('profile.tfa.setUp')}
            </Btn>
          )}
        </div>
      )}

      {stage === 'setup' && (
        <div className="space-y-5">
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {t('profile.tfa.step1')}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qr ? (
              <img src={qr} alt={t('profile.tfa.qrAlt')} width={160} height={160} className="bg-white p-2" />
            ) : (
              <div className="flex h-[160px] w-[160px] items-center justify-center border border-line font-mono text-[10px] text-muted">
                {t('profile.tfa.qrLoading')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Label>{t('profile.tfa.manualKey')}</Label>
              <div className="mt-2 select-all break-all border border-line bg-black px-3 py-2 font-mono text-[12px] tracking-[0.12em] text-ink">
                {secret}
              </div>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted">
                {t('profile.tfa.step2')}
              </p>
            </div>
          </div>
          <input
            className={codeInputCls}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {err ? <ErrLine msg={err} /> : null}
          <div className="flex gap-3">
            <Btn onClick={confirmEnable} variant="solid" disabled={busy || code.length !== 6}>
              {busy ? t('profile.tfa.verifying') : t('profile.tfa.verifyEnable')}
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="ghost">
              {t('common.cancel')}
            </Btn>
          </div>
        </div>
      )}

      {stage === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
            <span className="text-ink">✓</span> {t('profile.tfa.onHeading')}
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {t('profile.tfa.codesExplain')}
          </p>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {codes.map((c) => (
              <div key={c} className="bg-bg px-3 py-2.5 text-center font-mono text-[13px] tracking-[0.12em] text-ink">
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Btn onClick={copyCodes} variant="ghost">
              {t('profile.tfa.copyCodes')}
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="solid">
              {t('profile.tfa.done')}
            </Btn>
          </div>
        </div>
      )}

      {stage === 'disable' && (
        <div className="space-y-4">
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {t('profile.tfa.disableExplain')}
          </p>
          <Field label={t('profile.tfa.password')}>
            <input
              type="password"
              className={inputCls}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          {err ? <ErrLine msg={err} /> : null}
          <div className="flex gap-3">
            <Btn onClick={confirmDisable} variant="solid" disabled={busy || !pw}>
              {busy ? t('profile.tfa.turningOff') : t('profile.tfa.turnOff')}
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="ghost">
              {t('common.cancel')}
            </Btn>
          </div>
        </div>
      )}
    </Shell>
  )
}

// ---------------------------------------------------------------------------
// DELETE ACCOUNT — re-auth + typed confirmation, then home.
// ---------------------------------------------------------------------------
export function DeleteAccountPanel({ onBack }) {
  const { deleteAccount } = useApp()
  const { standalone } = usePWA()
  const navigate = useNavigate()
  const t = useT()
  const [pw, setPw] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const ready = confirmText.trim().toUpperCase() === 'DELETE' && pw.length > 0

  const del = async () => {
    setErr('')
    setBusy(true)
    const r = await deleteAccount(pw)
    setBusy(false)
    if (r.ok) navigate(standalone ? '/login' : '/')
    else setErr(r.error || t('profile.del.error'))
  }

  return (
    <Shell title={t('profile.deleteAccount')} onBack={onBack}>
      <div className="space-y-4">
        <div className="border border-line-bright bg-black px-4 py-3 font-mono text-[11px] leading-relaxed text-ink">
          {t('profile.del.warning')}
        </div>
        <Field label={t('profile.del.password')}>
          <input
            type="password"
            className={inputCls}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label={t('profile.del.typeToConfirm')}>
          <input
            className={inputCls}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t('profile.del.confirmWord')}
            autoCapitalize="characters"
          />
        </Field>
        {err ? <ErrLine msg={err} /> : null}
        <div className="flex gap-3">
          <button
            onClick={del}
            disabled={busy || !ready}
            className={`inline-flex h-10 items-center justify-center border px-5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              ready
                ? 'border-ink bg-ink text-bg hover:bg-bright'
                : 'border-line text-muted opacity-40 pointer-events-none'
            }`}
          >
            {busy ? t('profile.del.deleting') : t('profile.del.deleteForever')}
          </button>
          <Btn onClick={onBack} variant="ghost">
            {t('common.cancel')}
          </Btn>
        </div>
      </div>
    </Shell>
  )
}

// ----- shared chrome ---------------------------------------------------------
function Shell({ title, onBack, children }) {
  const t = useT()
  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{title}</span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ErrLine({ msg }) {
  return <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {msg}</div>
}
