import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
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
    titleKey: 'role.producer',
    blurbKey: 'auth.signup.roleProducerBlurb',
  },
  {
    key: 'artist',
    titleKey: 'role.artist',
    blurbKey: 'auth.signup.roleArtistBlurb',
  },
  {
    key: 'listener',
    titleKey: 'role.listener',
    blurbKey: 'auth.signup.roleListenerBlurb',
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
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialRole = ['artist', 'listener'].includes(params.get('role'))
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
        {t('auth.signup.eyebrow')}
      </div>
      <h1 className="mt-3 font-sans text-[clamp(2.6rem,10vw,5.5rem)] font-bold uppercase leading-[0.82] tracking-tighter">
        {t('common.signup')}
      </h1>
      <p className="mt-6 max-w-xl font-mono text-[12px] leading-relaxed text-muted">
        {t('auth.signup.intro1')} <span className="text-ink-dim">{t('auth.signup.introPublic')}</span> {t('auth.signup.intro2')}{' '}
        <span className="text-ink-dim">{t('auth.signup.introPrivate')}</span> {t('auth.signup.intro3')}
      </p>

      <form onSubmit={submit} className="mt-12 space-y-12">
        {/* 01 — ROLE */}
        <div>
          <SectionLabel index="01" title={t('auth.signup.roleTitle')} />
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
                      {t(r.titleKey)}
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
                    {t(r.blurbKey)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 02 — PUBLIC */}
        <div>
          <SectionLabel index="02" title={t('auth.signup.publicTitle')} note={t('auth.signup.publicNote')} />
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar alias={form.alias || '?'} src={form.avatar} size={56} />
              <label className="cursor-pointer border border-line-bright px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg">
                {t('auth.signup.uploadPhoto')}
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </label>
              {form.avatar ? (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, avatar: '' })}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
                >
                  {t('auth.signup.removePhoto')}
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t('auth.field.alias')} hint={t('auth.field.aliasHint')}>
                <input
                  className={inputCls}
                  placeholder={t('auth.field.aliasPlaceholder')}
                  value={form.alias}
                  onChange={set('alias')}
                />
              </Field>
              <Field label={t('auth.field.location')} hint={t('auth.field.locationHint')}>
                <input
                  className={inputCls}
                  placeholder={t('auth.field.locationPlaceholder')}
                  value={form.location}
                  onChange={set('location')}
                />
              </Field>
            </div>
            <Field label={t('auth.field.genres')} hint={t('auth.field.genresHint')}>
              <input
                className={inputCls}
                placeholder={t('auth.field.genresPlaceholder')}
                value={form.genres}
                onChange={set('genres')}
              />
            </Field>
            <Field label={t('auth.field.bio')} hint={t('auth.field.bioHint')}>
              <textarea
                rows={3}
                className={textareaCls}
                placeholder={t('auth.field.bioPlaceholder')}
                value={form.bio}
                onChange={set('bio')}
              />
            </Field>
          </div>
        </div>

        {/* 03 — PRIVATE */}
        <div>
          <SectionLabel index="03" title={t('auth.signup.privateTitle')} note={t('auth.signup.privateNote')} />
          <div className="border border-line-bright bg-panel">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span className="text-ink">⌧</span>
              {t('auth.signup.privateBanner')}
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label={t('auth.field.legalName')} hint={t('auth.field.legalNameHint')}>
                  <input
                    className={inputCls}
                    placeholder={t('auth.field.legalNamePlaceholder')}
                    value={form.name}
                    onChange={set('name')}
                  />
                </Field>
                <Field label={t('auth.field.dob')} hint={t('auth.field.dobHint')}>
                  <input
                    type="date"
                    className={`${inputCls} [color-scheme:dark]`}
                    value={form.dob}
                    onChange={set('dob')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label={t('auth.field.email')} hint={t('auth.field.emailPrivateHint')}>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder={t('auth.field.emailPrivatePlaceholder')}
                    value={form.email}
                    onChange={set('email')}
                  />
                </Field>
                <Field label={t('auth.field.password')} hint={t('auth.field.passwordSignupHint')}>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder={t('auth.field.passwordPlaceholder')}
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
            {t('auth.signup.create')}
          </Btn>
          <span className="font-mono text-[11px] text-muted">
            {t('auth.signup.already')}{' '}
            <Link to="/login" className="text-ink underline underline-offset-4">
              {t('auth.loginArrow')}
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}
