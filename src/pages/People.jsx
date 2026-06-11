import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Handle from '../components/Handle.jsx'
import { roleLabel } from '../data/kind.js'

const TABS = [
  { key: 'all', label: 'ALL' },
  { key: 'producer', label: 'PRODUCERS' },
  { key: 'artist', label: 'ARTISTS' },
]

function PersonCard({ user }) {
  const { currentUser, followerCount, isFollowing, toggleFollow } = useApp()
  const followers = followerCount(user.id)
  const following = isFollowing(user.id)
  const isSelf = currentUser?.id === user.id

  return (
    <div className="group relative isolate flex flex-col border border-line bg-panel p-5 transition-colors duration-500 hover:border-line-bright">
      <span className="hover-bloom" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <Link to={`/profile/${encodeURIComponent(user.alias)}`}>
          <Avatar alias={user.alias} src={user.avatar} size={56} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Handle alias={user.alias} className="font-sans text-lg font-bold uppercase tracking-tight text-ink" />
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {roleLabel(user.role)}
            {user.location ? <span className="text-faint"> · {user.location}</span> : null}
          </div>
        </div>
      </div>

      {user.bio ? (
        <p className="relative mt-4 line-clamp-2 font-mono text-[11px] leading-relaxed text-muted">{user.bio}</p>
      ) : null}

      {user.genres?.length ? (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {user.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted"
            >
              {g}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {followers} {followers === 1 ? 'follower' : 'followers'}
        </span>
        {isSelf ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">You</span>
        ) : !currentUser ? (
          <Link
            to="/login"
            className="border border-line-bright px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-bg"
          >
            Follow
          </Link>
        ) : (
          <button
            onClick={() => toggleFollow(user.id)}
            className={`border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
            }`}
          >
            {following ? '✓ Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function People() {
  const { users, followerCount } = useApp()
  const [tab, setTab] = useState('all')

  const creators = useMemo(
    () =>
      users
        .filter((u) => u.role === 'producer' || u.role === 'artist')
        .filter((u) => tab === 'all' || u.role === tab)
        .sort((a, b) => followerCount(b.id) - followerCount(a.id)),
    [users, tab, followerCount],
  )

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono text-[13px] text-faint tnum">P0</span>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">Who to follow</div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
              People
            </h1>
          </div>
        </div>
        <div className="flex items-stretch border border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === t.key ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {creators.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((u) => (
            <PersonCard key={u.id} user={u} />
          ))}
        </div>
      ) : (
        <p className="mt-10 font-mono text-sm text-muted">No one here yet.</p>
      )}
    </div>
  )
}
