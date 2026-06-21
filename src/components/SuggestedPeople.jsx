import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from './Avatar.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'

const cityOf = (loc) => (loc || '').split(',')[0].trim()
const countryOf = (loc) => {
  const parts = (loc || '').split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : ''
}

const HIDE_KEY = 'smpl_sugg_hidden'
const readHidden = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
const writeHidden = (set) => {
  try {
    localStorage.setItem(HIDE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

// "Suggested for you" — people to follow, ranked by mutual follows > same city >
// shared genres > rising maker, each with a transparent reason chip. Computed
// client-side from the follows graph + profile fields (+ a server `wins` count).
// Renders nothing when there's nobody worth suggesting.
export default function SuggestedPeople({ limit = 6, className = '' }) {
  const t = useT()
  const { users, follows, currentUser, isBlocked, toggleFollow, isFollowing, followerCount } = useApp()
  const [hidden, setHidden] = useState(readHidden)

  const suggestions = useMemo(() => {
    if (!currentUser) return []
    const me = currentUser
    const myFollowing = new Set(follows.filter((f) => f.followerId === me.id).map((f) => f.followeeId))
    const myCity = cityOf(me.location).toLowerCase()
    const myCountry = countryOf(me.location).toLowerCase()
    const myGenres = new Set((me.genres || []).map((g) => g.toLowerCase()))

    const followersOf = new Map()
    for (const f of follows) {
      if (!followersOf.has(f.followeeId)) followersOf.set(f.followeeId, new Set())
      followersOf.get(f.followeeId).add(f.followerId)
    }

    return users
      .filter(
        (u) =>
          u.id !== me.id &&
          !myFollowing.has(u.id) &&
          !isBlocked(u.id) &&
          !hidden.has(u.id) &&
          u.alias !== 'SMPL' &&
          u.role !== 'admin',
      )
      .map((u) => {
        const fset = followersOf.get(u.id) || new Set()
        let mutuals = 0
        for (const uid of myFollowing) if (fset.has(uid)) mutuals++
        const city = cityOf(u.location)
        const sameCity = !!myCity && myCity === city.toLowerCase()
        const sameCountry = !!myCountry && myCountry === countryOf(u.location).toLowerCase()
        const shared = (u.genres || []).filter((g) => myGenres.has(g.toLowerCase()))
        const isMaker = u.role === 'producer' || u.role === 'artist' || u.dualRole
        const wins = u.wins || 0
        const score =
          mutuals * 100 +
          (sameCity ? 40 : 0) +
          (sameCountry ? 12 : 0) +
          shared.length * 10 +
          (isMaker ? 5 : 0) +
          Math.min(wins, 5) * 2

        let reason
        if (mutuals > 0)
          reason = { key: 'mutual', text: t(mutuals === 1 ? 'suggest.mutualOne' : 'suggest.mutualMany', { n: mutuals }), accent: true }
        else if (sameCity) reason = { key: 'near', text: t('suggest.nearYou'), accent: false }
        else if (shared.length) reason = { key: 'genre', text: shared.slice(0, 2).join(' · '), accent: false }
        else if (wins > 0) reason = { key: 'rising', text: t('suggest.rising'), accent: false }
        else if (sameCountry) reason = { key: 'country', text: countryOf(u.location), accent: false }
        else reason = { key: 'role', text: u.dualRole ? t('role.dual') : t('role.' + u.role), accent: false }

        // a neutral secondary chip: the city (unless the reason already is it)
        let second = null
        if (reason.key !== 'near' && reason.key !== 'country' && city) second = city
        else if (reason.key === 'near' && shared.length) second = shared[0]

        return { u, score, reason, second }
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || followerCount(b.u.id) - followerCount(a.u.id))
      .slice(0, limit)
  }, [users, follows, currentUser, isBlocked, hidden, followerCount, t, limit])

  // @SMPL follows nobody, so it gets no follow suggestions.
  if (!currentUser || currentUser.alias === 'SMPL' || suggestions.length === 0) return null

  const dismiss = (id) => {
    const next = new Set(hidden)
    next.add(id)
    setHidden(next)
    writeHidden(next)
  }

  return (
    <section className={className}>
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="font-sans text-lg font-bold uppercase tracking-tight">{t('suggest.title')}</h2>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('suggest.sub')}</div>
        </div>
        <Link to="/people" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
          {t('suggest.seeAll')}
        </Link>
      </div>

      <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
        {suggestions.map(({ u, reason }) => (
          <div
            key={u.id}
            className="relative flex w-[150px] shrink-0 flex-col items-center gap-2 border border-line bg-panel p-3 text-center"
          >
            <button
              onClick={() => dismiss(u.id)}
              aria-label={t('suggest.dismiss')}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center font-mono text-[11px] text-faint transition-colors hover:text-ink"
            >
              ✕
            </button>
            <Link to={`/profile/${encodeURIComponent(u.alias)}`} className="mt-1.5">
              <Avatar alias={u.alias} src={u.avatar} size={54} />
            </Link>
            <div className="w-full min-w-0">
              <div className="flex items-center justify-center gap-1">
                <Link
                  to={`/profile/${encodeURIComponent(u.alias)}`}
                  className="truncate font-sans text-sm font-bold uppercase tracking-tight text-ink hover:underline"
                >
                  @{u.alias}
                </Link>
                {u.verified ? <VerifiedBadge size={11} /> : null}
              </div>
              <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                {u.dualRole ? t('role.dual') : t('role.' + u.role)}
              </div>
            </div>
            <span
              className={`max-w-full truncate border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
                reason.accent ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted'
              }`}
            >
              {reason.text}
            </span>
            <button
              onClick={() => toggleFollow(u.id)}
              className={`mt-auto h-8 w-full border font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                isFollowing(u.id)
                  ? 'border-ink bg-ink text-bg'
                  : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
              }`}
            >
              {isFollowing(u.id) ? t('common.followingState') : t('common.follow')}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
