import { useState, useEffect } from 'react'
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
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { IconSettings, IconPoster } from '../components/icons.jsx'
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

export default function Profile() {
  const { alias } = useParams()
  const t = useT()
  const { getUserByAlias, producerStats, curatorStats, followerCount, isFollowing, toggleFollow, currentUser, follows, isBlocked, isAdmin, setUserRole, toggleVerified } =
    useApp()
  const base = getUserByAlias(alias)
  const [searchParams, setSearchParams] = useSearchParams()
  const [editing, setEditing] = useState(false)
  const [followView, setFollowView] = useState(null) // null | 'followers' | 'following'

  // arriving from Settings → "Edit profile" opens the inline editor once
  useEffect(() => {
    if (base && currentUser?.id === base.id && searchParams.get('edit') === '1') {
      setEditing(true)
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    }
  }, [base, currentUser, searchParams, setSearchParams])

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

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
      {/* ARTIST FILE / BANNER */}
      <div className="relative isolate overflow-hidden border border-line bg-panel">
        <span className="hero-bloom" aria-hidden="true" />
        <div className="relative flex items-center justify-between px-6 pt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-faint sm:px-8">
          <span>{isCuratorProfile ? t('profile.curatorFile') : t('profile.artistFile')}</span>
          <span>{user.dualRole ? t('role.dual') : roleLabel(user.role)}</span>
        </div>
        <div className="relative px-6 pt-6 sm:px-8">
          <Waveform seed={`banner-${user.id}`} bars={120} height={88} animated baseClass="bg-line-bright" />
        </div>
        <div className="relative flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="flex min-w-0 items-end gap-5">
            <Avatar alias={user.alias} src={user.avatar} size={88} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="text-ink-dim">@{user.alias}</span>
                {user.location ? <span className="text-faint">/</span> : null}
                {user.location ? <span>◍ {user.location}</span> : null}
                <span className="text-faint">/</span>
                <span>{t('profile.memberSince', { month: fmtMonthYear(user.joinedAt) })}</span>
              </div>
              <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[clamp(1.7rem,7vw,4.5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{user.alias}</span>
                {user.verified || user.role === 'admin' ? <VerifiedBadge size={26} title={t('profile.verified')} /> : null}
              </h1>
              {isCuratorProfile ? (
                <div className="mt-3 inline-flex items-center gap-2 border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                  <span className="text-ink">✓</span> {t('profile.badge.curator')}
                </div>
              ) : null}
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
              <ShareToDM share={{ kind: 'profile', ref: user.alias }} className="h-12 w-12" />
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
                  <Link
                    to="/settings"
                    aria-label={t('common.settings')}
                    className="flex h-12 w-12 items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink"
                  >
                    <IconSettings size={18} />
                  </Link>
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
                    <>
                      <button
                        onClick={() => setUserRole(user.id, user.role === 'curator' ? 'producer' : 'curator')}
                        className="h-12 border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
                      >
                        {user.role === 'curator' ? t('admin.removeCurator') : t('admin.makeCurator')}
                      </button>
                      <button
                        onClick={() => toggleVerified(user.id)}
                        className={`h-12 border px-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                          user.verified ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                        }`}
                      >
                        {user.verified ? t('admin.unverify') : t('admin.verify')}
                      </button>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {/* BIO + LINKS — folded into the same file card */}
        <div className="relative grid grid-cols-1 border-t border-line lg:grid-cols-3">
          <div className="p-6 lg:col-span-2 lg:border-r lg:border-line">
            <Label>{t('profile.bio')}</Label>
            <p className="mt-4 whitespace-pre-line font-sans text-[15px] leading-relaxed text-ink-dim">
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
          <div className="border-t border-line p-6 lg:border-t-0">
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
