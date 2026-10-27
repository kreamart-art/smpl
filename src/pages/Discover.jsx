import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from '../components/Avatar.jsx'
import Handle from '../components/Handle.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import SuggestInput from '../components/SuggestInput.jsx'
import SuggestedPeople from '../components/SuggestedPeople.jsx'
import WaveformClips from '../components/WaveformClips.jsx'
import Vinyl from '../components/Vinyl.jsx'
import { Cover, SectionHead, Kicker, DisplayTitle, EmptyState } from '../components/crate.jsx'
import { IconChevronRight } from '../components/icons.jsx'
import { GENRES } from '../data/genres.js'
import { mediaUrl } from '../api.js'
import { suggestCities } from '../data/cities.js'

const TYPES = ['all', 'artists', 'battles', 'clips']
const ROLE_TABS = [
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
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {user.dualRole ? t('role.dual') : t('role.' + user.role)}
            {user.location ? <span className="text-faint"> · {user.location}</span> : null}
          </div>
        </div>
      </div>

      {user.bio ? (
        <p className="relative mt-4 line-clamp-2 font-sans text-[14px] leading-relaxed text-muted">{user.bio}</p>
      ) : null}

      {user.genres?.length ? (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {user.genres.slice(0, 3).map((g) => (
            <span key={g} className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {g}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
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

// Verified makers as large square portraits (the "featured artists" row). The
// badge is admin-granted, so this is a curated list, not a popularity chart.
function VerifiedStrip({ users }) {
  const t = useT()
  const { followerCount } = useApp()
  if (!users.length) return null
  return (
    <section className="mt-10">
      <SectionHead title={t('discover.verified')} />
      <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {users.map((u) => (
          <Link
            key={u.id}
            to={`/profile/${encodeURIComponent(u.alias)}`}
            className="group w-[38vw] max-w-[180px] shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <div className="aspect-square overflow-hidden border border-line bg-panel-2">
              {u.avatar ? (
                <img
                  src={mediaUrl(u.avatar)}
                  alt=""
                  loading="lazy"
                  className="photocopy h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center t-display text-[3rem] text-muted">
                  {u.alias.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="truncate font-sans text-[15px] font-semibold uppercase tracking-tight text-ink">{u.alias}</span>
              <VerifiedBadge size={13} />
            </div>
            <div className="truncate font-mono text-[11px] text-muted">
              {u.dualRole ? t('role.dual') : t('role.' + u.role)}
              {' · '}
              {followerCount(u.id)} {followerCount(u.id) === 1 ? t('social.people.followerOne') : t('social.people.followerMany')}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function BattleResult({ battle }) {
  const t = useT()
  const kindLabel = t(`kind.long.${battle.kind === 'VERSES' ? 'VERSES' : 'BEATS'}`)
  return (
    <Link
      to={`/battles/${battle.id}`}
      className="group flex items-center gap-4 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-panel"
    >
      <Cover src={battle.cover} title={battle.title} id={battle.id} kind={battle.kind} label={kindLabel} titleSize="xs" className="w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[16px] font-medium text-ink">{battle.title}</div>
        <div className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {kindLabel}
          {battle.genre ? ` · ${battle.genre}` : ''}
          {' · '}
          {t(`status.${battle.status}`)}
        </div>
      </div>
      <IconChevronRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
    </Link>
  )
}

export default function Discover() {
  const t = useT()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { users, battles, followerCount, isBlocked, currentUser, getUser, fetchLatestClips } = useApp()
  const type = TYPES.includes(params.get('type')) ? params.get('type') : 'all'
  const setType = (k) => setParams(k === 'all' ? {} : { type: k }, { replace: true })
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [clips, setClips] = useState(null)
  const query = q.trim().toLowerCase()

  useEffect(() => {
    if (type !== 'clips' && type !== 'all') return
    let alive = true
    fetchLatestClips(48).then((r) => alive && setClips(r.ok ? r.videos || [] : []))
    return () => {
      alive = false
    }
  }, [type, fetchLatestClips])

  const visibleUsers = useMemo(() => users.filter((u) => !isBlocked(u.id)), [users, isBlocked])

  const creators = useMemo(() => {
    // one follower count per user per render, not one per comparison
    const counts = new Map(visibleUsers.map((u) => [u.id, followerCount(u.id)]))
    return visibleUsers
      .filter((u) => role === 'all' || u.role === role || (role === 'artist' && u.dualRole) || u.alias === 'SMPL')
      .filter(
        (u) =>
          !query ||
          u.alias.toLowerCase().includes(query) ||
          (u.location || '').toLowerCase().includes(query) ||
          (u.bio || '').toLowerCase().includes(query) ||
          (u.genres || []).some((g) => g.toLowerCase().includes(query)),
      )
      .sort((a, b) => {
        const aS = a.alias === 'SMPL' ? 1 : 0
        const bS = b.alias === 'SMPL' ? 1 : 0
        if (aS !== bS) return bS - aS
        const aV = a.verified ? 1 : 0
        const bV = b.verified ? 1 : 0
        if (aV !== bV) return bV - aV
        return counts.get(b.id) - counts.get(a.id)
      })
  }, [visibleUsers, role, query, followerCount])

  const battleHits = useMemo(() => {
    const curatorAlias = (b) => getUser(b.curatorId)?.alias?.toLowerCase() || ''
    return battles
      .filter(
        (b) =>
          !query ||
          b.title.toLowerCase().includes(query) ||
          (b.genre || '').toLowerCase().includes(query) ||
          curatorAlias(b).includes(query) ||
          // the source is only searchable once it has been revealed
          (b.sampleRevealed && `${b.sampleArtist} ${b.sampleSong}`.toLowerCase().includes(query)),
      )
      .sort((a, b) => (b.signupStart || 0) - (a.signupStart || 0))
  }, [battles, query, getUser])

  const clipHits = useMemo(
    () =>
      (clips || []).filter(
        (c) => !query || (c.producer?.alias || '').toLowerCase().includes(query) || (c.tag || '').toLowerCase().includes(query),
      ),
    [clips, query],
  )

  // genres somebody on SMPL actually works in or battles on, with real counts
  const genreTiles = useMemo(() => {
    // "Boom Bap" and "boom bap " are one genre; show the first spelling met
    const n = new Map()
    const add = (g) => {
      const key = String(g).trim().toLowerCase()
      if (!key) return
      const cur = n.get(key)
      n.set(key, { label: cur?.label || String(g).trim(), count: (cur?.count || 0) + 1 })
    }
    for (const u of visibleUsers) for (const g of u.genres || []) add(g)
    for (const b of battles) if (b.genre) add(b.genre)
    return [...n.values()].sort((a, b) => b.count - a.count).slice(0, 8).map((x) => [x.label, x.count])
  }, [visibleUsers, battles])

  const verified = useMemo(
    () => visibleUsers.filter((u) => u.verified && u.alias !== 'SMPL').slice(0, 12),
    [visibleUsers],
  )

  // typeahead: people, battles, places, genres
  const suggestGroups = useMemo(() => {
    if (!query) return []
    const people = visibleUsers
      .filter((u) => u.alias.toLowerCase().includes(query))
      .sort((a, b) => followerCount(b.id) - followerCount(a.id))
      .slice(0, 5)
      .map((u) => ({
        key: `p_${u.id}`,
        label: `@${u.alias}`,
        sub: u.location || (u.dualRole ? t('role.dual') : t('role.' + u.role)),
        onPick: () => navigate(`/profile/${encodeURIComponent(u.alias)}`),
      }))
    const battleItems = battles
      .filter((b) => b.title.toLowerCase().includes(query))
      .slice(0, 4)
      .map((b) => ({ key: `b_${b.id}`, label: b.title, sub: t(`status.${b.status}`), onPick: () => navigate(`/battles/${b.id}`) }))

    const seenPlaces = new Set()
    const placeList = []
    for (const c of suggestCities(query, 12)) {
      const key = c.name.toLowerCase()
      if (seenPlaces.has(key)) continue
      seenPlaces.add(key)
      placeList.push({ name: c.name, country: c.country })
    }
    for (const u of visibleUsers) {
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
      { label: t('discover.battlesHead'), items: battleItems },
      { label: t('social.search.places'), items: places },
      { label: t('social.search.genres'), items: genres },
    ].filter((grp) => grp.items.length)
  }, [query, visibleUsers, battles, followerCount, navigate, t])

  const browsing = !query && type === 'all'
  const showArtists = type === 'all' || type === 'artists'
  const showBattles = (type === 'all' && query) || type === 'battles'
  const showClips = type === 'clips'
  const nothing =
    query &&
    (!showArtists || !creators.length) &&
    (!showBattles || !battleHits.length) &&
    (!showClips || !clipHits.length)

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Kicker>{t('discover.kicker')}</Kicker>
      <DisplayTitle size="lg" className="mt-2 text-ink">
        {t('discover.title')}
      </DisplayTitle>

      <div className="mt-6">
        <SuggestInput type="search" value={q} onChange={setQ} groups={suggestGroups} placeholder={t('discover.search')} />
      </div>

      <div role="tablist" aria-label={t('discover.title')} className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={type === k}
            onClick={() => setType(k)}
            className={`h-9 border px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              type === k ? 'border-paper bg-paper text-paper-ink' : 'border-line-bright text-muted hover:text-ink'
            }`}
          >
            {t(`discover.type.${k}`)}
          </button>
        ))}
        {q ? (
          <button
            type="button"
            onClick={() => setQ('')}
            className="h-9 px-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {t('discover.clear')}
          </button>
        ) : null}
      </div>

      {browsing && currentUser && (currentUser.location || currentUser.genres?.length) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{t('discover.by')}</span>
          {currentUser.location ? (
            <button
              onClick={() => setQ(currentUser.location.split(',')[0].trim())}
              className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-line-bright hover:text-ink"
            >
              {t('discover.nearCity', { city: currentUser.location.split(',')[0].trim() })}
            </button>
          ) : null}
          {(currentUser.genres || []).slice(0, 4).map((g) => (
            <button
              key={g}
              onClick={() => setQ(g)}
              className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-line-bright hover:text-ink"
            >
              {g}
            </button>
          ))}
        </div>
      ) : null}

      {browsing ? <VerifiedStrip users={verified} /> : null}
      {browsing && currentUser ? <SuggestedPeople className="mt-10" limit={6} /> : null}

      {browsing && genreTiles.length ? (
        <section className="mt-10">
          <SectionHead title={t('discover.genres')} />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {genreTiles.map(([g, n], i) => (
              <button
                key={g}
                type="button"
                onClick={() => setQ(g)}
                className={`group relative flex aspect-[5/3] flex-col justify-between overflow-hidden border p-3 text-left transition-colors ${
                  i % 3 === 0 ? 'paper border-transparent' : 'sleeve-grid border-line bg-panel-2 hover:border-line-bright'
                }`}
              >
                <span className={`font-mono text-[10px] tnum ${i % 3 === 0 ? 'text-paper-muted' : 'text-faint'}`}>{n}</span>
                <span className={`t-display text-[1.6rem] leading-none ${i % 3 === 0 ? 'text-paper-ink' : 'text-ink'}`}>{g}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {browsing ? (
        <Link
          to="/play"
          className="group mt-10 flex items-center gap-4 border border-line-bright bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2"
        >
          <Vinyl size={48} spin />
          <div className="min-w-0 flex-1">
            <div className="font-sans text-lg font-semibold text-ink">{t('discover.play')}</div>
            <div className="truncate font-sans text-[13px] text-muted">{t('discover.playSub')}</div>
          </div>
          <IconChevronRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
        </Link>
      ) : null}

      {showBattles ? (
        <section className="mt-10">
          <SectionHead title={t('discover.battlesHead')} />
          {battleHits.length ? (
            <div className="mt-1">
              {battleHits.slice(0, 30).map((b) => (
                <BattleResult key={b.id} battle={b} />
              ))}
            </div>
          ) : !nothing ? (
            <p className="mt-4 font-sans text-[14px] text-muted">{t('discover.noResults', { q })}</p>
          ) : null}
        </section>
      ) : null}

      {showClips ? (
        <section className="mt-10">
          <SectionHead title={t('discover.type.clips')} />
          {clips === null ? null : clipHits.length ? (
            <WaveformClips clips={clipHits} className="mt-4" />
          ) : (
            <EmptyState className="mt-4" title={query ? t('discover.noResults', { q }) : t('home.clipsEmpty')} />
          )}
        </section>
      ) : null}

      {showArtists ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
            <h2 className="t-kicker text-ink">{query ? t('discover.type.artists') : t('discover.allArtists')}</h2>
            <div className="flex gap-1">
              {ROLE_TABS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                    role === r.key ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t(r.labelKey)}
                </button>
              ))}
            </div>
          </div>
          {creators.length ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((u) => (
                <PersonCard key={u.id} user={u} />
              ))}
            </div>
          ) : !nothing ? (
            <p className="mt-6 font-sans text-[14px] text-muted">{t('social.people.empty')}</p>
          ) : null}
        </section>
      ) : null}

      {nothing ? <EmptyState className="mt-10" title={t('discover.noResults', { q })} /> : null}
    </div>
  )
}
