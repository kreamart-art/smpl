import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { Btn, Field, inputCls, Label } from './ui.jsx'

const codeInputCls =
  'w-full bg-black border border-line text-ink font-mono text-lg tracking-[0.4em] text-center px-3 h-12 outline-none focus:border-ink placeholder:text-muted'

// ---------------------------------------------------------------------------
// TWO-FACTOR (TOTP) — enrol with an authenticator app, store backup codes.
// ---------------------------------------------------------------------------
export function TwoFactorPanel({ onBack }) {
  const { currentUser, setup2fa, enable2fa, disable2fa } = useApp()
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
    } else setErr(r.error || 'Could not start setup.')
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
    } else setErr(r.error || 'Wrong code.')
  }

  const confirmDisable = async () => {
    setErr('')
    setBusy(true)
    const r = await disable2fa(pw)
    setBusy(false)
    if (r.ok) {
      setPw('')
      setStage('idle')
    } else setErr(r.error || 'Wrong password.')
  }

  const copyCodes = () => {
    try {
      navigator.clipboard.writeText(codes.join('\n'))
    } catch {
      /* ignore */
    }
  }

  return (
    <Shell title="Two-factor auth" onBack={onBack}>
      {stage === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]">
            <span className={`block h-1.5 w-1.5 ${enabled ? 'bg-ink' : 'bg-faint'}`} />
            <span className={enabled ? 'text-ink' : 'text-muted'}>{enabled ? '2FA is ON' : '2FA is OFF'}</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {enabled
              ? 'Your account asks for a 6-digit code from your authenticator app at every login.'
              : 'Protect your account with an authenticator app (Google Authenticator, Authy, 1Password…). You’ll add a 6-digit code when you log in.'}
          </p>
          {err ? <ErrLine msg={err} /> : null}
          {enabled ? (
            <Btn onClick={() => setStage('disable')} variant="ghost" disabled={busy}>
              Turn off 2FA
            </Btn>
          ) : (
            <Btn onClick={startSetup} variant="solid" disabled={busy}>
              {busy ? 'Starting…' : 'Set up 2FA'}
            </Btn>
          )}
        </div>
      )}

      {stage === 'setup' && (
        <div className="space-y-5">
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            1 — Scan this in your authenticator app, or enter the key by hand.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qr ? (
              <img src={qr} alt="2FA QR code" width={160} height={160} className="bg-white p-2" />
            ) : (
              <div className="flex h-[160px] w-[160px] items-center justify-center border border-line font-mono text-[10px] text-muted">
                QR…
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Label>Manual key</Label>
              <div className="mt-2 select-all break-all border border-line bg-black px-3 py-2 font-mono text-[12px] tracking-[0.12em] text-ink">
                {secret}
              </div>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted">
                2 — Enter the 6-digit code it shows.
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
              {busy ? 'Verifying…' : 'Verify & enable'}
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="ghost">
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {stage === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
            <span className="text-ink">✓</span> 2FA is on
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            Save these backup codes somewhere safe. Each works once if you lose your authenticator.
            They’re shown only now.
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
              Copy codes
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="solid">
              Done
            </Btn>
          </div>
        </div>
      )}

      {stage === 'disable' && (
        <div className="space-y-4">
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            Confirm your password to turn 2FA off.
          </p>
          <Field label="Password">
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
              {busy ? 'Turning off…' : 'Turn off 2FA'}
            </Btn>
            <Btn onClick={() => setStage('idle')} variant="ghost">
              Cancel
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
    else setErr(r.error || 'Could not delete the account.')
  }

  return (
    <Shell title="Delete account" onBack={onBack}>
      <div className="space-y-4">
        <div className="border border-line-bright bg-black px-4 py-3 font-mono text-[11px] leading-relaxed text-ink">
          This is permanent. Your profile, photo and follows are removed. Past battle results stay,
          but anonymised — your name is wiped from them. This can’t be undone.
        </div>
        <Field label="Password">
          <input
            type="password"
            className={inputCls}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Type DELETE to confirm">
          <input
            className={inputCls}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
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
            {busy ? 'Deleting…' : 'Delete forever'}
          </button>
          <Btn onClick={onBack} variant="ghost">
            Cancel
          </Btn>
        </div>
      </div>
    </Shell>
  )
}

// ----- shared chrome ---------------------------------------------------------
function Shell({ title, onBack, children }) {
  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{title}</span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ Back
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ErrLine({ msg }) {
  return <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {msg}</div>
}
