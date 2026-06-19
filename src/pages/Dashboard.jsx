import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import Reveal from '../components/Reveal.jsx'
import ReportsPanel from '../components/ReportsPanel.jsx'
import BackupsPanel from '../components/BackupsPanel.jsx'
import SampleLibrary from '../components/SampleLibrary.jsx'
import SampleReviewPanel from '../components/SampleReviewPanel.jsx'
import EditBattleModal from '../components/EditBattleModal.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { STATUS, nextStatus } from '../data/status.js'
import { fmtDate } from '../utils/wave.js'
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
  signupDays: 2,
  submissionDays: 5,
  votingDays: 3,
  startAt: '',
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
    isAdmin,
    currentUser,
    battles,
    battleSubmissions,
    getUser,
    createBattle,
    advanceStatus,
    declareWinner,
    approveSubmission,
    uploadAudio,
    saveBattleDraft,
    fetchBattleDrafts,
    deleteBattleDraft,
  } = app
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [editBattle, setEditBattle] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [draftId, setDraftId] = useState(null) // the draft currently being edited
  const [savingDraft, setSavingDraft] = useState(false)
  // Only SMPL curators organise battles (makers pay a curation fee — phase 2).
  const canHost = isCurator

  useEffect(() => {
    if (!isCurator) return
    let alive = true
    fetchBattleDrafts().then((r) => {
      if (alive && r.ok) setDrafts(r.drafts || [])
    })
    return () => {
      alive = false
    }
  }, [isCurator, fetchBattleDrafts])
  // strict ownership: you only see and manage battles you created yourself
  const myBattles = battles.filter((b) => b.curatorId === currentUser.id)

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
      // durations in days, stacked from the chosen start (default: now)
      const DAY = 86_400_000
      const startMs = form.startAt ? new Date(form.startAt).getTime() : Date.now()
      const base = Number.isFinite(startMs) ? startMs : Date.now()
      const sd = Math.max(1, Math.round(Number(form.signupDays) || 0))
      const subd = Math.max(1, Math.round(Number(form.submissionDays) || 0))
      const vd = Math.max(1, Math.round(Number(form.votingDays) || 0))
      payload.signupStart = base
      payload.submissionsOpen = base + sd * DAY
      payload.votingOpens = base + (sd + subd) * DAY
      payload.votingCloses = base + (sd + subd + vd) * DAY
    }
    const r = await createBattle(payload)
    if (r.ok) {
      // publishing a resumed draft consumes it
      if (draftId) {
        await deleteBattleDraft(draftId)
        setDraftId(null)
        reloadDrafts()
      }
      setForm(empty)
      setStep(1)
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

  const reloadDrafts = async () => {
    const r = await fetchBattleDrafts()
    if (r.ok) setDrafts(r.drafts || [])
  }

  // Save the wizard's current state as a draft (new, or updating the open one).
  const onSaveDraft = async () => {
    setSavingDraft(true)
    const r = await saveBattleDraft(form, draftId)
    setSavingDraft(false)
    if (r.ok) {
      setDraftId(r.draft.id)
      reloadDrafts()
      setMsg({ ok: true, text: t('dashboard.draft.saved') })
    } else {
      setMsg({ ok: false, text: r.error })
    }
  }

  const resumeDraft = (d) => {
    setForm({ ...empty, ...(d.data || {}) })
    setDraftId(d.id)
    setStep(1)
    setMsg(null)
    document.getElementById('create-battle')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const removeDraft = async (id) => {
    const r = await deleteBattleDraft(id)
    if (r.ok) {
      setDrafts((ds) => ds.filter((x) => x.id !== id))
      if (draftId === id) setDraftId(null)
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
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          {currentUser.alias}
          {currentUser.verified ? <VerifiedBadge size={12} /> : null}
        </div>
      </div>

      {msg ? (
        <div className="mt-6 border border-line-bright px-4 py-2.5 font-mono text-[11px] text-ink">
          {msg.ok ? '✓ ' : '! '}
          {msg.text}
        </div>
      ) : null}

      {isCurator ? (
        <div className={`mt-8 border bg-panel px-6 py-6 sm:px-8 ${myBattles.length ? 'border-line' : 'border-line-bright'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('dashboard.cta.kicker')}</div>
              <h2 className="mt-2 font-sans text-[clamp(1.5rem,4vw,2.2rem)] font-bold uppercase leading-tight tracking-tight">
                {myBattles.length ? t('dashboard.cta.title') : t('dashboard.empty.title')}
              </h2>
              <p className="mt-2 max-w-lg font-mono text-[12px] leading-relaxed text-muted">{t('dashboard.cta.body')}</p>
            </div>
            <a
              href="#create-battle"
              className="shrink-0 border border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bg transition-colors hover:bg-bright"
            >
              + {t('dashboard.cta.button')}
            </a>
          </div>
        </div>
      ) : null}

      {isCurator ? (
        <>
          <div className={`mt-8 grid gap-6 ${isAdmin ? 'lg:grid-cols-3' : ''}`}>
            <div className={isAdmin ? 'lg:col-span-2' : ''}>
              <Reveal>
                <ReportsPanel />
              </Reveal>
            </div>
            {isAdmin ? (
              <Reveal>
                <BackupsPanel />
              </Reveal>
            ) : null}
          </div>
          {isAdmin ? (
            <div className="mt-6">
              <Reveal>
                <SampleReviewPanel />
              </Reveal>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* CREATE */}
        <div id="create-battle" className="scroll-mt-24 lg:col-span-2">
          <Reveal>
            <div className="border border-line bg-panel">
              <PanelHead
                index="C1"
                title={t('dashboard.create.title')}
                note={t('dashboard.create.note', { status: t(`status.${STATUS.ANNOUNCED}`) })}
              />
              <form onSubmit={onCreate} className="space-y-5 px-6 py-6">
                <div className="flex flex-wrap items-center gap-1.5 border border-line bg-bg px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  {[STATUS.ANNOUNCED, STATUS.OPEN_FOR_SIGNUP, STATUS.SUBMISSION_PHASE, STATUS.VOTING_PHASE, STATUS.WINNER_DECLARED].map(
                    (st, i) => (
                      <span key={st} className="flex items-center gap-1.5">
                        {i ? <span className="text-faint">→</span> : null}
                        <span>{t(`status.${st}`)}</span>
                      </span>
                    ),
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={n === step ? 'text-ink' : 'text-faint'}>
                        {n} · {t(`dashboard.wizard.step${n}`)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t(`dashboard.wizard.hint${step}`)}</p>
                </div>

                {step === 1 ? (
                  <>
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
                  </>
                ) : null}

                {step === 2 ? (
                  <>
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
                        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.aif,.aiff"
                        className="hidden"
                        onChange={onPickSample}
                        disabled={uploading}
                      />
                    </label>
                    {form.kind === 'BEATS' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setLibOpen(true)}
                          className="border border-line-bright px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                        >
                          ♪ {t('dashboard.create.fromLibrary')}
                        </button>
                        {libOpen ? (
                          <SampleLibrary
                            onClose={() => setLibOpen(false)}
                            onPick={(s) => {
                              setForm((f) => ({ ...f, sampleUrl: s.file, sampleName: s.name, genre: f.genre || s.genre }))
                              setLibOpen(false)
                              setMsg({ ok: true, text: t('dashboard.msg.libraryPicked', { name: s.name }) })
                            }}
                          />
                        ) : null}
                      </>
                    ) : null}
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
                  </>
                ) : null}

                {step === 3 ? (
                  <>
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
                  </>
                ) : null}

                {step === 4 ? (
                  <>
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
                    <div className="mt-3 space-y-4">
                      <Field label={t('dashboard.schedule.startAt')} hint={t('dashboard.schedule.startHint')}>
                        <input
                          type="datetime-local"
                          className={inputCls}
                          value={form.startAt}
                          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                        />
                      </Field>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{t('dashboard.schedule.preset')}</span>
                        {[
                          ['dashboard.schedule.presetQuick', 2, 5, 3],
                          ['dashboard.schedule.presetWeekend', 1, 2, 2],
                          ['dashboard.schedule.presetLong', 3, 7, 5],
                        ].map(([label, s, sub, v]) => (
                          <button
                            type="button"
                            key={label}
                            onClick={() => setForm((f) => ({ ...f, signupDays: s, submissionDays: sub, votingDays: v }))}
                            className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                          >
                            {t(label)}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          ['signupDays', 'dashboard.schedule.signupDays'],
                          ['submissionDays', 'dashboard.schedule.submissionDays'],
                          ['votingDays', 'dashboard.schedule.votingDays'],
                        ].map(([key, label]) => (
                          <Field key={key} label={t(label)}>
                            <input
                              type="number"
                              min={1}
                              max={60}
                              className={inputCls}
                              value={form[key]}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            />
                          </Field>
                        ))}
                      </div>
                      <p className="font-mono text-[10px] leading-relaxed text-muted">
                        {t('dashboard.schedule.summary', {
                          total:
                            (Number(form.signupDays) || 0) +
                            (Number(form.submissionDays) || 0) +
                            (Number(form.votingDays) || 0),
                        })}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('dashboard.create.manualHint')}</p>
                  )}
                </div>
                  </>
                ) : null}

                <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
                  <button
                    type="button"
                    disabled={step === 1}
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    ◂ {t('common.back')}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onSaveDraft}
                      disabled={savingDraft}
                      className="border border-line-bright px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                    >
                      {savingDraft ? '…' : t('dashboard.draft.save')}
                    </button>
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (step === 1 && !form.title.trim()) {
                            setMsg({ ok: false, text: t('dashboard.msg.needTitle') })
                            return
                          }
                          setStep((s) => Math.min(4, s + 1))
                        }}
                        className="border border-ink bg-ink px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright"
                      >
                        {t('dashboard.wizard.next')} ▸
                      </button>
                    ) : (
                      <Btn type="submit" variant="solid">
                        {t('dashboard.create.submit')}
                      </Btn>
                    )}
                  </div>
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-muted">
                  {t('dashboard.create.footnote', { status: t(`status.${STATUS.ANNOUNCED}`) })}
                </p>
              </form>
            </div>
          </Reveal>

          {drafts.length ? (
            <Reveal delay={40}>
              <div className="mt-6 border border-line bg-panel">
                <PanelHead index="C1·" title={t('dashboard.draft.title')} note={t('dashboard.draft.note', { n: drafts.length })} />
                <div className="divide-y divide-line">
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-[15px] font-bold uppercase tracking-tight">
                          {d.data?.title?.trim() || t('dashboard.draft.untitled')}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {d.data?.kind || 'BEATS'} · {t('dashboard.draft.edited', { when: fmtDate(d.updatedAt) })}
                        </div>
                      </div>
                      <button
                        onClick={() => resumeDraft(d)}
                        className="h-9 shrink-0 border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                      >
                        {t('dashboard.draft.resume')}
                      </button>
                      <button
                        onClick={() => removeDraft(d.id)}
                        aria-label={t('common.delete')}
                        className="flex h-9 w-9 shrink-0 items-center justify-center border border-line font-mono text-[11px] text-muted transition-colors hover:text-ink"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}
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
                            onClick={() => setEditBattle(b)}
                            className="h-9 border border-line px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                          >
                            {t('dashboard.manage.edit')}
                          </button>
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
                                      {p ? (
                                        <Link
                                          to={`/profile/${encodeURIComponent(p.alias)}`}
                                          className="flex items-center gap-2 transition-opacity hover:opacity-70"
                                        >
                                          <Avatar alias={p.alias} src={p.avatar} size={24} />
                                          <span className="text-ink">{p.alias}</span>
                                        </Link>
                                      ) : (
                                        <span className="text-ink">{t('dashboard.manage.unknown')}</span>
                                      )}
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
                          <div className="mt-4 border-t border-line pt-3">
                            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                              {t('dashboard.manage.registeredLabel')}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {b.signups.length ? (
                                b.signups.map((id) => {
                                  const u = getUser(id)
                                  if (!u) return null
                                  return (
                                    <Link
                                      key={id}
                                      to={`/profile/${encodeURIComponent(u.alias)}`}
                                      className="flex items-center gap-1.5 border border-line px-2 py-1 transition-colors hover:border-line-bright"
                                    >
                                      <Avatar alias={u.alias} src={u.avatar} size={20} />
                                      <span className="font-mono text-[10px] text-ink">@{u.alias}</span>
                                    </Link>
                                  )
                                })
                              ) : (
                                <span className="font-mono text-[10px] text-muted">—</span>
                              )}
                            </div>
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

      {editBattle ? (
        <EditBattleModal
          battle={editBattle}
          onClose={() => setEditBattle(null)}
          onSaved={() => {
            setEditBattle(null)
            setMsg({ ok: true, text: t('dashboard.manage.editSaved') })
          }}
          onDeleted={() => {
            setEditBattle(null)
            setMsg({ ok: true, text: t('dashboard.manage.deleted') })
          }}
        />
      ) : null}
    </div>
  )
}
