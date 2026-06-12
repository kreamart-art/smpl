import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
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

// A comment thread under a battle beat. Loads on expand; the producer + staff
// can delete; everyone logged-in can post (once comments are open on the beat).
export default function CommentThread({ submissionId, producerId }) {
  const { currentUser, isCurator, fetchComments, postComment, deleteComment } = useApp()
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState(null) // null = not loaded
  const [open, setOpen] = useState(true) // whether the beat accepts comments
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const r = await fetchComments(submissionId)
    if (r.ok) {
      setComments(r.comments || [])
      setOpen(r.open !== false)
    }
  }
  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next && comments === null) load()
  }
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

  return (
    <div className="border border-t-0 border-line bg-panel px-3 py-2.5">
      <button
        onClick={toggle}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
      >
        <IconMessage size={13} />
        {t('comments.title')}
        {comments?.length ? <span className="text-faint">({comments.length})</span> : null}
        <span className="text-faint">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {comments === null ? (
            <p className="font-mono text-[11px] text-faint">{t('common.loading')}</p>
          ) : !open ? (
            <p className="font-mono text-[11px] text-muted">{t('comments.notOpen')}</p>
          ) : comments.length === 0 ? (
            <p className="font-mono text-[11px] text-muted">{t('comments.empty')}</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Link to={`/profile/${encodeURIComponent(c.user.alias)}`} className="shrink-0">
                  <Avatar alias={c.user.alias} src={c.user.avatar} size={28} />
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
                  <p className="mt-0.5 break-words font-sans text-[13px] leading-snug text-ink-dim">{c.body}</p>
                </div>
                {canRemove(c) ? (
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="delete comment"
                    className="shrink-0 self-start font-mono text-[11px] text-faint hover:text-ink"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))
          )}

          {currentUser && open ? (
            <form onSubmit={send} className="flex gap-2 pt-1">
              <input
                className={`${inputCls} flex-1`}
                placeholder={t('comments.placeholder')}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
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
            <p className="font-mono text-[10px] text-faint">{t('comments.loginToComment')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
