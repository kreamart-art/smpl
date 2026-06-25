// /smpl/src/components/ShareSheet.jsx
//
// One share button to rule the three: instead of separate "share card", "send
// in a DM" and "share" icons cluttering a header, a single share button opens
// this sheet. People to DM it to sit on top (tap an avatar to send it straight
// into a conversation); a Copy link / Share card / Share-to row sits below. That
// frees up room in the chrome wherever shares used to take three slots.
//
// Reusable across contexts — pass the public `url`, the optional share-card
// route (`cardTo`), and the DM payload (`dm` = { kind, ref } or { battleId }).
import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Portal from './Portal.jsx'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { IconShare, IconPoster, IconLink } from './icons.jsx'
import { inputCls } from './ui.jsx'

export default function ShareSheet({ url, cardTo, dm, title = 'SMPL', text, extraAction, className = '', ...rest }) {
  const { currentUser, users, follows, sendMessage } = useApp()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sentTo, setSentTo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const dmTarget = dm ? (dm.kind ? dm : dm.battleId ? { kind: 'battle', ref: dm.battleId } : null) : null
  const canDM = !!(currentUser && dmTarget)

  const following = currentUser
    ? new Set(follows.filter((f) => f.followerId === currentUser.id).map((f) => f.followeeId))
    : new Set()
  const candidates = canDM
    ? users
        .filter((u) => u.id !== currentUser.id)
        .filter((u) => !q || u.alias.toLowerCase().includes(q.toLowerCase()))
        .sort(
          (a, b) =>
            (following.has(b.id) ? 1 : 0) - (following.has(a.id) ? 1 : 0) ||
            a.alias.localeCompare(b.alias),
        )
    : []

  const close = () => {
    setOpen(false)
    setQ('')
    setSentTo(null)
  }

  const sendDM = async (alias) => {
    setBusy(true)
    const payload =
      dmTarget.kind === 'battle'
        ? { battleId: dmTarget.ref }
        : { shareKind: dmTarget.kind, shareRef: dmTarget.ref }
    const r = await sendMessage(alias, '', payload)
    setBusy(false)
    if (r.ok) {
      setSentTo(alias)
      setTimeout(close, 1100)
    }
  }

  const flashCopied = useCallback(() => {
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      flashCopied()
    } catch {
      try {
        window.prompt('Copy this link', shareUrl)
      } catch {
        /* ignore */
      }
    }
  }, [shareUrl, flashCopied])

  const nativeShare = useCallback(async () => {
    const data = { title, text: text || title, url: shareUrl }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    copyLink()
  }, [title, text, shareUrl, copyLink])

  const Tile = ({ icon, label, onClick, to }) => {
    const cls =
      'flex flex-1 flex-col items-center justify-center gap-2 border border-line-bright px-2 py-3.5 text-center transition-colors hover:border-ink'
    const body = (
      <>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink">{label}</span>
      </>
    )
    return to ? (
      <Link to={to} onClick={close} className={cls}>
        {body}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('share.share')}
        title={t('share.share')}
        className={`flex items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink ${className}`}
        {...rest}
      >
        <IconShare size={18} />
      </button>

      {open ? (
        <Portal>
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={close}
          >
            <div
              className="flex max-h-[88dvh] w-full max-w-[460px] flex-col border border-line-bright bg-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('share.share')}</span>
                <button
                  onClick={close}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                >
                  {t('common.close')} ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* People to send it to — top, like a native share sheet */}
                {canDM ? (
                  <>
                    <input
                      className={inputCls}
                      placeholder={t('messages.searchPeople')}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {candidates.length ? (
                        candidates.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            disabled={busy}
                            onClick={() => sendDM(u.alias)}
                            className="flex flex-col items-center gap-1.5 border border-transparent p-2 text-center transition-colors hover:border-line disabled:opacity-50"
                          >
                            <span className="relative">
                              <Avatar alias={u.alias} src={u.avatar} size={56} />
                              {sentTo === u.alias ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-bg/80 font-mono text-[11px] font-bold text-accent">
                                  ✓
                                </span>
                              ) : null}
                            </span>
                            <span className="flex max-w-full items-center gap-1">
                              <span className="truncate font-mono text-[10px] text-ink">@{u.alias}</span>
                              {u.verified ? <VerifiedBadge size={9} /> : null}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="col-span-full px-2 py-6 text-center font-mono text-[11px] text-muted">
                          {t('messages.noPeople')}
                        </p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Copy link / Share card / Share to… — the row that used to be three icons */}
                <div className={`flex gap-2 ${canDM ? 'mt-4 border-t border-line pt-4' : ''}`}>
                  <Tile
                    icon={<IconLink size={20} />}
                    label={copied ? t('share.copied') : t('share.copyLink')}
                    onClick={copyLink}
                  />
                  {cardTo ? <Tile icon={<IconPoster size={20} />} label={t('share.title')} to={cardTo} /> : null}
                  {extraAction ? (
                    <Tile icon={extraAction.icon} label={extraAction.label} onClick={extraAction.onClick} />
                  ) : null}
                  <Tile icon={<IconShare size={20} />} label={t('share.more')} onClick={nativeShare} />
                </div>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  )
}
