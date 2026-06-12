import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Btn, textareaCls } from './ui.jsx'

const REASONS = ['spam', 'harassment', 'hate', 'sexual', 'ip', 'other']

// Report modal — reusable for any target (user / battle / submission / message).
export function ReportDialog({ open, onClose, targetType, targetId, label = '' }) {
  const t = useT()
  const { reportTarget } = useApp()
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  if (!open) return null

  const reset = () => {
    setReason('')
    setDetail('')
    setDone(false)
    setErr('')
    setBusy(false)
  }
  const close = () => {
    onClose()
    reset()
  }
  const submit = async () => {
    if (!reason) {
      setErr(t('safety.pickReason'))
      return
    }
    setErr('')
    setBusy(true)
    const note = detail.trim() ? `${reason}: ${detail.trim()}` : reason
    const r = await reportTarget(targetType, targetId, note, label)
    setBusy(false)
    if (r.ok) {
      setDone(true)
      setTimeout(close, 1500)
    } else {
      setErr(r.error || 'Failed.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-[460px] border border-line-bright bg-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="truncate font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
            {t('safety.reportTitle')}
            {label ? <span className="text-muted"> · {label}</span> : null}
          </span>
          <button
            onClick={close}
            className="ml-3 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
          >
            {t('common.close')} ✕
          </button>
        </div>

        {done ? (
          <p className="px-5 py-10 font-mono text-[12px] leading-relaxed text-ink">{t('safety.reported')}</p>
        ) : (
          <div className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {t('safety.reportReason')}
            </div>
            <div className="mt-3 flex flex-col gap-px border border-line">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`flex items-center gap-3 px-4 py-3 text-left font-mono text-[12px] transition-colors ${
                    reason === r ? 'bg-ink text-bg' : 'text-ink hover:bg-bg'
                  }`}
                >
                  <span
                    className={`block h-2.5 w-2.5 border ${
                      reason === r ? 'border-bg bg-bg' : 'border-line-bright'
                    }`}
                  />
                  {t(`safety.reason.${r}`)}
                </button>
              ))}
            </div>
            <textarea
              className={`${textareaCls} mt-3`}
              rows={3}
              placeholder={t('safety.reportPlaceholder')}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={500}
            />
            {err ? <p className="mt-2 font-mono text-[11px] text-ink">{err}</p> : null}
            <div className="mt-4 flex gap-3">
              <Btn onClick={submit} variant="solid" disabled={busy} full>
                {busy ? t('safety.sending') : t('safety.reportSend')}
              </Btn>
              <Btn onClick={close} variant="ghost">
                {t('safety.cancel')}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// A bare "Report" button (for battles / beats) that opens the dialog.
export function ReportButton({ targetType, targetId, label = '', size = 'sm', variant = 'dim', className = '' }) {
  const t = useT()
  const { currentUser } = useApp()
  const [open, setOpen] = useState(false)
  if (!currentUser) return null
  return (
    <>
      <Btn onClick={() => setOpen(true)} variant={variant} size={size} className={className}>
        {t('safety.report')}
      </Btn>
      <ReportDialog
        open={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
        label={label}
      />
    </>
  )
}

// The "⋯" overflow menu for another user — Report + Block/Unblock (with an
// inline confirm step, matching the app's no-native-dialog pattern).
export function UserSafetyMenu({ user, className = '', small = false }) {
  const t = useT()
  const { currentUser, isBlocked, toggleBlock } = useApp()
  const [open, setOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!currentUser || !user || user.id === currentUser.id) return null
  const blocked = isBlocked(user.id)

  const close = () => {
    setOpen(false)
    setConfirmBlock(false)
  }
  const doBlock = async () => {
    setBusy(true)
    await toggleBlock(user.id)
    setBusy(false)
    close()
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('safety.report')}
        className={`flex items-center justify-center border border-line-bright leading-none text-ink transition-colors duration-300 hover:border-ink ${
          small ? 'h-9 w-9 pb-1.5 text-xl' : 'h-12 w-12 pb-2 text-2xl'
        }`}
      >
        ⋯
      </button>

      {open ? (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute right-0 z-50 mt-2 w-60 border border-line-bright bg-panel">
            {confirmBlock ? (
              <div className="p-4">
                <p className="font-mono text-[11px] leading-relaxed text-muted">
                  {t(blocked ? 'safety.unblockConfirm' : 'safety.blockConfirm', { alias: user.alias })}
                </p>
                <div className="mt-3 flex gap-2">
                  <Btn onClick={doBlock} variant="solid" size="sm" disabled={busy} full>
                    {blocked ? t('safety.unblock') : t('safety.block')}
                  </Btn>
                  <Btn onClick={() => setConfirmBlock(false)} variant="ghost" size="sm">
                    {t('safety.cancel')}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setOpen(false)
                    setReporting(true)
                  }}
                  className="px-4 py-3 text-left font-mono text-[12px] text-ink transition-colors hover:bg-bg"
                >
                  {t('safety.report')}
                </button>
                <button
                  onClick={() => setConfirmBlock(true)}
                  className="border-t border-line px-4 py-3 text-left font-mono text-[12px] text-ink transition-colors hover:bg-bg"
                >
                  {blocked ? t('safety.unblock') : t('safety.block')}
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="user"
        targetId={user.id}
        label={`@${user.alias}`}
      />
    </div>
  )
}
