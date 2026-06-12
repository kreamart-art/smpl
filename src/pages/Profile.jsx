import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Waveform from '../components/Waveform.jsx'
import Reveal from '../components/Reveal.jsx'
import { Mentions } from '../components/Handle.jsx'
import BattleCard from '../components/BattleCard.jsx'
import ShareButton from '../components/ShareButton.jsx'
import AvatarCropper from '../components/AvatarCropper.jsx'
import { TwoFactorPanel, DeleteAccountPanel } from '../components/SecurityPanels.jsx'
import LangToggle from '../components/LangToggle.jsx'
import FollowList from '../components/FollowList.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { IconSettings, IconLogout, IconShield, IconTrash, IconGlobe, IconPoster, IconBell } from '../components/icons.jsx'
import { pushSupported, pushPermission, isPushSubscribed, enablePush, disablePush } from '../lib/push.js'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { fmtDate, fmtMonthYear, ageFrom } from '../utils/wave.js'
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

function SectionHead({ index, kicker, title, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[12px] text-faint tnum">{index}</span>
        <div>
          {kicker ? (
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{kicker}</div>
          ) : null}
          <h2 className="font-sans text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl">{title}</h2>
        </div>
      </div>
      {right}
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

function PrivateCell({ label, value }) {
  return (
    <div className="bg-bg px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{label}</div>
      <div className="mt-1.5 font-mono text-sm text-ink">{value || '—'}</div>
    </div>
  )
}

function Editor({ user, onClose }) {
  const { updateProfile } = useApp()
  const t = useT()
  const [form, setForm] = useState({
    avatar: user.avatar || '',
    bio: user.bio || '',
    location: user.location || '',
    contactEmail: user.contactEmail || '',
    genres: (user.genres || []).join(', '),
    links: (user.links || []).map((l) => `${l.label}, ${l.url}`).join('\n'),
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
    const links = form.links
      .split('\n')
      .map((line) => {
        const [label, ...rest] = line.split(',')
        const url = rest.join(',').trim()
        return label && url ? { label: label.trim(), url } : null
      })
      .filter(Boolean)
    const r = await updateProfile({
      avatar: form.avatar,
      bio: form.bio,
      location: form.location,
      contactEmail: form.contactEmail,
      genres: form.genres,
      links,
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t('profile.field.location')}>
            <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label={t('profile.field.genres')} hint={t('profile.field.genresHint')}>
            <input className={inputCls} value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} />
          </Field>
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
        <Field label={t('profile.field.links')} hint={t('profile.field.linksHint')}>
          <textarea
            rows={3}
            className={textareaCls}
            placeholder={t('profile.linksPlaceholder')}
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
          />
        </Field>
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

function NotificationsRow() {
  const { pushConfigured } = useApp()
  const t = useT()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [perm, setPerm] = useState('default')

  useEffect(() => {
    setPerm(pushPermission())
    isPushSubscribed().then(setOn)
  }, [])

  if (!pushConfigured || !pushSupported()) return null

  const toggle = async () => {
    setBusy(true)
    if (on) {
      await disablePush()
      setOn(false)
    } else {
      const r = await enablePush()
      setOn(!!r.ok)
    }
    setPerm(pushPermission())
    setBusy(false)
  }

  return (
    <div className="flex w-full items-center gap-3 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
      <IconBell size={18} />
      <span>{t('push.settings')}</span>
      <span className="ml-auto">
        {perm === 'denied' ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{t('push.blockedShort')}</span>
        ) : (
          <button
            onClick={toggle}
            disabled={busy}
            className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
              on ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
            }`}
          >
            {on ? t('push.on') : t('push.off')}
          </button>
        )}
      </span>
    </div>
  )
}

function SettingsPanel({ user, onEdit, onClose }) {
  const { logout } = useApp()
  const { standalone } = usePWA()
  const navigate = useNavigate()
  const t = useT()
  const [view, setView] = useState('menu')
  const out = async () => {
    await logout()
    navigate(standalone ? '/login' : '/')
  }

  if (view === '2fa') return <TwoFactorPanel onBack={() => setView('menu')} />
  if (view === 'delete') return <DeleteAccountPanel onBack={() => setView('menu')} />

  const Item = ({ icon, label, onClick, danger, right }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-4 text-left font-mono text-[12px] uppercase tracking-[0.12em] transition-colors hover:bg-bg ${
        danger ? 'text-ink' : 'text-ink-dim'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="ml-auto flex items-center gap-2 text-muted">
        {right}
        <span>▸</span>
      </span>
    </button>
  )
  const canDelete = user.id !== 'curator'
  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('common.settings')}</span>
        <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          {t('profile.closeX')}
        </button>
      </div>
      <div className="divide-y divide-line">
        <Item icon={<IconSettings size={18} />} label={t('profile.editProfile')} onClick={() => { onClose(); onEdit() }} />
        <div className="flex w-full items-center gap-3 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
          <IconGlobe size={18} />
          <span>{t('common.language')}</span>
          <span className="ml-auto">
            <LangToggle />
          </span>
        </div>
        <NotificationsRow />
        <Item
          icon={<IconShield size={18} />}
          label={t('profile.twoFactorAuth')}
          onClick={() => setView('2fa')}
          right={
            <span className={`font-mono text-[10px] ${user.twoFactor ? 'text-ink' : 'text-faint'}`}>
              {user.twoFactor ? t('profile.on') : t('profile.off')}
            </span>
          }
        />
        <Item icon={<IconLogout size={18} />} label={t('common.logout')} onClick={out} />
        {canDelete ? (
          <Item icon={<IconTrash size={18} />} label={t('profile.deleteAccount')} onClick={() => setView('delete')} danger />
        ) : null}
      </div>
      <div className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">
        {t('profile.signedInAs', { who: user.email || user.alias })}
      </div>
    </div>
  )
}

export default function Profile() {
  const { alias } = useParams()
  const t = useT()
  const { getUserByAlias, producerStats, curatorStats, followerCount, isFollowing, toggleFollow, currentUser, follows, isBlocked, isAdmin, setUserRole } =
    useApp()
  const base = getUserByAlias(alias)
  const [editing, setEditing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [followView, setFollowView] = useState(null) // null | 'followers' | 'following'

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
  const age = ageFrom(user.dob, Date.now())
  const hasPrivate = user.name || user.dob || user.email
  // admin runs battles like a curator → show the curator/host file for both.
  const isCuratorProfile = user.role === 'curator' || user.role === 'admin'
  const cstats = isCuratorProfile ? curatorStats(user.id) : null

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
      {/* ARTIST FILE / BANNER */}
      <div className="relative isolate overflow-hidden border border-line bg-panel">
        <span className="hero-bloom" aria-hidden="true" />
        <div className="relative flex items-center justify-between px-6 pt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-faint sm:px-8">
          <span>{isCuratorProfile ? t('profile.curatorFile') : t('profile.artistFile')}</span>
          <span>{roleLabel(user.role)}</span>
        </div>
        <div className="relative px-6 pt-6 sm:px-8">
          <Waveform seed={`banner-${user.id}`} bars={120} height={88} animated baseClass="bg-line-bright" />
        </div>
        <div className="relative flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="flex items-end gap-5">
            <Avatar alias={user.alias} src={user.avatar} size={88} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="text-ink-dim">@{user.alias}</span>
                {user.location ? <span className="text-faint">/</span> : null}
                {user.location ? <span>◍ {user.location}</span> : null}
                <span className="text-faint">/</span>
                <span>{t('profile.memberSince', { month: fmtMonthYear(user.joinedAt) })}</span>
              </div>
              <h1 className="mt-2 font-sans text-[clamp(2.4rem,8vw,4.5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
                {user.alias}
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                {isCuratorProfile ? (
                  <>
                    <span className="text-ink">✓</span> {t('profile.badge.curator')}
                  </>
                ) : (
                  <>
                    <span className="text-ink">◆</span> {t('profile.badge.anon')}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-5">
              <button onClick={() => setFollowView('followers')} className="text-right transition-opacity hover:opacity-70">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t('common.followers')}</div>
                <div className="font-mono text-2xl tnum leading-none">{followers}</div>
              </button>
              <button onClick={() => setFollowView('following')} className="text-right transition-opacity hover:opacity-70">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t('common.following')}</div>
                <div className="font-mono text-2xl tnum leading-none">{followingCount}</div>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/share/profile/${encodeURIComponent(user.alias)}`}
                aria-label={t('share.title')}
                title={t('share.title')}
                className="flex h-12 w-12 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
              >
                <IconPoster size={18} />
              </Link>
              <ShareButton
                iconOnly
                className="h-12 w-12"
                title={t('profile.share.title', { alias: user.alias })}
                text={t('profile.share.text', { alias: user.alias, role: roleLabel(user.role) })}
              />
              {isSelf ? (
                <>
                  {isCuratorProfile ? (
                    <Link
                      to="/dashboard"
                      className="flex h-12 items-center border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors duration-300 hover:bg-bright"
                    >
                      {t('common.dashboard')}
                    </Link>
                  ) : null}
                  <button
                    onClick={() => {
                      setSettingsOpen(false)
                      setEditing((v) => !v)
                    }}
                    className="h-12 border border-line-bright px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
                  >
                    {editing ? t('common.close') : t('common.edit')}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setSettingsOpen((v) => !v)
                    }}
                    aria-label={t('common.settings')}
                    className="flex h-12 w-12 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
                  >
                    <IconSettings size={18} />
                  </button>
                </>
              ) : (
                <>
                  {currentUser ? (
                    <Link
                      to={`/messages/${encodeURIComponent(user.alias)}`}
                      className="flex h-12 items-center border border-line-bright px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
                    >
                      {t('messages.message')}
                    </Link>
                  ) : null}
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className={`h-12 border px-6 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                      following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                    }`}
                  >
                    {following ? t('common.followingState') : t('common.follow')}
                  </button>
                  <UserSafetyMenu user={user} />
                  {isAdmin && user.role !== 'admin' ? (
                    <button
                      onClick={() => setUserRole(user.id, user.role === 'curator' ? 'producer' : 'curator')}
                      className="h-12 border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
                    >
                      {user.role === 'curator' ? t('admin.removeCurator') : t('admin.makeCurator')}
                    </button>
                  ) : null}
                </>
              )}
            </div>
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

      {/* EDITOR (self) */}
      {isSelf && editing ? (
        <div className="mt-6">
          <Editor user={user} onClose={() => setEditing(false)} />
        </div>
      ) : null}

      {/* SETTINGS (self) */}
      {isSelf && settingsOpen ? (
        <div className="mt-6">
          <SettingsPanel user={user} onEdit={() => setEditing(true)} onClose={() => setSettingsOpen(false)} />
        </div>
      ) : null}

      {/* PRIVATE FILE (self only) */}
      {isSelf && hasPrivate ? (
        <Reveal className="mt-6">
          <div className="border border-line-bright bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
                <span>⌧</span> {t('profile.privateFile')}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('profile.visibleOnlyToYou')}</span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
              <PrivateCell label={t('profile.legalName')} value={user.name} />
              <PrivateCell
                label={t('profile.dob')}
                value={user.dob ? (age != null ? t('profile.dobYears', { dob: user.dob, age }) : user.dob) : ''}
              />
              <PrivateCell label={t('profile.email')} value={user.email} />
            </div>
            <div className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">
              {t('profile.privateFootnote')}
            </div>
          </div>
        </Reveal>
      ) : null}

      {/* BIO + LINKS */}
      <Reveal className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border border-line bg-panel p-6 lg:col-span-2">
            <Label>{t('profile.bio')}</Label>
            <p className="mt-4 font-sans text-[15px] leading-relaxed text-ink-dim">
              {user.bio ? <Mentions text={user.bio} /> : t('profile.noBio')}
            </p>
            {user.genres?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {user.genres.map((g) => (
                  <span
                    key={g}
                    className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                  >
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="border border-line bg-panel p-6">
            <Label>{t('profile.links')}</Label>
            <div className="mt-4 flex flex-col gap-2">
              {user.contactEmail ? (
                <a
                  href={`mailto:${user.contactEmail}`}
                  className="flex items-center justify-between gap-2 border border-line-bright px-3 py-2.5 font-mono text-[11px] text-ink transition-colors duration-300 hover:border-ink"
                >
                  <span className="uppercase tracking-[0.12em]">{t('profile.contactLabel')}</span>
                  <span className="truncate text-muted">{user.contactEmail}</span>
                </a>
              ) : null}
              {user.links?.length
                ? user.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      className="flex items-center justify-between border border-line px-3 py-2.5 font-mono text-[11px] text-ink transition-colors duration-300 hover:border-line-bright"
                    >
                      <span className="uppercase tracking-[0.12em]">{l.label}</span>
                      <span className="text-muted">↗</span>
                    </a>
                  ))
                : null}
              {!user.links?.length && !user.contactEmail ? (
                <span className="font-mono text-[11px] text-muted">{t('profile.noLinks')}</span>
              ) : null}
            </div>
          </div>
        </div>
      </Reveal>

      {/* STATS */}
      <Reveal className="mt-14">
        <SectionHead
          index="F1"
          kicker={isCuratorProfile ? t('profile.stats.kickerCurator') : t('profile.stats.kickerCareer')}
          title={t('profile.stats.title')}
        />
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
      </Reveal>

      {/* CURATED BATTLES (curator) */}
      {isCuratorProfile ? (
        <Reveal className="mt-14">
          <SectionHead index="F2" kicker={t('profile.curated.kicker')} title={t('profile.curated.title')} />
          {cstats.curated.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cstats.curated.map((b) => (
                <BattleCard key={b.id} battle={b} />
              ))}
            </div>
          ) : (
            <p className="border border-line bg-panel px-5 py-6 font-mono text-[12px] text-muted">
              {t('profile.curated.empty')}
            </p>
          )}
        </Reveal>
      ) : (
        /* HISTORY (competitor) */
        <Reveal className="mt-14">
          <SectionHead index="F2" kicker={t('profile.history.kicker')} title={t('profile.history.title')} />
          <div className="border border-line bg-panel">
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
        </Reveal>
      )}
    </div>
  )
}
