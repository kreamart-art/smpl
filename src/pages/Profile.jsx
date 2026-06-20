import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Waveform from '../components/Waveform.jsx'
import Reveal from '../components/Reveal.jsx'
import { Mentions } from '../components/Handle.jsx'
import BattleCard from '../components/BattleCard.jsx'
import ShareButton from '../components/ShareButton.jsx'
import ShareToDM from '../components/ShareToDM.jsx'
import AvatarCropper from '../components/AvatarCropper.jsx'
import FollowList from '../components/FollowList.jsx'
import WaveformClips from '../components/WaveformClips.jsx'
import CrateGrid from '../components/CrateGrid.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { IconSettings, IconPoster, IconBattles, IconStats, IconFeed, IconCrate } from '../components/icons.jsx'
import { ProfileTour } from '../components/Tour.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { fmtDate, fmtMonthYear } from '../utils/wave.js'
import { roleLabel } from '../data/kind.js'
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
    <div data-tour="profile-tabs" className="flex border-y border-line">
      {tabs.map((tabDef) => {
        const on = tabDef.key === active
        const Icon = tabDef.icon
        return (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => onSelect(tabDef.key)}
            aria-selected={on}
            aria-label={tabDef.label}
            title={tabDef.label}
            className={`-mb-px flex flex-1 items-center justify-center border-b-2 py-2.5 transition-colors duration-300 ${
              on ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink-dim'
            }`}
          >
            <Icon size={22} className="shrink-0" />
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
        <Field label={t('profile.field.bio')} hint={t('profile.field.bioHint')}>
          <textarea
            rows={3}
            className={textareaCls}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <Field label={t('profile.field.location')}>
          <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
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
  const { getUserByAlias, producerStats, curatorStats, followerCount, isFollowing, toggleFollow, currentUser, follows, isBlocked, isAdmin, setUserRole, toggleVerified, fetchWaveformVideos, deleteWaveformVideo, fetchCrate } =
    useApp()
  const base = getUserByAlias(alias)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [followView, setFollowView] = useState(null) // null | 'followers' | 'following'
  const [clips, setClips] = useState([])
  const [crate, setCrate] = useState([])
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
  // one content section, IG/TikTok-style: competitors land on their clip grid, curators on their battles
  const activeTab = tab ?? (isCuratorProfile ? 'record' : user.role === 'listener' ? 'crate' : 'clips')
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
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
      {isSelf ? <ProfileTour /> : null}
      {/* PROFILE HEADER — one compact Instagram-style block, SMPL skin */}
      <div className="relative isolate overflow-hidden border border-line bg-panel">
        <span className="hero-bloom" aria-hidden="true" />

        {/* file label + role */}
        <div className="relative flex items-center justify-between px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-faint sm:px-7">
          <span>{isCuratorProfile ? t('profile.curatorFile') : t('profile.artistFile')}</span>
          <span>{user.dualRole ? t('role.dual') : roleLabel(user.role)}</span>
        </div>

        {/* slim waveform strip — SMPL signature */}
        <div className="relative px-5 pt-3 sm:px-7">
          <Waveform seed={`banner-${user.id}`} bars={120} height={40} animated baseClass="bg-line-bright" />
        </div>

        <div className="relative px-5 py-5 sm:px-7 sm:py-6">
          {/* avatar + inline counts */}
          <div className="flex items-center gap-4 sm:gap-7">
            <div className="shrink-0">
              <Avatar alias={user.alias} src={user.avatar} size={72} />
            </div>
            <div data-tour="profile-stats" className="flex flex-1 items-center justify-between sm:flex-none sm:justify-start sm:gap-10">
              <button
                onClick={() => goToContent(isCuratorProfile ? 'record' : 'clips')}
                className="px-1 text-center transition-opacity hover:opacity-70"
              >
                <div className="font-mono text-xl tnum leading-none text-ink sm:text-2xl">
                  {isCuratorProfile ? cstats.curated.length : clips.length}
                </div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  {isCuratorProfile ? t('profile.tab.battles') : t('profile.tab.clips')}
                </div>
              </button>
              <button onClick={() => setFollowView('followers')} className="px-1 text-center transition-opacity hover:opacity-70">
                <div className="font-mono text-xl tnum leading-none text-ink sm:text-2xl">{followers}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">{t('common.followers')}</div>
              </button>
              <button onClick={() => setFollowView('following')} className="px-1 text-center transition-opacity hover:opacity-70">
                <div className="font-mono text-xl tnum leading-none text-ink sm:text-2xl">{followingCount}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">{t('common.following')}</div>
              </button>
            </div>
          </div>

          {/* name + handle */}
          <div className="mt-4">
            <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-2xl font-bold uppercase leading-[0.9] tracking-tight sm:text-3xl">
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{user.alias}</span>
              {user.verified || user.role === 'admin' ? <VerifiedBadge size={20} title={t('profile.verified')} /> : null}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span className="text-ink-dim">@{user.alias}</span>
              {user.location ? (
                <>
                  <span className="text-faint">/</span>
                  <span>◍ {user.location}</span>
                </>
              ) : null}
              <span className="text-faint">/</span>
              <span>{t('profile.memberSince', { month: fmtMonthYear(user.joinedAt) })}</span>
              {isCuratorProfile ? (
                <>
                  <span className="text-faint">/</span>
                  <span className="text-ink-dim">✓ {t('profile.badge.curator')}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* bio + genres — flows in the header, no sub-label */}
          {user.bio ? (
            <p className="mt-3 whitespace-pre-line font-sans text-[14px] leading-relaxed text-ink-dim">
              <Mentions text={user.bio} />
            </p>
          ) : null}
          {user.genres?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {user.genres.map((g) => (
                <span key={g} className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          {/* links as compact inline chips */}
          {user.contactEmail || user.links?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.contactEmail ? (
                <a
                  href={`mailto:${user.contactEmail}`}
                  className="inline-flex items-center gap-1.5 border border-line-bright px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink transition-colors duration-300 hover:border-ink"
                >
                  {t('profile.contactLabel')}
                </a>
              ) : null}
              {user.links?.map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink transition-colors duration-300 hover:border-line-bright"
                >
                  <span>{l.label}</span>
                  <span className="text-muted">↗</span>
                </a>
              ))}
            </div>
          ) : null}

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
                <Link
                  to={`/share/profile/${encodeURIComponent(user.alias)}`}
                  aria-label={t('share.title')}
                  title={t('share.title')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
                >
                  <IconPoster size={17} />
                </Link>
                <ShareButton
                  iconOnly
                  className="h-10 w-10 shrink-0"
                  title={t('profile.share.title', { alias: user.alias })}
                  text={t('profile.share.text', { alias: user.alias, role: roleLabel(user.role) })}
                />
                <ShareToDM share={{ kind: 'profile', ref: user.alias }} className="h-10 w-10 shrink-0" />
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
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`h-10 flex-1 border px-5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 sm:flex-none sm:px-7 ${
                    following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                  }`}
                >
                  {following ? t('common.followingState') : t('common.follow')}
                </button>
                {currentUser ? (
                  <Link
                    to={`/messages/${encodeURIComponent(user.alias)}`}
                    className="flex h-10 flex-1 items-center justify-center border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink sm:flex-none sm:px-6"
                  >
                    {t('messages.message')}
                  </Link>
                ) : null}
                <Link
                  to={`/share/profile/${encodeURIComponent(user.alias)}`}
                  aria-label={t('share.title')}
                  title={t('share.title')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
                >
                  <IconPoster size={17} />
                </Link>
                <ShareButton
                  iconOnly
                  className="h-10 w-10 shrink-0"
                  title={t('profile.share.title', { alias: user.alias })}
                  text={t('profile.share.text', { alias: user.alias, role: roleLabel(user.role) })}
                />
                <ShareToDM share={{ kind: 'profile', ref: user.alias }} className="h-10 w-10 shrink-0" />
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

      {/* PROFILE CONTENT — clips / stats / record folded into ONE tabbed section */}
      <div ref={contentRef} className="mt-12 scroll-mt-20">
      <Reveal>
        <ProfileTabs
          active={activeTab}
          onSelect={setTab}
          tabs={[
            // curators (incl. the @SMPL mother account) only curate, never make
            // beats — so no clips tab unless they somehow have some.
            ((!isCuratorProfile && user.role !== 'listener') || clips.length > 0) && {
              key: 'clips',
              label: t('profile.tab.clips'),
              count: clips.length,
              icon: IconBattles,
            },
            { key: 'crate', label: t('crate.tab'), count: crate.length, icon: IconCrate },
            { key: 'stats', label: t('profile.tab.stats'), icon: IconStats },
            user.role !== 'listener' && {
              key: 'record',
              label: isCuratorProfile ? t('profile.tab.battles') : t('profile.tab.history'),
              count: isCuratorProfile ? cstats.curated.length : stats.history.length,
              icon: IconFeed,
            },
          ].filter(Boolean)}
        />

        {/* CLIPS */}
        {activeTab === 'clips' ? (
          clips.length ? (
            <WaveformClips
              clips={clips}
              self={isSelf}
              onDelete={async (id) => {
                const r = await deleteWaveformVideo(id)
                if (r.ok) setClips((cs) => cs.filter((x) => x.id !== id))
              }}
            />
          ) : (
            <p className="mt-8 border border-line bg-panel px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
              {isSelf ? t('profile.clips.emptySelf') : t('profile.clips.empty')}
            </p>
          )
        ) : null}

        {/* CRATE */}
        {activeTab === 'crate' ? (
          crate.length ? (
            <CrateGrid items={crate} />
          ) : (
            <p className="mt-8 border border-line bg-panel px-5 py-12 text-center font-mono text-[12px] leading-relaxed text-muted">
              {isSelf ? t('crate.emptySelf') : t('crate.empty')}
            </p>
          )
        ) : null}

        {/* STATS */}
        {activeTab === 'stats' ? (
          <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
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
        ) : null}

        {/* RECORD — curated battles (curator) or match history (competitor) */}
        {activeTab === 'record' ? (
          isCuratorProfile ? (
            cstats.curated.length ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cstats.curated.map((b) => (
                  <BattleCard key={b.id} battle={b} />
                ))}
              </div>
            ) : (
              <p className="mt-8 border border-line bg-panel px-5 py-6 font-mono text-[12px] text-muted">
                {t('profile.curated.empty')}
              </p>
            )
          ) : (
            <div className="mt-8 border border-line bg-panel">
              {stats.history.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse">
                    <thead>
                      <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
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
                              <span
                                className={`inline-block font-mono text-[11px] tnum ${
                                  won ? 'bg-ink px-2 py-0.5 text-bg' : 'text-ink-dim'
                                }`}
                              >
                                {won ? '★ #1' : `#${h.position}`}
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
                <p className="px-5 py-6 font-mono text-[12px] text-muted">{t('profile.history.empty')}</p>
              )}
            </div>
          )
        ) : null}
      </Reveal>
      </div>
    </div>
  )
}
