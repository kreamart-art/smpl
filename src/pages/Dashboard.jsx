import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Reveal from '../components/Reveal.jsx'
import { Btn, Label, Field, inputCls, textareaCls } from '../components/ui.jsx'
import { STATUS, STATUS_LABEL, nextStatus } from '../data/status.js'

const empty = {
  title: '',
  kind: 'BEATS',
  sampleArtist: '',
  sampleSong: '',
  maxProducers: 8,
  description: '',
  sampleRevealed: true,
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
  } = app
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState(null)
  const [openId, setOpenId] = useState(null)

  if (!isCurator) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-28 text-center sm:px-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">Restricted</div>
        <h1 className="mt-4 font-sans text-[clamp(2.6rem,9vw,5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          Curator only
        </h1>
        <p className="mx-auto mt-5 max-w-md font-mono text-[12px] leading-relaxed text-muted">
          {currentUser
            ? `Signed in as ${currentUser.alias} (${currentUser.role}). The console is reserved for curators.`
            : 'You need the curator account to run battles.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Btn to="/login" variant="solid" size="lg">
            Login as curator
          </Btn>
          <Btn to="/battles" variant="ghost" size="lg">
            Browse battles
          </Btn>
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-[0.16em] text-faint">curator@smpl.app</p>
      </div>
    )
  }

  const onCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setMsg({ ok: false, text: 'Give the battle a title.' })
      return
    }
    const r = await createBattle(form)
    if (r.ok) {
      setForm(empty)
      setMsg({ ok: true, text: `Created "${r.battle.title}" — now in ANNOUNCED.` })
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
              Curator console
            </div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Dashboard
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

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* CREATE */}
        <div className="lg:col-span-2">
          <Reveal>
            <div className="border border-line bg-panel">
              <PanelHead index="C1" title="Create battle" note="→ Announced" />
              <form onSubmit={onCreate} className="space-y-5 px-6 py-6">
                <Field label="Title">
                  <input
                    className={inputCls}
                    placeholder="GHOST IN THE BREAK"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </Field>
                <div>
                  <Label>Type</Label>
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
                        {k === 'VERSES' ? '✎ Verses' : '≋ Beats'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label={form.kind === 'VERSES' ? 'Beat by' : 'Sample artist'}>
                    <input
                      className={inputCls}
                      placeholder="Dorothy Ashby"
                      value={form.sampleArtist}
                      onChange={(e) => setForm({ ...form, sampleArtist: e.target.value })}
                    />
                  </Field>
                  <Field label={form.kind === 'VERSES' ? 'Beat title' : 'Sample track'}>
                    <input
                      className={inputCls}
                      placeholder="Soul Vibrations"
                      value={form.sampleSong}
                      onChange={(e) => setForm({ ...form, sampleSong: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Max producers">
                  <input
                    type="number"
                    min={2}
                    max={64}
                    className={inputCls}
                    value={form.maxProducers}
                    onChange={(e) => setForm({ ...form, maxProducers: e.target.value })}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={3}
                    className={textareaCls}
                    placeholder="What's the brief?"
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
                  Reveal sample immediately
                </label>
                <Btn type="submit" variant="solid" size="lg" full>
                  Create battle
                </Btn>
                <p className="font-mono text-[10px] leading-relaxed text-muted">
                  New battles start in ANNOUNCED. Push them forward below.
                </p>
              </form>
            </div>
          </Reveal>
        </div>

        {/* MANAGE */}
        <div className="lg:col-span-3">
          <Reveal delay={80}>
            <div className="border border-line bg-panel">
              <PanelHead index="C2" title="Manage battles" note={`${battles.length} total`} />
              <div className="divide-y divide-line">
                {battles.map((b) => {
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
                              {b.signups.length}/{b.maxProducers} prod · {subs.length} beats ·{' '}
                              {b.attendees.length} here
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!atEnd ? (
                            <button
                              onClick={() => advanceStatus(b.id)}
                              className="h-9 border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                              title={`→ ${STATUS_LABEL[nextStatus(b.status)]}`}
                            >
                              ▸ {STATUS_LABEL[nextStatus(b.status)]}
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                              Resolved
                            </span>
                          )}
                          <button
                            onClick={() => setOpenId(isOpen ? null : b.id)}
                            className="h-9 border border-line px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                          >
                            {isOpen ? 'Hide' : 'Manage'}
                          </button>
                        </div>
                      </div>

                      {isOpen ? (
                        <div className="mt-4 border border-line bg-bg p-4">
                          <Label>Participants</Label>
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
                                      <span className="text-ink">{p?.alias || 'unknown'}</span>
                                      {isWinner ? <span className="text-ink">★</span> : null}
                                      <span className={s.approved ? 'text-muted' : 'text-ink'}>
                                        {s.approved ? '· approved' : '· pending'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => approveSubmission(s.id)}
                                        className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line-bright hover:text-ink"
                                      >
                                        {s.approved ? 'Unapprove' : 'Approve'}
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
                                          {isWinner ? '★ Winner' : 'Declare winner'}
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <p className="font-mono text-[11px] text-muted">No submissions yet.</p>
                            )}
                          </div>
                          <div className="mt-3 font-mono text-[10px] text-muted">
                            Registered:{' '}
                            {b.signups.map((id) => getUser(id)?.alias).filter(Boolean).join(', ') ||
                              '—'}
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
