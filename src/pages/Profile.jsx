import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { Mentions } from '../components/Handle.jsx'
import ShareSheet from '../components/ShareSheet.jsx'
import AvatarCropper from '../components/AvatarCropper.jsx'
import FollowList from '../components/FollowList.jsx'
import WaveformClips from '../components/WaveformClips.jsx'
import CrateGrid from '../components/CrateGrid.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import WinnerBadge from '../components/WinnerBadge.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { IconSettings, IconCrate, IconDisc, IconVideo, IconTrophy, IconUser } from '../components/icons.jsx'
import { ProfileTour } from '../components/Tour.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import SuggestInput from '../components/SuggestInput.jsx'
import SuggestedPeople from '../components/SuggestedPeople.jsx'
import CallerCard from '../components/CallerCard.jsx'
import CoverPicker from '../components/CoverPicker.jsx'
import { DisplayTitle, EmptyState, SectionHead } from '../components/crate.jsx'
import { BattleRow } from '../components/BattleRow.jsx'
import { ReleaseCard, TrackList, canPublishMusic } from '../components/music.jsx'
import { mediaUrl } from '../api.js'
import { suggestCities } from '../data/cities.js'
import { fmtDate, fmtMonthYear } from '../utils/wave.js'
import { safeHref } from '../utils/safeHref.js'
import { roleLabel, CREATIVE_ROLES } from '../data/kind.js'
import { useT } from '../i18n/index.jsx'

// Downscale a picked image to a small square-ish JPEG data URL.
function fileToAvatar(file, cb) {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const max = 256
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      cb(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}

// Instagram/TikTok-style tab bar that fronts the profile's content section.
// SMPL language: mono caps, hairline rules, an ink underline on the active tab.
function ProfileTabs({ tabs, active, onSelect }) {
  return (
    <div data-tour="profile-tabs" role="tablist" className="flex border-y border-line">
      {tabs.map((tabDef) => {
        const on = tabDef.key === active
        const Icon = tabDef.icon
        return (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => onSelect(tabDef.key)}
            role="tab"
            aria-selected={on}
            className={`-mb-px flex flex-1 flex-col items-center justify-center gap-1 border-b-2 py-2.5 transition-colors duration-300 ${
              on ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink-dim'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em]">{tabDef.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function StatCell({ label, value, sub }) {
  return (
    <div className="bg-bg px-5 py-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{label}</div>
      <div className="mt-3 font-mono text-[2.5rem] leading-[0.9] tnum text-ink">{value}</div>
      {sub ? <div className="mt-2 font-mono text-[10px] text-muted">{sub}</div> : null}
    </div>
  )
}

export function Editor({ user, onClose }) {
  const { updateProfile } = useApp()
  const t = useT()
  const [form, setForm] = useState({
    avatar: user.avatar || '',
    banner: user.banner || '',
    creativeRoles: user.creativeRoles || [],
    bio: user.bio || '',
    location: user.location || '',
    contactEmail: user.contactEmail || '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [cropFile, setCropFile] = useState(null)

  const onPick = (e) => {
    const file = e.target.files?.[0]
    if (file) setCropFile(file) // open the zoom/crop tool
    e.target.value = ''
  }

  const save = async () => {
    setBusy(true)
    setErr('')
    const r = await updateProfile({
      avatar: form.avatar,
      banner: form.banner,
      creativeRoles: form.creativeRoles,
      bio: form.bio,
      location: form.location,
      contactEmail: form.contactEmail,
    })
    setBusy(false)
    if (r.ok) onClose()
    else setErr(r.error || t('profile.saveError'))
  }

  return (
    <div className="border border-line-bright bg-panel">
      {cropFile ? (
        <AvatarCropper
          file={cropFile}
          onSave={(data) => {
            setForm((f) => ({ ...f, avatar: data }))
            setCropFile(null)
          }}
          onCancel={() => setCropFile(null)}
        />
      ) : null}
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('profile.editProfile')}</span>
        <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          {t('profile.closeX')}
        </button>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar alias={user.alias} src={form.avatar} size={64} />
          <div className="flex flex-col items-start gap-2">
            <label className="cursor-pointer border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg">
              {t('profile.uploadPhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onPick} />
            </label>
            {form.avatar ? (
              <button
                type="button"
                onClick={() => setForm({ ...form, avatar: '' })}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                {t('profile.removePhoto')}
              </button>
            ) : null}
          </div>
        </div>
        <div>
          <Label>{t('profile.cover')}</Label>
          <CoverPicker
            className="mt-2"
            aspect={3}
            size={1800}
            value={form.banner}
            hint={t('profile.coverHint')}
            cropTitle={t('profile.cover')}
            onChange={(url) => setForm((f) => ({ ...f, banner: url }))}
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label>{t('profile.roles')}</Label>
            <span className="font-mono text-[10px] text-muted">{t('profile.rolesHint')}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CREATIVE_ROLES.map((r) => {
              const on = form.creativeRoles.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      creativeRoles: on
                        ? f.creativeRoles.filter((x) => x !== r)
                        : f.creativeRoles.length < 4
                          ? [...f.creativeRoles, r]
                          : f.creativeRoles,
                    }))
                  }
                  className={`h-9 border px-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                    on ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                  }`}
                >
                  {t(`creative.${r}`)}
                </button>
              )
            })}
          </div>
        </div>
        <Field label={t('profile.field.bio')} hint={t('profile.field.bioHint')}>
          <textarea
            rows={3}
            className={textareaCls}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <Field label={t('profile.field.location')}>
          <SuggestInput
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
            groups={
              form.location.trim()
                ? [
                    {
                      label: t('social.search.places'),
                      items: suggestCities(form.location, 6).map((c) => ({
                        key: c.name,
                        label: c.name,
                        sub: c.country,
                        onPick: () => setForm({ ...form, location: c.name }),
                      })),
                    },
                  ]
                : []
            }
          />
        </Field>
        <div>
          <Label>{t('profile.field.genres')}</Label>
          <Link
            to="/edit-profile/genres"
            className="mt-2 flex w-full items-center justify-between border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-ink"
          >
            <span className={user.genres?.length ? 'text-ink' : 'text-muted'}>
              {user.genres?.length ? user.genres.join(' · ') : t('profile.manageGenres')}
            </span>
            <span className="flex items-center gap-2 text-muted">
              <span className="tnum">{user.genres?.length || 0}</span>
              <span>▸</span>
            </span>
          </Link>
        </div>
        <Field label={t('profile.contactEmail')} hint={t('profile.contactHint')}>
          <input
            type="email"
            className={inputCls}
            placeholder="you@example.com"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
        </Field>
        <div>
          <Label>{t('profile.links')}</Label>
          <Link
            to="/edit-profile/links"
            className="mt-2 flex w-full items-center justify-between border border-line-bright px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
          >
            <span>{t('profile.manageLinks')}</span>
            <span className="flex items-center gap-2 text-muted">
              <span className="tnum">{(user.links || []).length}</span>
              <span>▸</span>
            </span>
          </Link>
        </div>
        {err ? <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {err}</div> : null}
        <div className="flex gap-3">
          <Btn onClick={save} variant="solid" disabled={busy}>
            {busy ? t('profile.saving') : t('profile.saveProfile')}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            {t('common.cancel')}
          </Btn>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { alias } = useParams()
  const t = useT()
  const { getUserByAlias, producerStats, curatorStats, followerCount, isFollowing, toggleFollow, currentUser, follows, isBlocked, isAdmin, setUserRole, toggleVerified, setEditorRole, fetchWaveformVideos, fetchCrate, fetchMusic } =
    useApp()
  const base = getUserByAlias(alias)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [followView, setFollowView] = useState(null) // null | 'followers' | 'following'
  const [clips, setClips] = useState([])
  const [crate, setCrate] = useState([])
  const [music, setMusic] = useState({ tracks: [], releases: [] })
  const [tab, setTab] = useState(null) // active profile tab; null → derived default
  const contentRef = useRef(null)

  useEffect(() => {
    if (!base?.id) {
      setClips([])
      return
    }
    let alive = true
    fetchWaveformVideos(base.id).then((r) => {
      if (alive && r.ok) setClips(r.videos || [])
    })
    return () => {
      alive = false
    }
  }, [base?.id, fetchWaveformVideos])

  useEffect(() => {
    if (!base?.id) {
      setCrate([])
      return
    }
    let alive = true
    fetchCrate(base.id).then((r) => {
      if (alive && r.ok) setCrate(r.items || [])
    })
    return () => {
      alive = false
    }
  }, [base?.id, fetchCrate])

  useEffect(() => {
    if (!base?.id) {
      setMusic({ tracks: [], releases: [] })
      return
    }
    let alive = true
    fetchMusic(base.id).then((r) => {
      if (alive && r.ok) setMusic({ tracks: r.tracks || [], releases: r.releases || [] })
    })
    return () => {
      alive = false
    }
  }, [base?.id, fetchMusic])

  // old deep link (?edit=1) → the dedicated edit page
  useEffect(() => {
    if (base && currentUser?.id === base.id && searchParams.get('edit') === '1') {
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
      navigate('/edit-profile')
    }
  }, [base, currentUser, searchParams, setSearchParams, navigate])

  if (!base) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-24 text-center sm:px-6">
        <div className="font-mono text-sm text-muted">{t('profile.notFound', { alias })}</div>
        <div className="mt-6">
          <Btn to="/battles" variant="ghost">
            {t('profile.backToBattles')}
          </Btn>
        </div>
      </div>
    )
  }

  const isSelf = !!currentUser && currentUser.id === base.id
  const user = isSelf ? { ...base, ...currentUser } : base
  const stats = producerStats(user.id)
  const followers = followerCount(user.id)
  const followingCount = follows.filter((f) => f.followerId === user.id).length
  const following = isFollowing(user.id)
  // admin runs battles like a curator → show the curator/host file for both.
  const isCuratorProfile = user.role === 'curator' || user.role === 'admin'
  const cstats = isCuratorProfile ? curatorStats(user.id) : null
  const isListener = user.role === 'listener' && !user.dualRole
  const hasMusic = music.tracks.length > 0 || music.releases.length > 0
  const canMakeMusic = canPublishMusic(user)
  const showMusic = hasMusic || (isSelf && canMakeMusic)
  const showVideos = clips.length > 0 || (isSelf && !isListener && !isCuratorProfile)
  // one content section: music first when there is some, else the maker's clips,
  // the curator's battles, or a listener's crate
  const activeTab =
    tab ??
    (hasMusic ? 'music' : clips.length ? 'videos' : isListener ? 'crate' : 'battles')
  // tapping the primary count jumps straight to the grid/record, like Instagram.
  // Resolve the real scroll container (the app shell scrolls an inner <main>, the
  // website scrolls the page) so the jump works in both shells.
  const goToContent = (key) => {
    if (key) setTab(key)
    const el = contentRef.current
    if (!el) return
    let scroller = el.parentElement
    while (scroller && scroller !== document.body) {
      const oy = getComputedStyle(scroller).overflowY
      if ((oy === 'auto' || oy === 'scroll') && scroller.scrollHeight > scroller.clientHeight + 8) break
      scroller = scroller.parentElement
    }
    const onPage = !scroller || scroller === document.body
    const sc = onPage ? document.scrollingElement || document.documentElement : scroller
    const scTop = onPage ? 0 : sc.getBoundingClientRect().top
    const top = sc.scrollTop + el.getBoundingClientRect().top - scTop - 16
    sc.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
      {isSelf ? <ProfileTour /> : null}
      {/* PROFILE HEADER: cover photo, avatar, name, what they do, real counts */}
      <div className="relative isolate overflow-hidden border border-line bg-panel">
        <div className="sleeve-grid relative aspect-[3/1] w-full overflow-hidden bg-panel-2">
          {user.banner ? <img src={mediaUrl(user.banner)} alt="" className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-panel to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim sm:px-7">
            <span className="bg-bg/60 px-1.5 py-0.5">{isCuratorProfile ? t('profile.curatorFile') : t('profile.artistFile')}</span>
          </div>
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-10 sm:-mt-12">
            <div className="inline-block border-2 border-panel bg-panel">
              <Avatar alias={user.alias} src={user.avatar} size={84} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <DisplayTitle as="h1" size="md" className="min-w-0 break-words text-ink [overflow-wrap:anywhere]">
                {user.alias}
              </DisplayTitle>
              {user.verified || user.role === 'admin' ? <VerifiedBadge size={20} title={t('profile.verified')} /> : null}
              {user.wins ? <WinnerBadge wins={user.wins} size={15} title={t('profile.winnerBadge', { n: user.wins })} /> : null}
            </div>
            <div className="mt-1.5 font-sans text-[14px] text-ink-dim">
              {(user.creativeRoles?.length ? user.creativeRoles.map((r) => t(`creative.${r}`)) : [user.dualRole ? t('role.dual') : roleLabel(user.role)]).join(' · ')}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted">
              <span>@{user.alias}</span>
              {user.location ? <span>· {user.location}</span> : null}
              <span>· {t('profile.memberSince', { month: fmtMonthYear(user.joinedAt) })}</span>
              {isCuratorProfile ? <span className="text-ink-dim">· {t('profile.badge.curator')}</span> : null}
            </div>
          </div>

          {user.bio ? (
            <p className="mt-3 line-clamp-4 whitespace-pre-line font-sans text-[15px] leading-relaxed text-ink-dim">
              <Mentions text={user.bio} />
            </p>
          ) : null}

          <div
            data-tour="profile-stats"
            className="mt-5 grid auto-cols-fr grid-flow-col divide-x divide-line border-y border-line"
          >
            {showMusic ? (
              <button onClick={() => goToContent('music')} className="py-3 text-center transition-opacity hover:opacity-70">
                <div className="font-mono text-lg tnum leading-none text-ink sm:text-xl">{music.releases.length || music.tracks.length}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                  {music.releases.length ? t('profile.music.releases') : t('profile.music.tracks')}
                </div>
              </button>
            ) : null}
            {!isListener ? (
              <button onClick={() => goToContent('battles')} className="py-3 text-center transition-opacity hover:opacity-70">
                <div className="font-mono text-lg tnum leading-none text-ink sm:text-xl">
                  {isCuratorProfile ? cstats.curated.length : stats.played}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{t('profile.tab.battles')}</div>
              </button>
            ) : null}
            <button onClick={() => setFollowView('followers')} className="py-3 text-center transition-opacity hover:opacity-70">
              <div className="font-mono text-lg tnum leading-none text-ink sm:text-xl">{followers}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{t('common.followers')}</div>
            </button>
            <button onClick={() => setFollowView('following')} className="py-3 text-center transition-opacity hover:opacity-70">
              <div className="font-mono text-lg tnum leading-none text-ink sm:text-xl">{followingCount}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{t('common.following')}</div>
            </button>
          </div>

          {/* actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isSelf ? (
              <>
                {isCuratorProfile ? (
                  <Link
                    to="/dashboard"
                    className="flex h-10 flex-1 items-center justify-center border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors duration-300 hover:bg-bright sm:flex-none"
                  >
                    {t('common.dashboard')}
                  </Link>
                ) : null}
                <button
                  data-tour="profile-edit"
                  onClick={() => navigate('/edit-profile')}
                  className="h-10 flex-1 border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink sm:flex-none sm:px-6"
                >
                  {t('common.edit')}
                </button>
                <ShareSheet
                  className="h-10 w-10 shrink-0"
                  cardTo={`/share/profile/${encodeURIComponent(user.alias)}`}
                  dm={{ kind: 'profile', ref: user.alias }}
                  title={t('profile.share.title', { alias: user.alias })}
                  text={t('profile.share.text', { alias: user.alias, role: roleLabel(user.role) })}
                />
                <Link
                  data-tour="profile-settings"
                  to="/settings"
                  aria-label={t('common.settings')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
                >
                  <IconSettings size={17} />
                </Link>
              </>
            ) : (
              <>
                {currentUser?.alias === 'SMPL' ? null : user.alias === 'SMPL' ? (
                  <span
                    className="flex h-10 flex-1 items-center justify-center border border-ink bg-ink px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg sm:flex-none sm:px-7"
                    title={t('common.smplFollowLocked')}
                  >
                    {t('common.followingState')}
                  </span>
                ) : (
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className={`h-10 flex-1 border px-5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 sm:flex-none sm:px-7 ${
                      following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                    }`}
                  >
                    {following ? t('common.followingState') : t('common.follow')}
                  </button>
                )}
                {currentUser ? (
                  <Link
                    to={`/messages/${encodeURIComponent(user.alias)}`}
                    className="flex h-10 flex-1 items-center justify-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink sm:flex-none sm:px-6"
                  >
                    {t('messages.message')}
                  </Link>
                ) : null}
                <ShareSheet
                  className="h-10 w-10 shrink-0"
                  cardTo={`/share/profile/${encodeURIComponent(user.alias)}`}
                  dm={{ kind: 'profile', ref: user.alias }}
                  title={t('profile.share.title', { alias: user.alias })}
                  text={t('profile.share.text', { alias: user.alias, role: roleLabel(user.role) })}
                />
                <UserSafetyMenu user={user} />
                {isAdmin && user.role !== 'admin' ? (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <button
                      onClick={() => setUserRole(user.id, user.role === 'curator' ? 'producer' : 'curator')}
                      className="h-10 border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
                    >
                      {user.role === 'curator' ? t('admin.removeCurator') : t('admin.makeCurator')}
                    </button>
                    <button
                      onClick={() =>
                        setEditorRole(user.id, user.editorRole === 'author' ? 'editor' : user.editorRole === 'editor' ? '' : 'author')
                      }
                      title={t('admin.journal.' + (user.editorRole || 'none'))}
                      className={`h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                        user.editorRole ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                      }`}
                    >
                      {t('admin.journal.' + (user.editorRole || 'none'))}
                    </button>
                    <button
                      onClick={() => toggleVerified(user.id)}
                      className={`h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                        user.verified ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                      }`}
                    >
                      {user.verified ? t('admin.unverify') : t('admin.verify')}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {followView ? (
        <FollowList userId={user.id} initialTab={followView} onClose={() => setFollowView(null)} />
      ) : null}

      {/* blocked note (other user) */}
      {!isSelf && isBlocked(user.id) ? (
        <div className="mt-4 border border-line bg-panel px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t('safety.blockedNote', { alias: user.alias })}
        </div>
      ) : null}


      {/* PROFILE CONTENT: music / videos / battles / crate / about */}
      <div ref={contentRef} className="mt-12 scroll-mt-20">
        <ProfileTabs
          active={activeTab}
          onSelect={setTab}
          tabs={[
            showMusic && { key: 'music', label: t('profile.tab.music'), icon: IconDisc },
            showVideos && { key: 'videos', label: t('profile.tab.videos'), icon: IconVideo },
            !isListener && { key: 'battles', label: t('profile.tab.battles'), icon: IconTrophy },
            { key: 'crate', label: t('profile.tab.crate'), icon: IconCrate },
            { key: 'about', label: t('profile.tab.about'), icon: IconUser },
          ].filter(Boolean)}
        />

        {/* MUSIC */}
        {activeTab === 'music' ? (
          <div className="mt-8 space-y-10">
            {isSelf && canMakeMusic ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/create/track"
                  className="inline-flex h-10 items-center bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink hover:bg-bright"
                >
                  {t('create.uploadTrack')}
                </Link>
                <Link
                  to="/create/release"
                  className="inline-flex h-10 items-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-bg"
                >
                  {t('create.publishRelease')}
                </Link>
              </div>
            ) : null}
            {music.releases.length ? (
              <section>
                <SectionHead title={t('profile.music.releases')} />
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {music.releases.map((r) => (
                    <ReleaseCard key={r.id} release={r} />
                  ))}
                </div>
              </section>
            ) : null}
            {music.tracks.length ? (
              <section>
                <SectionHead title={t('profile.music.tracks')} />
                <TrackList tracks={music.tracks} maker={{ id: user.id, alias: user.alias, avatar: user.avatar, verified: user.verified }} />
              </section>
            ) : null}
            {!hasMusic ? <EmptyState title={isSelf ? t('profile.music.emptySelf') : t('profile.music.empty')} /> : null}
          </div>
        ) : null}

        {/* VIDEOS (waveform clips) */}
        {activeTab === 'videos' ? (
          <>
            {isSelf && canMakeMusic ? (
              <div className="mt-8">
                <Link
                  to="/create/video"
                  className="inline-flex h-10 items-center bg-paper px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-paper-ink hover:bg-bright"
                >
                  {t('create.uploadVideo')}
                </Link>
              </div>
            ) : null}
            {clips.length ? (
              <WaveformClips clips={clips} />
            ) : (
              <EmptyState className="mt-8" title={isSelf ? t('profile.clips.emptySelf') : t('profile.clips.empty')} />
            )}
          </>
        ) : null}

        {/* CRATE */}
        {activeTab === 'crate' ? (
          crate.length ? (
            <CrateGrid items={crate} />
          ) : (
            <EmptyState className="mt-8" title={isSelf ? t('crate.emptySelf') : t('crate.empty')} />
          )
        ) : null}

        {/* BATTLES: stats + the curated list or the match history */}
        {activeTab === 'battles' ? (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              {isCuratorProfile ? (
                <>
                  <StatCell label={t('profile.cstats.battles')} value={cstats.count} sub={t('profile.cstats.battlesSub')} />
                  <StatCell label={t('profile.cstats.creators')} value={cstats.creators} sub={t('profile.cstats.creatorsSub')} />
                  <StatCell label={t('profile.cstats.drops')} value={cstats.drops} sub={t('profile.cstats.dropsSub')} />
                  <StatCell label={t('profile.cstats.winners')} value={cstats.winners} sub={t('profile.cstats.winnersSub')} />
                </>
              ) : (
                <>
                  <StatCell label={t('profile.stats.battles')} value={stats.played} sub={t('profile.stats.battlesSub')} />
                  <StatCell label={t('profile.stats.won')} value={stats.won} sub={t('profile.stats.wonSub')} />
                  <StatCell label={t('profile.stats.winRatio')} value={`${stats.winRatio}%`} sub={`${stats.won}/${stats.played}`} />
                  <StatCell label={t('profile.stats.totalVotes')} value={stats.totalVotes} sub={t('profile.stats.totalVotesSub')} />
                </>
              )}
            </div>
            {isCuratorProfile ? (
              cstats.curated.length ? (
                <div className="border-t border-line">
                  {cstats.curated.map((b) => (
                    <BattleRow key={b.id} battle={b} />
                  ))}
                </div>
              ) : (
                <EmptyState title={t('profile.curated.empty')} />
              )
            ) : (
              <div className="border border-line bg-panel">
                {stats.history.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse">
                      <thead>
                        <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                          <th className="px-5 py-3.5 text-left font-normal">{t('profile.history.col.battle')}</th>
                          <th className="px-5 py-3.5 text-right font-normal">{t('profile.history.col.position')}</th>
                          <th className="px-5 py-3.5 text-right font-normal">{t('profile.history.col.votes')}</th>
                          <th className="px-5 py-3.5 text-right font-normal">{t('profile.history.col.date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.history.map((h, i) => {
                          const won = h.position === 1
                          return (
                            <tr key={i} className="border-b border-line transition-colors duration-300 hover:bg-panel-2">
                              <td className="px-5 py-4">
                                <span className="font-sans text-[15px] uppercase tracking-tight">{h.battle}</span>
                                {h.live ? (
                                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{t('profile.history.onSmpl')}</span>
                                ) : null}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className={`inline-block font-mono text-[11px] tnum ${won ? 'bg-ink px-2 py-0.5 text-bg' : 'text-ink-dim'}`}>
                                  #{h.position}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-[12px] text-ink tnum">{h.votes}</td>
                              <td className="px-5 py-4 text-right font-mono text-[11px] text-muted tnum">{fmtDate(h.date)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-5 py-6 font-sans text-[14px] text-muted">{t('profile.history.empty')}</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* ABOUT */}
        {activeTab === 'about' ? (
          <div className="mt-8 space-y-8">
            {user.bio ? (
              <p className="max-w-prose whitespace-pre-line font-sans text-[16px] leading-relaxed text-ink-dim">
                <Mentions text={user.bio} />
              </p>
            ) : null}
            {user.genres?.length ? (
              <section>
                <SectionHead title={t('profile.field.genres')} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.genres.map((g) => (
                    <span key={g} className="border border-line-bright px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
            {user.contactEmail || user.links?.length ? (
              <section>
                <SectionHead title={t('profile.links')} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.contactEmail ? (
                    <a
                      href={`mailto:${user.contactEmail}`}
                      className="inline-flex items-center gap-1.5 border border-line-bright px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:border-ink"
                    >
                      {t('profile.contactLabel')}
                    </a>
                  ) : null}
                  {user.links?.map((l) => (
                    <a
                      key={l.label}
                      href={safeHref(l.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:border-line-bright"
                    >
                      <span>{l.label}</span>
                      <span className="text-muted">↗</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
            {user.daw ? (
              <section>
                <SectionHead title="DAW" />
                <p className="mt-3 font-mono text-[13px] text-ink-dim">{user.daw}</p>
              </section>
            ) : null}
            {!user.bio && !user.genres?.length && !user.contactEmail && !user.links?.length && !user.daw && !user.caller?.calls ? (
              <EmptyState title={t('profile.about.empty')} />
            ) : null}
            {/* prediction-game reputation: any profile that has made calls */}
            <CallerCard user={user} />
          </div>
        ) : null}
      </div>

      {/* people to follow: only on your own profile, below your own content */}
      {isSelf ? <SuggestedPeople className="mt-12" limit={3} /> : null}
    </div>
  )
}
