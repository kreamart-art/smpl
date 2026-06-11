import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Btn, Field, inputCls, textareaCls } from '../components/ui.jsx'
import Avatar from '../components/Avatar.jsx'

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

const ROLES = [
  {
    key: 'producer',
    title: 'Producer',
    blurb: 'Flip the sample, submit beats, build a battle record.',
  },
  {
    key: 'vocalist',
    title: 'Vocalist',
    blurb: 'Drop verses on the beat. Rap or sing — one take, judged blind.',
  },
  {
    key: 'listener',
    title: 'Listener',
    blurb: 'Attend, play the room, cast anonymous votes. No drops needed.',
  },
]

function SectionLabel({ index, title, note }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3.5">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[12px] text-faint tnum">{index}</span>
        <h2 className="font-sans text-lg font-bold uppercase tracking-tight sm:text-xl">{title}</h2>
      </div>
      {note ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{note}</span>
      ) : null}
    </div>
  )
}

export default function Signup() {
  const { signup } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialRole = ['vocalist', 'listener'].includes(params.get('role'))
    ? params.get('role')
    : 'producer'

  const [role, setRole] = useState(initialRole)
  const [form, setForm] = useState({
    alias: '',
    location: '',
    genres: '',
    bio: '',
    avatar: '',
    name: '',
    dob: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const onPickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (file) fileToAvatar(file, (data) => setForm((f) => ({ ...f, avatar: data })))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const r = await signup({ ...form, role })
    if (!r.ok) {
      setError(r.error)
      return
    }
    navigate('/battles')
  }

  return (
    <div className="mx-auto max-w-[840px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">
        SMPL — enrolment
      </div>
      <h1 className="mt-3 font-sans text-[clamp(2.6rem,10vw,5.5rem)] font-bold uppercase leading-[0.82] tracking-tighter">
        Sign up
      </h1>
      <p className="mt-6 max-w-xl font-mono text-[12px] leading-relaxed text-muted">
        Two layers: a <span className="text-ink-dim">public file</span> the room sees, and a{' '}
        <span className="text-ink-dim">private identity</span> only you see. In battle you are only
        your alias — never your name.
      </p>

      <form onSubmit={submit} className="mt-12 space-y-12">
        {/* 01 — ROLE */}
        <div>
          <SectionLabel index="01" title="Choose a role" />
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLES.map((r) => {
              const active = role === r.key
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`group relative overflow-hidden border p-5 text-left transition-colors duration-300 ${
                    active
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line bg-panel text-ink hover:border-line-bright'
                  }`}
                >
                  {!active ? <span className="hover-bloom" aria-hidden="true" /> : null}
                  <div className="relative flex items-center justify-between">
                    <span className="font-sans text-xl font-bold uppercase tracking-tight">
                      {r.title}
                    </span>
                    <span
                      className={`block h-3 w-3 border ${active ? 'border-bg bg-bg' : 'border-line-bright'}`}
                    />
                  </div>
                  <p
                    className={`relative mt-2 font-mono text-[11px] leading-relaxed ${
                      active ? 'text-bg/80' : 'text-muted'
                    }`}
                  >
                    {r.blurb}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 02 — PUBLIC */}
        <div>
          <SectionLabel index="02" title="Public profile" note="Shown on your page" />
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar alias={form.alias || '?'} src={form.avatar} size={56} />
              <label className="cursor-pointer border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg">
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Alias" hint="your @handle">
                <input
                  className={inputCls}
                  placeholder="e.g. null.set"
                  value={form.alias}
                  onChange={set('alias')}
                />
              </Field>
              <Field label="Location" hint="city, country">
                <input
                  className={inputCls}
                  placeholder="Rotterdam, NL"
                  value={form.location}
                  onChange={set('location')}
                />
              </Field>
            </div>
            <Field label="Genres" hint="comma separated">
              <input
                className={inputCls}
                placeholder="boom bap, glitch, lo-fi"
                value={form.genres}
                onChange={set('genres')}
              />
            </Field>
            <Field label="Bio" hint="optional">
              <textarea
                rows={3}
                className={textareaCls}
                placeholder="What do you make, and on what?"
                value={form.bio}
                onChange={set('bio')}
              />
            </Field>
          </div>
        </div>

        {/* 03 — PRIVATE */}
        <div>
          <SectionLabel index="03" title="Private identity" note="Never shown publicly" />
          <div className="border border-line-bright bg-panel">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span className="text-ink">⌧</span>
              Verified on file · kept anonymous — legal name, date of birth & email never reach the
              room.
            </div>
            <div className="space-y-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Legal name" hint="private">
                  <input
                    className={inputCls}
                    placeholder="Your real name"
                    value={form.name}
                    onChange={set('name')}
                  />
                </Field>
                <Field label="Date of birth" hint="private">
                  <input
                    type="date"
                    className={`${inputCls} [color-scheme:dark]`}
                    value={form.dob}
                    onChange={set('dob')}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" hint="private">
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="you@mail.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                </Field>
                <Field label="Password" hint="required · min 4">
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">
            ! {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Btn type="submit" variant="solid" size="lg">
            Create account
          </Btn>
          <span className="font-mono text-[11px] text-muted">
            Already here?{' '}
            <Link to="/login" className="text-ink underline underline-offset-4">
              Login ▸
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}
