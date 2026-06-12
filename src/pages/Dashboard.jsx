import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Reveal from '../components/Reveal.jsx'
import ReportsPanel from '../components/ReportsPanel.jsx'
import BackupsPanel from '../components/BackupsPanel.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { STATUS, nextStatus } from '../data/status.js'
import { useT } from '../i18n/index.jsx'

const empty = {
  title: '',
  kind: 'BEATS',
  sampleArtist: '',
  sampleSong: '',
  sampleUrl: '',
  sampleName: '',
  maxProducers: 8,
  genre: '',
  description: '',
  sampleRevealed: true,
  blind: false,
  scheduled: false,
  signupStart: '',
  submissionsOpen: '',
  votingOpens: '',
  votingCloses: '',
}

function PanelHead({ index, title, note }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line px-6 py-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-faint tnum">{index}</span>
        <h2 className="font-sans text-lg font-bold uppercase tracking-tight">{title}</h2>
      </div>
      {note ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{note}</span>
      ) : null}
    </div>
  )
}

export default function Dashboard() {
  const t = useT()
  const app = useApp()
  const {
    isCurator,
    currentUser,
    battles,
    battleSubmissions,
    getUser,
    createBattle,
    advanceStatus,
    declareWinner,
    approveSubmission,
    uploadAudio,
  } = app
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [uploading, setUploading] = useState(false)
  // Only SMPL curators organise battles (makers pay a curation fee — phase 2).
  const canHost = isCurator
  const myBattles = battles

  const onPickSample = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 30 * 1024 * 1024) {
      setMsg({ ok: false, text: t('dashboard.msg.over30') })
      e.target.value = ''
      return
    }
    setUploading(true)
    const r = await uploadAudio(file)
    setUploading(false)
    e.target.value = ''
    if (r.ok) {
      setForm((f) => ({ ...f, sampleUrl: r.url, sampleName: file.name }))
      setMsg({ ok: true, text: t('dashboard.msg.uploaded', { name: file.name }) })
    } else {
      setMsg({ ok: false, text: r.error || t('dashboard.msg.uploadFailed') })
    }
  }

  if (!canHost) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-28 text-center sm:px-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">{t('dashboard.restricted.kicker')}</div>
        <h1 className="mt-4 font-sans text-[clamp(2.6rem,9vw,5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {t('dashboard.restricted.title')}
        </h1>
        <p className="mx-auto mt-5 max-w-md font-mono text-[12px] leading-relaxed text-muted">
          {currentUser
            ? t('dashboard.restricted.signedIn', {
                alias: currentUser.alias,
                role: t(`role.${currentUser.role}`),
              })
            : t('dashboard.restricted.anon')}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Btn to="/login" variant="solid" size="lg">
            {t('dashboard.restricted.login')}
          </Btn>
          <Btn to="/battles" variant="ghost" size="lg">
            {t('dashboard.restricted.browse')}
          </Btn>
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-[0.16em] text-faint">curator@smpl.app</p>
      </div>
    )
  }

  const onCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setMsg({ ok: false, text: t('dashboard.msg.needTitle') })
      return
    }
    const payload = { ...form, kind: isCurator ? form.kind : 'VERSES' }
    if (form.scheduled) {
      const toMs = (v) => (v ? new Date(v).getTime() : NaN)
      payload.signupStart = toMs(form.signupStart)
      payload.submissionsOpen = toMs(form.submissionsOpen)
      payload.votingOpens = toMs(form.votingOpens)
      payload.votingCloses = toMs(form.votingCloses)
      if (
        [payload.signupStart, payload.submissionsOpen, payload.votingOpens, payload.votingCloses].some(
          (x) => !Number.isFinite(x),
        )
      ) {
        setMsg({ ok: false, text: t('dashboard.schedule.fillAll') })
        return
      }
    }
    const r = await createBattle(payload)
    if (r.ok) {
      setForm(empty)
      setMsg({
        ok: true,
        text: t('dashboard.msg.created', {
          title: r.battle.title,
          status: t(`status.${r.battle.status}`),
        }),
      })
    } else {
      setMsg({ ok: false, text: r.error })
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono text-[13px] text-faint tnum">C0</span>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
              {t(isCurator ? 'dashboard.console.kicker' : 'host.console')}
            </div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              {t('dashboard.console.title')}
            </h1>
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          {currentUser.alias}
        </div>
      </div>

      {msg ? (
        <div className="mt-6 border border-line-bright px-4 py-2.5 font-mono text-[11px] text-ink">
          {msg.ok ? '✓ ' : '! '}
          {msg.text}
        </div>
      ) : null}

      {isCurator ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <ReportsPanel />
            </Reveal>
          </div>
          <Reveal>
            <BackupsPanel />
          </Reveal>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* CREATE */}
        <div className="lg:col-span-2">
          <Reveal>
            <div className="border border-line bg-panel">
              <PanelHead
                index="C1"
                title={t('dashboard.create.title')}
                note={t('dashboard.create.note', { status: t(`status.${STATUS.ANNOUNCED}`) })}
              />
              <form onSubmit={onCreate} className="space-y-5 px-6 py-6">
                <Field label={t('dashboard.create.fieldTitle')}>
                  <input
                    className={inputCls}
                    placeholder={t('dashboard.create.fieldTitlePlaceholder')}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </Field>
                <div>
                  <Label>{t('dashboard.create.type')}</Label>
                  {isCurator ? (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {['BEATS', 'VERSES'].map((k) => (
                        <button
                          type="button"
                          key={k}
                          onClick={() => setForm({ ...form, kind: k })}
                          className={`border px-3 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                            form.kind === k
                              ? 'border-ink bg-ink text-bg'
                              : 'border-line text-muted hover:border-line-bright hover:text-ink'
                          }`}
                        >
                          {k === 'VERSES' ? `✎ ${t('kind.VERSES')}` : `≋ ${t('kind.BEATS')}`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 border border-line-bright bg-bg px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
                      ✎ {t('kind.VERSES')} · {t('host.openVerse')}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label={
                      form.kind === 'VERSES'
                        ? t('dashboard.create.beatBy')
                        : t('dashboard.create.sampleArtist')
                    }
                  >
                    <input
                      className={inputCls}
                      placeholder={t('dashboard.create.artistPlaceholder')}
                      value={form.sampleArtist}
                      onChange={(e) => setForm({ ...form, sampleArtist: e.target.value })}
                    />
                  </Field>
                  <Field
                    label={
                      form.kind === 'VERSES'
                        ? t('dashboard.create.beatTitle')
                        : t('dashboard.create.sampleTrack')
                    }
                  >
                    <input
                      className={inputCls}
                      placeholder={t('dashboard.create.songPlaceholder')}
                      value={form.sampleSong}
                      onChange={(e) => setForm({ ...form, sampleSong: e.target.value })}
                    />
                  </Field>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <Label>
                      {form.kind === 'VERSES'
                        ? t('dashboard.create.theBeatAudio')
                        : t('dashboard.create.sampleAudio')}
                    </Label>
                    <span className="font-mono text-[10px] text-muted">{t('dashboard.create.audioHint')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label
                      className={`cursor-pointer border border-line-bright px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg ${
                        uploading ? 'pointer-events-none opacity-40' : ''
                      }`}
                    >
                      {uploading
                        ? t('dashboard.create.uploading')
                        : form.sampleUrl
                          ? t('dashboard.create.replace')
                          : t('dashboard.create.upload')}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={onPickSample}
                        disabled={uploading}
                      />
                    </label>
                    {form.sampleUrl ? (
                      <span className="flex items-center gap-2 font-mono text-[11px] text-ink">
                        <span className="text-muted">✓</span>
                        <span className="max-w-[170px] truncate">{form.sampleName || t('dashboard.create.uploadedFallback')}</span>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, sampleUrl: '', sampleName: '' }))}
                          className="text-muted hover:text-ink"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted">
                        {t('dashboard.create.audioHelp')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label={t('dashboard.create.maxProducers')}>
                    <input
                      type="number"
                      min={2}
                      max={64}
                      className={inputCls}
                      value={form.maxProducers}
                      onChange={(e) => setForm({ ...form, maxProducers: e.target.value })}
                    />
                  </Field>
                  <Field label={t('host.genre')} hint={t('host.genreHint')}>
                    <input
                      className={inputCls}
                      placeholder="trap · drill · boom bap"
                      value={form.genre}
                      onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label={t('dashboard.create.description')}>
                  <textarea
                    rows={3}
                    className={textareaCls}
                    placeholder={t('dashboard.create.descriptionPlaceholder')}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
                  <input
                    type="checkbox"
                    checked={form.sampleRevealed}
                    onChange={(e) => setForm({ ...form, sampleRevealed: e.target.checked })}
                    className="h-4 w-4 accent-white"
                  />
                  {t('dashboard.create.revealNow')}
                </label>

                <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
                  <input
                    type="checkbox"
                    checked={form.blind}
                    onChange={(e) => setForm({ ...form, blind: e.target.checked })}
                    className="h-4 w-4 accent-white"
                  />
                  {t('dashboard.create.blind')}
                </label>
                {form.blind ? (
                  <p className="-mt-3 font-mono text-[10px] leading-relaxed text-muted">{t('dashboard.create.blindHint')}</p>
                ) : null}

                <div className="border-t border-line pt-5">
                  <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
                    <input
                      type="checkbox"
                      checked={form.scheduled}
                      onChange={(e) => setForm({ ...form, scheduled: e.target.checked })}
                      className="h-4 w-4 accent-white"
                    />
                    {t('dashboard.create.scheduled')}
                  </label>
                  {form.scheduled ? (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        ['signupStart', 'dashboard.schedule.signupOpens'],
                        ['submissionsOpen', 'dashboard.schedule.submissionsOpen'],
                        ['votingOpens', 'dashboard.schedule.votingOpens'],
                        ['votingCloses', 'dashboard.schedule.votingCloses'],
                      ].map(([key, label]) => (
                        <Field key={key} label={t(label)}>
                          <input
                            type="datetime-local"
                            className={inputCls}
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          />
                        </Field>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('dashboard.create.manualHint')}</p>
                  )}
                </div>

                <Btn type="submit" variant="solid" size="lg" full>
                  {t('dashboard.create.submit')}
                </Btn>
                <p className="font-mono text-[10px] leading-relaxed text-muted">
                  {t('dashboard.create.footnote', { status: t(`status.${STATUS.ANNOUNCED}`) })}
                </p>
              </form>
            </div>
          </Reveal>
        </div>

        {/* MANAGE */}
        <div className="lg:col-span-3">
          <Reveal delay={80}>
            <div className="border border-line bg-panel">
              <PanelHead
                index="C2"
                title={t('dashboard.manage.title')}
                note={t('dashboard.manage.note', { n: myBattles.length })}
              />
              <div className="divide-y divide-line">
                {myBattles.length === 0 ? (
                  <p className="px-6 py-8 font-mono text-[12px] text-muted">{t('host.noneYet')}</p>
                ) : null}
                {myBattles.map((b) => {
                  const subs = battleSubmissions(b.id)
                  const isOpen = openId === b.id
                  const atEnd = b.status === STATUS.WINNER_DECLARED
                  return (
                    <div key={b.id} className="px-6 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/battles/${b.id}`}
                            className="font-sans text-lg font-bold uppercase tracking-tight transition-colors hover:text-muted"
                          >
                            {b.title}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <StatusBadge status={b.status} size="sm" />
                            <span className="font-mono text-[10px] text-muted">
                              {t('dashboard.manage.counts', {
                                p: b.signups.length,
                                max: b.maxProducers,
                                n: subs.length,
                                a: b.attendees.length,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!atEnd ? (
                            <button
                              onClick={() => advanceStatus(b.id)}
                              className="h-9 border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                              title={`→ ${t(`status.${nextStatus(b.status)}`)}`}
                            >
                              ▸ {t(`status.${nextStatus(b.status)}`)}
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                              {t('dashboard.manage.resolved')}
                            </span>
                          )}
                          <button
                            onClick={() => setOpenId(isOpen ? null : b.id)}
                            className="h-9 border border-line px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                          >
                            {isOpen ? t('dashboard.manage.hide') : t('dashboard.manage.manage')}
                          </button>
                        </div>
                      </div>

                      {isOpen ? (
                        <div className="mt-4 border border-line bg-bg p-4">
                          <Label>{t('dashboard.manage.participants')}</Label>
                          <div className="mt-3 space-y-2">
                            {subs.length ? (
                              subs.map((s) => {
                                const p = getUser(s.producerId)
                                const isWinner = b.winnerSubmissionId === s.id
                                return (
                                  <div
                                    key={s.id}
                                    className="flex flex-wrap items-center justify-between gap-2 border border-line px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 font-mono text-[11px]">
                                      <span className="text-ink">{p?.alias || t('dashboard.manage.unknown')}</span>
                                      {isWinner ? <span className="text-ink">★</span> : null}
                                      <span className={s.approved ? 'text-muted' : 'text-ink'}>
                                        {s.approved
                                          ? t('dashboard.manage.approved')
                                          : t('dashboard.manage.pending')}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => approveSubmission(s.id)}
                                        className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                                      >
                                        {s.approved
                                          ? t('dashboard.manage.unapprove')
                                          : t('dashboard.manage.approve')}
                                      </button>
                                      {b.status === STATUS.VOTING_PHASE ||
                                      b.status === STATUS.WINNER_DECLARED ? (
                                        <button
                                          onClick={() => declareWinner(b.id, s.id)}
                                          className={`h-7 border px-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                                            isWinner
                                              ? 'border-ink bg-ink text-bg'
                                              : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
                                          }`}
                                        >
                                          {isWinner
                                            ? t('dashboard.manage.winner')
                                            : t('dashboard.manage.declareWinner')}
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <p className="font-mono text-[11px] text-muted">{t('dashboard.manage.noSubmissions')}</p>
                            )}
                          </div>
                          <div className="mt-3 font-mono text-[10px] text-muted">
                            {t('dashboard.manage.registered', {
                              names:
                                b.signups.map((id) => getUser(id)?.alias).filter(Boolean).join(', ') ||
                                '—',
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
