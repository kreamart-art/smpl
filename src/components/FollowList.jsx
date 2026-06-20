import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
import Portal from './Portal.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { roleLabel } from '../data/kind.js'

// Modal listing a user's followers / following, with follow-back buttons.
// Computed client-side from the full `follows` edge set in app state.
export default function FollowList({ userId, initialTab = 'followers', onClose }) {
  const t = useT()
  const { follows, getUser, currentUser, isFollowing, toggleFollow } = useApp()
  const [tab, setTab] = useState(initialTab)

  const followers = follows
    .filter((f) => f.followeeId === userId)
    .map((f) => getUser(f.followerId))
    .filter(Boolean)
  const following = follows
    .filter((f) => f.followerId === userId)
    .map((f) => getUser(f.followeeId))
    .filter(Boolean)
  const list = tab === 'followers' ? followers : following

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[460px] border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex gap-5">
              {['followers', 'following'].map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    tab === k ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t(`common.${k}`)}{' '}
                  <span className="tnum text-faint">{(k === 'followers' ? followers : following).length}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
              {t('common.close')} ✕
            </button>
          </div>

          <div className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-5 py-12 text-center font-mono text-[11px] text-muted">{t(`follow.empty.${tab}`)}</p>
            ) : (
              list.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Link
                    to={`/profile/${encodeURIComponent(u.alias)}`}
                    onClick={onClose}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar alias={u.alias} src={u.avatar} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-mono text-[12px] text-ink">@{u.alias}</span>
                        {u.verified || u.role === 'admin' ? <VerifiedBadge size={13} /> : null}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{roleLabel(u.role)}</div>
                    </div>
                  </Link>
                  {!currentUser || u.id === currentUser.id || currentUser.alias === 'SMPL' ? null : u.alias === 'SMPL' ? (
                    <span className="shrink-0 border border-ink bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bg">
                      {t('common.followingState')}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleFollow(u.id)}
                      className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        isFollowing(u.id) ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                      }`}
                    >
                      {isFollowing(u.id) ? t('common.followingState') : t('common.follow')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
