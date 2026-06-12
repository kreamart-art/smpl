import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useI18n, useT } from '../i18n/index.jsx'

// A slim "confirm your email" nudge. Only appears once SMTP is configured (no
// point nagging when no email can be sent) and the signed-in user is unverified.
// Dismiss lasts the session.
export default function VerifyEmailBanner() {
  const { currentUser, mailConfigured, resendVerification } = useApp()
  const { lang } = useI18n()
  const t = useT()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('smpl_verify_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!mailConfigured || !currentUser || currentUser.emailVerified || dismissed) return null

  const resend = async () => {
    setBusy(true)
    await resendVerification(lang)
    setBusy(false)
    setSent(true)
  }
  const dismiss = () => {
    try {
      sessionStorage.setItem('smpl_verify_dismissed', '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className="border-b border-line-bright bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="font-mono text-[11px] text-ink">✉ {t('auth.verifyBanner.text')}</span>
        <div className="ml-auto flex items-center gap-4">
          {sent ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {t('auth.verifyBanner.sent')}
            </span>
          ) : (
            <button
              onClick={resend}
              disabled={busy}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline underline-offset-4 hover:text-bright disabled:opacity-50"
            >
              {t('auth.verifyBanner.resend')}
            </button>
          )}
          <button onClick={dismiss} aria-label="dismiss" className="font-mono text-[12px] text-muted hover:text-ink">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
