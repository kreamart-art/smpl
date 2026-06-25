// /smpl/src/components/BattleRoom.jsx
//
// "In the room" — shows WHO is attending a battle, not just the count, so anyone
// can spot the people they follow (and who follow them) in the crowd. A compact
// avatar row opens a full list with your connections pulled to the top. The data
// is the existing public battle.attendees, so everyone (logged in or not) sees
// the room; only the connection-highlighting needs a signed-in viewer.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Portal from './Portal.jsx'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT, useI18n } from '../i18n/index.jsx'

export default function BattleRoom({ attendees = [] }) {
  const { getUser, currentUser, follows, isFollowing, toggleFollow } = useApp()
  const t = useT()
  const { lang } = useI18n()
  const nl = lang === 'nl'
  const [open, setOpen] = useState(false)

  const { connections, others, me, total } = useMemo(() => {
    const myId = currentUser?.id
    const following = new Set(follows.filter((f) => f.followerId === myId).map((f) => f.followeeId))
    const followers = new Set(follows.filter((f) => f.followeeId === myId).map((f) => f.followerId))
    const conn = []
    const oth = []
    let meUser = null
    for (const id of attendees) {
      const u = getUser(id)
      if (!u) continue
      if (myId && id === myId) {
        meUser = u
        continue
      }
      const youFollow = following.has(id)
      const followsYou = followers.has(id)
      if (youFollow || followsYou) conn.push({ u, youFollow, followsYou })
      else oth.push({ u })
    }
    return { connections: conn, others: oth, me: meUser, total: conn.length + oth.length + (meUser ? 1 : 0) }
  }, [attendees, getUser, currentUser, follows])

  if (total === 0) return null

  const stack = [...connections.map((c) => c.u), ...(me ? [me] : []), ...others.map((o) => o.u)].slice(0, 7)

  const noteFor = (c) =>
    c.youFollow && c.followsYou ? t('room.mutual') : c.youFollow ? t('room.youFollow') : t('room.followsYou')

  const Row = ({ u, note, self }) => (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
      <Link to={`/profile/${encodeURIComponent(u.alias)}`} onClick={() => setOpen(false)}>
        <Avatar alias={u.alias} src={u.avatar} size={36} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/profile/${encodeURIComponent(u.alias)}`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 font-mono text-[13px] text-ink hover:underline"
        >
          <span className="truncate">@{u.alias}</span>
          {u.verified ? <VerifiedBadge size={12} /> : null}
        </Link>
        {note ? (
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{note}</div>
        ) : null}
      </div>
      {!self && currentUser && u.id !== currentUser.id && currentUser.alias !== 'SMPL' ? (
        <button
          type="button"
          onClick={() => toggleFollow(u.id)}
          className={`shrink-0 border px-3 h-8 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            isFollowing(u.id) ? 'border-line-bright text-muted hover:text-ink' : 'border-ink text-ink hover:bg-ink hover:text-bg'
          }`}
        >
          {isFollowing(u.id) ? t('common.following') : t('common.follow')}
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 flex w-full items-center gap-3 border border-line bg-panel px-4 py-3 text-left transition-colors hover:border-line-bright"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('room.title')}</span>
        <span className="flex items-center gap-1.5 font-mono text-sm tnum text-ink">
          <span className="block h-1.5 w-1.5 bg-accent pulse-dot" aria-hidden="true" />
          {total}
        </span>
        <div className="ml-1 flex items-center gap-1">
          {stack.map((u) => (
            <Avatar key={u.id} alias={u.alias} src={u.avatar} size={24} />
          ))}
          {total > stack.length ? (
            <span className="flex h-6 items-center px-1.5 font-mono text-[10px] text-muted">+{total - stack.length}</span>
          ) : null}
        </div>
        <span
          className={`ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${
            connections.length ? 'text-accent' : 'text-muted'
          }`}
        >
          {connections.length ? t('room.youKnow', { n: connections.length }) : t('room.seeAll')}
        </span>
      </button>

      {open ? (
        <Portal>
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex max-h-[88dvh] w-full max-w-[460px] flex-col border border-line-bright bg-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">
                  {t('room.title')} · {total}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                >
                  {nl ? 'Sluiten' : 'Close'} ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {connections.length ? (
                  <>
                    <div className="px-1 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                      {t('room.yourPeople')}
                    </div>
                    {connections.map((c) => (
                      <Row key={c.u.id} u={c.u} note={noteFor(c)} />
                    ))}
                    <div className="px-1 pb-1 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      {t('room.everyone')}
                    </div>
                  </>
                ) : null}
                {me ? <Row u={me} note={t('room.you')} self /> : null}
                {others.map((o) => (
                  <Row key={o.u.id} u={o.u} />
                ))}
              </div>
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  )
}
