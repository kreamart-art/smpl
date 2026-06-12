import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
import Portal from './Portal.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { IconMessage } from './icons.jsx'
import { inputCls } from './ui.jsx'

function ago(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function CommentRow({ c, producerId, canRemove, onRemove, compact }) {
  const t = useT()
  return (
    <div className="flex gap-2.5">
      <Link to={`/profile/${encodeURIComponent(c.user.alias)}`} className="shrink-0">
        <Avatar alias={c.user.alias} src={c.user.avatar} size={compact ? 24 : 28} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link to={`/profile/${encodeURIComponent(c.user.alias)}`} className="font-mono text-[11px] text-ink">
            @{c.user.alias}
          </Link>
          {c.user.verified || c.user.role === 'admin' ? <VerifiedBadge size={12} /> : null}
          {c.user.id === producerId ? (
            <span className="border border-line px-1 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
              {t('comments.maker')}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[9px] text-faint">{ago(c.createdAt)}</span>
        </div>
        <p className={`mt-0.5 break-words font-sans text-[13px] leading-snug text-ink-dim ${compact ? 'line-clamp-2' : ''}`}>
          {c.body}
        </p>
      </div>
      {!compact && canRemove?.(c) ? (
        <button
          onClick={() => onRemove(c.id)}
          aria-label="delete comment"
          className="shrink-0 self-start font-mono text-[11px] text-faint hover:text-ink"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}

// Comments under a battle beat. Shows the latest one inline; a "view all (N)"
// button opens a modal with the full thread + composer.
export default function CommentThread({ submissionId, producerId }) {
  const { currentUser, isCurator, fetchComments, postComment, deleteComment } = useApp()
  const t = useT()
  const [comments, setComments] = useState(null) // null = loading
  const [open, setOpen] = useState(true) // whether the beat accepts new comments
  const [modal, setModal] = useState(false)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const r = await fetchComments(submissionId)
    if (r.ok) {
      setComments(r.comments || [])
      setOpen(r.open !== false)
    } else setComments([])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId])

  const send = async (e) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setBusy(true)
    const r = await postComment(submissionId, text)
    setBusy(false)
    if (r.ok) {
      setComments((c) => [...(c || []), r.comment])
      setBody('')
    }
  }
  const remove = async (id) => {
    const r = await deleteComment(id)
    if (r.ok) setComments((c) => c.filter((x) => x.id !== id))
  }
  const canRemove = (c) =>
    !!currentUser && (c.user?.id === currentUser.id || currentUser.id === producerId || isCurator)

  const list = comments || []
  const count = list.length
  const latest = count ? list[count - 1] : null

  // nothing to show + can't post (e.g. blind voting) → stay out of the way
  if (comments !== null && count === 0 && !open) return null

  return (
    <div className="border border-t-0 border-line bg-panel px-3 py-2.5">
      {comments === null ? (
        <p className="font-mono text-[11px] text-faint">{t('common.loading')}</p>
      ) : latest ? (
        <>
          <CommentRow c={latest} producerId={producerId} compact />
          <button
            onClick={() => setModal(true)}
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            {count > 1 ? t('comments.viewAll', { n: count }) : open && currentUser ? t('comments.add') : t('comments.viewOne')} →
          </button>
        </>
      ) : (
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
        >
          <IconMessage size={13} />
          {open && currentUser ? t('comments.addFirst') : t('comments.title')}
        </button>
      )}

      {modal ? (
        <Portal>
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setModal(false)}
          >
            <div
              className="flex max-h-[80vh] w-full max-w-[460px] flex-col border border-line-bright bg-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
                  <IconMessage size={14} /> {t('comments.title')}
                  {count ? <span className="text-faint">({count})</span> : null}
                </span>
                <button onClick={() => setModal(false)} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
                  {t('common.close')} ✕
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {count ? (
                  list.map((c) => (
                    <CommentRow key={c.id} c={c} producerId={producerId} canRemove={canRemove} onRemove={remove} />
                  ))
                ) : (
                  <p className="py-6 text-center font-mono text-[11px] text-muted">{t('comments.empty')}</p>
                )}
              </div>

              {currentUser && open ? (
                <form onSubmit={send} className="flex gap-2 border-t border-line px-5 py-3">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder={t('comments.placeholder')}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={1000}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={busy || !body.trim()}
                    className="shrink-0 border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                  >
                    {t('comments.post')}
                  </button>
                </form>
              ) : !currentUser ? (
                <p className="border-t border-line px-5 py-3 font-mono text-[10px] text-faint">{t('comments.loginToComment')}</p>
              ) : (
                <p className="border-t border-line px-5 py-3 font-mono text-[10px] text-faint">{t('comments.notOpen')}</p>
              )}
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  )
}
