import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Waveform from '../components/Waveform.jsx'
import Reveal from '../components/Reveal.jsx'
import { Mentions } from '../components/Handle.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { fmtDate, fmtMonthYear, ageFrom } from '../utils/wave.js'
import { roleLabel } from '../data/kind.js'

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
  const [form, setForm] = useState({
    avatar: user.avatar || '',
    bio: user.bio || '',
    location: user.location || '',
    genres: (user.genres || []).join(', '),
    links: (user.links || []).map((l) => `${l.label}, ${l.url}`).join('\n'),
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onPick = (e) => {
    const file = e.target.files?.[0]
    if (file) fileToAvatar(file, (data) => setForm((f) => ({ ...f, avatar: data })))
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
      genres: form.genres,
      links,
    })
    setBusy(false)
    if (r.ok) onClose()
    else setErr(r.error || 'Could not save.')
  }

  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">Edit profile</span>
        <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          Close ✕
        </button>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar alias={user.alias} src={form.avatar} size={64} />
          <div className="flex flex-col items-start gap-2">
            <label className="cursor-pointer border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={onPick} />
            </label>
            {form.avatar ? (
              <button
                type="button"
                onClick={() => setForm({ ...form, avatar: '' })}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <Field label="Bio" hint="@mentions link">
          <textarea
            rows={3}
            className={textareaCls}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location">
            <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Genres" hint="comma separated">
            <input className={inputCls} value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} />
          </Field>
        </div>
        <Field label="Links" hint="one per line: label, url">
          <textarea
            rows={3}
            className={textareaCls}
            placeholder={'soundcloud, https://…\nbandcamp, https://…'}
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
          />
        </Field>
        {err ? <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {err}</div> : null}
        <div className="flex gap-3">
          <Btn onClick={save} variant="solid" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { alias } = useParams()
  const { getUserByAlias, producerStats, followerCount, isFollowing, toggleFollow, currentUser, follows } =
    useApp()
  const base = getUserByAlias(alias)
  const [editing, setEditing] = useState(false)

  if (!base) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-24 text-center sm:px-6">
        <div className="font-mono text-sm text-muted">PRODUCER NOT FOUND · {alias}</div>
        <div className="mt-6">
          <Btn to="/battles" variant="ghost">
            Back to battles
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

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
      {/* ARTIST FILE / BANNER */}
      <div className="relative isolate overflow-hidden border border-line bg-panel">
        <span className="hero-bloom" aria-hidden="true" />
        <div className="relative flex items-center justify-between px-6 pt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-faint sm:px-8">
          <span>SMPL Artist File</span>
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
                <span>Member since {fmtMonthYear(user.joinedAt)}</span>
              </div>
              <h1 className="mt-2 font-sans text-[clamp(2.4rem,8vw,4.5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
                {user.alias}
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                <span className="text-ink">◆</span> Identity on file — kept anonymous
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Followers</div>
              <div className="font-mono text-2xl tnum leading-none">{followers}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Following</div>
              <div className="font-mono text-2xl tnum leading-none">{followingCount}</div>
            </div>
            {isSelf ? (
              <button
                onClick={() => setEditing((v) => !v)}
                className="h-12 border border-line-bright px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink"
              >
                {editing ? 'Close' : 'Edit profile'}
              </button>
            ) : (
              <button
                onClick={() => toggleFollow(user.id)}
                className={`h-12 border px-6 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                  following ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
                }`}
              >
                {following ? '✓ Following' : '+ Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EDITOR (self) */}
      {isSelf && editing ? (
        <div className="mt-6">
          <Editor user={user} onClose={() => setEditing(false)} />
        </div>
      ) : null}

      {/* PRIVATE FILE (self only) */}
      {isSelf && hasPrivate ? (
        <Reveal className="mt-6">
          <div className="border border-line-bright bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
                <span>⌧</span> Private file
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Visible only to you</span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
              <PrivateCell label="Legal name" value={user.name} />
              <PrivateCell
                label="Date of birth"
                value={user.dob ? `${user.dob}${age != null ? ` · ${age} yrs` : ''}` : ''}
              />
              <PrivateCell label="Email" value={user.email} />
            </div>
            <div className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">
              Never shown publicly. SMPL verifies your identity and keeps you anonymous to the room.
            </div>
          </div>
        </Reveal>
      ) : null}

      {/* BIO + LINKS */}
      <Reveal className="mt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="border border-line bg-panel p-6 lg:col-span-2">
            <Label>Bio</Label>
            <p className="mt-4 font-sans text-[15px] leading-relaxed text-ink-dim">
              {user.bio ? <Mentions text={user.bio} /> : 'No bio yet.'}
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
            <Label>Links</Label>
            <div className="mt-4 flex flex-col gap-2">
              {user.links?.length ? (
                user.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    className="flex items-center justify-between border border-line px-3 py-2.5 font-mono text-[11px] text-ink transition-colors duration-300 hover:border-line-bright"
                  >
                    <span className="uppercase tracking-[0.12em]">{l.label}</span>
                    <span className="text-muted">↗</span>
                  </a>
                ))
              ) : (
                <span className="font-mono text-[11px] text-muted">No links.</span>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* STATS */}
      <Reveal className="mt-14">
        <SectionHead index="F1" kicker="Career figures" title="Statistics" />
        <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          <StatCell label="Battles" value={stats.played} sub="played" />
          <StatCell label="Won" value={stats.won} sub="first place" />
          <StatCell label="Win ratio" value={`${stats.winRatio}%`} sub={`${stats.won}/${stats.played}`} />
          <StatCell label="Total votes" value={stats.totalVotes} sub="career" />
        </div>
      </Reveal>

      {/* HISTORY */}
      <Reveal className="mt-14">
        <SectionHead index="F2" kicker="The record" title="Battle history" />
        <div className="border border-line bg-panel">
          {stats.history.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                    <th className="px-5 py-3.5 text-left font-normal">Battle</th>
                    <th className="px-5 py-3.5 text-right font-normal">Position</th>
                    <th className="px-5 py-3.5 text-right font-normal">Votes</th>
                    <th className="px-5 py-3.5 text-right font-normal">Date</th>
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
                            <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">on smpl</span>
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
            <p className="px-5 py-6 font-mono text-[12px] text-muted">No battles played yet.</p>
          )}
        </div>
      </Reveal>
    </div>
  )
}
