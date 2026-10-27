import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from '../components/Avatar.jsx'
import Handle from '../components/Handle.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import SuggestInput from '../components/SuggestInput.jsx'
import SuggestedPeople from '../components/SuggestedPeople.jsx'
import { GENRES } from '../data/genres.js'
import { suggestCities } from '../data/cities.js'

const TABS = [
  { key: 'all', labelKey: 'social.people.filterAll' },
  { key: 'producer', labelKey: 'social.people.filterProducers' },
  { key: 'artist', labelKey: 'social.people.filterArtists' },
]

function PersonCard({ user }) {
  const t = useT()
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
            {user.verified || user.role === 'admin' ? <VerifiedBadge size={15} /> : null}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {user.dualRole ? t('role.dual') : t('role.' + user.role)}
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
          {followers} {followers === 1 ? t('social.people.followerOne') : t('social.people.followerMany')}
        </span>
        {isSelf ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('social.people.you')}</span>
        ) : !currentUser ? (
          <Link
            to="/login"
            className="border border-line-bright px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-bg"
          >
            {t('common.follow')}
          </Link>
        ) : currentUser.alias === 'SMPL' ? null : user.alias === 'SMPL' ? (
          <span className="border border-ink bg-ink px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bg">
            {t('common.followingState')}
          </span>
        ) : (
          <button
            onClick={() => toggleFollow(user.id)}
            className={`border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
            }`}
          >
            {following ? t('common.followingState') : t('common.follow')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function People() {
  const t = useT()
  const navigate = useNavigate()
  const { users, followerCount, isBlocked, currentUser } = useApp()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const creators = useMemo(() => {
    const query = q.trim().toLowerCase()
    return users
      .filter((u) => !isBlocked(u.id))
      // every account is followable — listeners + curators included
      .filter((u) => tab === 'all' || u.role === tab || u.alias === 'SMPL')
      .filter(
        (u) =>
          !query ||
          u.alias.toLowerCase().includes(query) ||
          (u.location || '').toLowerCase().includes(query) ||
          (u.genres || []).some((g) => g.toLowerCase().includes(query)),
      )
      .sort((a, b) => {
        // @SMPL first, then verified, then by followers
        const aS = a.alias === 'SMPL' ? 1 : 0
        const bS = b.alias === 'SMPL' ? 1 : 0
        if (aS !== bS) return bS - aS
        const aV = a.verified ? 1 : 0
        const bV = b.verified ? 1 : 0
        if (aV !== bV) return bV - aV
        return followerCount(b.id) - followerCount(a.id)
      })
  }, [users, tab, q, followerCount, isBlocked])

  // typeahead: matching people (→ profile), places (→ filter), genres (→ filter)
  const suggestGroups = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    const visible = users.filter((u) => !isBlocked(u.id))

    const people = visible
      .filter((u) => u.alias.toLowerCase().includes(query))
      .sort((a, b) => followerCount(b.id) - followerCount(a.id))
      .slice(0, 5)
      .map((u) => ({
        key: `p_${u.id}`,
        label: `@${u.alias}`,
        sub: u.location || (u.dualRole ? t('role.dual') : t('role.' + u.role)),
        onPick: () => navigate(`/profile/${encodeURIComponent(u.alias)}`),
      }))

    // places: clean catalogue cities (prefix-ranked) first, then any city people
    // are actually in that isn't in the catalogue. Dedup by city name so
    // "Rotterdam, NL" (a saved location) and "Rotterdam" don't both show.
    const seenPlaces = new Set()
    const placeList = []
    for (const c of suggestCities(query, 12)) {
      const key = c.name.toLowerCase()
      if (seenPlaces.has(key)) continue
      seenPlaces.add(key)
      placeList.push({ name: c.name, country: c.country })
    }
    for (const u of visible) {
      const loc = (u.location || '').trim()
      const city = loc.split(',')[0].trim()
      const key = city.toLowerCase()
      if (!key || seenPlaces.has(key)) continue
      if (key.includes(query) || loc.toLowerCase().includes(query)) {
        seenPlaces.add(key)
        placeList.push({ name: city, country: null })
      }
    }
    const places = placeList.slice(0, 5).map((c) => ({
      key: `c_${c.name}`,
      label: c.name,
      sub: c.country || undefined,
      onPick: () => setQ(c.name),
    }))

    const genres = GENRES.filter((g) => g.toLowerCase().includes(query))
      .slice(0, 5)
      .map((g) => ({ key: `g_${g}`, label: g, onPick: () => setQ(g) }))

    return [
      { label: t('common.people'), items: people },
      { label: t('social.search.places'), items: places },
      { label: t('social.search.genres'), items: genres },
    ].filter((grp) => grp.items.length)
  }, [q, users, isBlocked, followerCount, navigate, t])

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono text-[13px] text-faint tnum">P0</span>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('social.people.eyebrow')}</div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
              {t('common.people')}
            </h1>
          </div>
        </div>
        <div className="flex items-stretch border border-line">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === tabItem.key ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {t(tabItem.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SuggestInput
          type="search"
          value={q}
          onChange={setQ}
          groups={suggestGroups}
          placeholder={t('social.people.searchPlaceholder')}
        />
        {currentUser && !q.trim() && (currentUser.location || currentUser.genres?.length) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">{t('discover.by')}</span>
            {currentUser.location ? (
              <button
                onClick={() => setQ(currentUser.location.split(',')[0].trim())}
                className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line-bright hover:text-ink"
              >
                {t('discover.nearCity', { city: currentUser.location.split(',')[0].trim() })}
              </button>
            ) : null}
            {(currentUser.genres || []).slice(0, 4).map((g) => (
              <button
                key={g}
                onClick={() => setQ(g)}
                className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line-bright hover:text-ink"
              >
                {g}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!q.trim() ? <SuggestedPeople className="mt-10" limit={6} /> : null}

      {creators.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((u) => (
            <PersonCard key={u.id} user={u} />
          ))}
        </div>
      ) : (
        <p className="mt-10 font-mono text-sm text-muted">{t('social.people.empty')}</p>
      )}
    </div>
  )
}
