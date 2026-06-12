import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
import { IconMessage } from './icons.jsx'
import { inputCls } from './ui.jsx'

// Share a battle into a DM — pick a recipient, the battle lands as a card in
// the conversation. Only shown to logged-in users.
export default function ShareToDM({ battleId, className = '' }) {
  const { currentUser, users, follows, sendMessage } = useApp()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sentTo, setSentTo] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!currentUser) return null

  const following = new Set(
    follows.filter((f) => f.followerId === currentUser.id).map((f) => f.followeeId),
  )
  const candidates = users
    .filter((u) => u.id !== currentUser.id)
    .filter((u) => !q || u.alias.toLowerCase().includes(q.toLowerCase()))
    .sort(
      (a, b) =>
        (following.has(b.id) ? 1 : 0) - (following.has(a.id) ? 1 : 0) ||
        a.alias.localeCompare(b.alias),
    )

  const close = () => {
    setOpen(false)
    setQ('')
    setSentTo(null)
  }

  const send = async (alias) => {
    setBusy(true)
    const r = await sendMessage(alias, '', battleId)
    setBusy(false)
    if (r.ok) {
      setSentTo(alias)
      setTimeout(close, 1100)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('messages.shareDM')}
        title={t('messages.shareDM')}
        className={`flex items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink ${className}`}
      >
        <IconMessage size={18} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-[460px] border border-line-bright bg-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('messages.shareTitle')}</span>
              <button onClick={close} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
                {t('common.close')} ✕
              </button>
            </div>
            <div className="p-4">
              <input
                className={inputCls}
                placeholder={t('messages.searchPeople')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              <div className="mt-3 max-h-[52vh] divide-y divide-line overflow-y-auto border border-line">
                {candidates.length ? (
                  candidates.map((u) => (
                    <button
                      key={u.id}
                      disabled={busy}
                      onClick={() => send(u.alias)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg disabled:opacity-50"
                    >
                      <Avatar alias={u.alias} src={u.avatar} size={36} />
                      <span className="truncate font-mono text-[12px] text-ink">@{u.alias}</span>
                      {sentTo === u.alias ? (
                        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                          ✓ {t('messages.sentTo', { alias: u.alias })}
                        </span>
                      ) : following.has(u.id) ? (
                        <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                          {t('common.followingState')}
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center font-mono text-[11px] text-muted">{t('messages.noPeople')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
