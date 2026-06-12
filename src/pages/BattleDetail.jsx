import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import BeatPlayer from '../components/BeatPlayer.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ShareButton from '../components/ShareButton.jsx'
import { CountdownBlocks } from '../components/Countdown.jsx'
import { Btn, Label, Field, inputCls } from '../components/ui.jsx'
import { STATUS, STATUS_ORDER, STATUS_INDEX, countdownTarget } from '../data/status.js'
import { shuffleSeeded, fmtDate } from '../utils/wave.js'
import { kindCopy } from '../data/kind.js'
import KindBadge from '../components/KindBadge.jsx'
import { useT } from '../i18n/index.jsx'

// Countdown caption per status → battleDetail.cd.* key (mirrors countdownTarget).
const CD_KEY = {
  [STATUS.ANNOUNCED]: 'battleDetail.cd.signupOpens',
  [STATUS.OPEN_FOR_SIGNUP]: 'battleDetail.cd.signupCloses',
  [STATUS.SUBMISSION_PHASE]: 'battleDetail.cd.submissionsClose',
  [STATUS.VOTING_PHASE]: 'battleDetail.cd.votingCloses',
  [STATUS.WINNER_DECLARED]: 'battleDetail.cd.closed',
}

function PhasePipeline({ status }) {
  const t = useT()
  const cur = STATUS_INDEX[status]
  return (
    <div className="grid grid-cols-5 gap-px border border-line bg-line">
      {STATUS_ORDER.map((s, i) => {
        const idx = i + 1
        const done = idx < cur
        const active = idx === cur
        return (
          <div
            key={s}
            className={`bg-bg px-2 py-2 text-center ${active ? 'bg-ink text-bg' : ''}`}
          >
            <div className={`font-mono text-[9px] tnum ${done ? 'text-ink' : active ? 'text-bg' : 'text-muted'}`}>
              {String(idx).padStart(2, '0')}
            </div>
            <div
              className={`mt-1 font-mono text-[8px] uppercase leading-tight tracking-[0.1em] ${
                active ? 'text-bg' : done ? 'text-ink' : 'text-muted'
              }`}
            >
              {t(`status.${s}`).split(' ')[0]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Only drive the real <audio> element from URLs that are actually playable
// audio files (our uploads, or a direct file link) — not SoundCloud/YouTube pages.
const playableAudio = (u) =>
  !!u && (u.startsWith('/api/uploads/') || /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(u))

function Feedback({ msg }) {
  if (!msg) return null
  return (
    <div
      className={`border px-3 py-2 font-mono text-[11px] ${
        msg.ok ? 'border-line text-ink' : 'border-line-bright text-ink'
      }`}
    >
      {msg.ok ? '✓ ' : '! '}
      {msg.text}
    </div>
  )
}

export default function BattleDetail() {
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const app = useApp()
  const {
    getBattle,
    getUser,
    battleSubmissions,
    currentUser,
    toggleAttendee,
    registerProducer,
    submitBeat,
    castVote,
    userVoteInBattle,
    rankedSubmissions,
    voteCount,
  } = app

  const battle = getBattle(id)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ audioUrl: '', soundcloudUrl: '', youtubeUrl: '' })

  const approvedSubs = useMemo(
    () => (battle ? battleSubmissions(battle.id).filter((s) => s.approved) : []),
    [battle, battleSubmissions],
  )

  // Stable anonymised order for the voting phase.
  const shuffled = useMemo(
    () => (battle ? shuffleSeeded(approvedSubs, `vote-${battle.id}`) : []),
    [approvedSubs, battle],
  )

  if (!battle) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-24 text-center sm:px-6">
        <div className="font-mono text-sm text-muted">{t('battleDetail.notFound', { id })}</div>
        <div className="mt-6">
          <Btn to="/battles" variant="ghost">{t('battleDetail.backToBattles')}</Btn>
        </div>
      </div>
    )
  }

  const { ts } = countdownTarget(battle)
  const curator = getUser(battle.curatorId)
  const c = kindCopy(battle.kind)
  const attending = currentUser && battle.attendees.includes(currentUser.id)
  const isRegistered = currentUser && battle.signups.includes(currentUser.id)
  const myVote = currentUser ? userVoteInBattle(battle.id, currentUser.id) : null

  const sampleMeta = {
    id: `sample-${battle.id}`,
    label: battle.sampleRevealed ? `${battle.sampleArtist} — ${battle.sampleSong}` : t('battleDetail.sealedSample'),
    sub: battle.title,
    duration: battle.sampleDuration || 10,
    seed: `sample-${battle.id}`,
    src: battle.sampleRevealed && playableAudio(battle.sampleUrl) ? battle.sampleUrl : undefined,
  }

  const beatMeta = (s, idx, revealed) => ({
    id: `beat-${s.id}`,
    label: revealed ? getUser(s.producerId)?.alias || t('battleDetail.unknown') : `${c.drop.toUpperCase()} #${idx}`,
    sub: battle.title,
    duration: s.duration || battle.sampleDuration || 15,
    seed: s.id,
  })

  const requireLogin = (action) => {
    setMsg({ ok: false, text: t('battleDetail.fb.loginTo', { action: t(`battleDetail.fb.action.${action}`) }) })
  }

  const onAttend = async () => {
    if (!currentUser) return requireLogin('attend')
    const r = await toggleAttendee(battle.id)
    if (!r.ok) setMsg({ ok: false, text: r.error })
    else setMsg(null)
  }

  const onRegister = async () => {
    if (!currentUser) return requireLogin('slot')
    const r = await registerProducer(battle.id)
    setMsg(r.ok ? { ok: true, text: t('battleDetail.fb.slotClaimed') } : { ok: false, text: r.error })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const r = await submitBeat(battle.id, form)
    setMsg(
      r.ok
        ? { ok: true, text: r.updated ? t('battleDetail.fb.submissionUpdated') : t('battleDetail.fb.beatSubmitted') }
        : { ok: false, text: r.error },
    )
  }

  const onVote = async (submissionId) => {
    if (!currentUser) return requireLogin('vote')
    const r = await castVote(battle.id, submissionId)
    setMsg(r.ok ? { ok: true, text: t('battleDetail.fb.voteCast') } : { ok: false, text: r.error })
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <Link to="/battles" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
        {t('battleDetail.allBattles')}
      </Link>

      {/* HEADER */}
      <div className="relative mt-6 border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <StatusBadge status={battle.status} size="lg" />
            <KindBadge kind={battle.kind} size="md" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('battleDetail.hereNow')}</div>
              <div className="font-mono text-lg tnum leading-none">{battle.attendees.length}</div>
            </div>
            <button
              onClick={onAttend}
              className={`border px-4 h-10 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                attending ? 'bg-ink text-bg border-ink' : 'border-line-bright text-ink hover:border-ink'
              }`}
            >
              {attending ? t('battleDetail.attending') : t('battleDetail.attend')}
            </button>
            <ShareButton
              iconOnly
              className="h-10 w-10"
              title={t('battleDetail.shareTitle', { title: battle.title })}
              text={t('battleDetail.shareText', { title: battle.title })}
            />
          </div>
        </div>

        <div className="px-6 py-9 sm:px-8 sm:py-12">
          <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            <span>SMPL·{battle.id.toUpperCase()}</span>
            <span className="h-px w-8 bg-line-bright" />
            <span className="text-muted">{t('battleDetail.curatedBy', { alias: curator?.alias || 'SMPL' })}</span>
          </div>
          <h1 className="font-sans text-[clamp(2.6rem,8vw,6rem)] font-bold uppercase leading-[0.82] tracking-tighter">
            {battle.title}
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-[13px] leading-relaxed text-muted">
            {battle.description}
          </p>
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <PhasePipeline status={battle.status} />
        </div>
      </div>

      {/* SAMPLE — always visible */}
      <div className="mt-4">
        <Label className="mb-2">
          {t(`battleDetail.sampleCaption.${battle.kind}`)}
        </Label>
        <AudioPlayer meta={sampleMeta} sealed={!battle.sampleRevealed} />
      </div>

      {/* META GRID */}
      <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          [t('battleDetail.meta.curator'), curator?.alias || '—'],
          [t('battleDetail.meta.slots'), `${battle.signups.length} / ${battle.maxProducers}`],
          [
            battle.kind === 'VERSES' ? t('battleDetail.meta.versesIn') : t('battleDetail.meta.beatsIn'),
            String(approvedSubs.length),
          ],
          [t(CD_KEY[battle.status]), ts ? fmtDate(ts) : t('battleDetail.meta.closed')],
        ].map(([k, v]) => (
          <div key={k} className="bg-bg px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">{k}</div>
            <div className="mt-1 font-mono text-sm text-ink truncate">{v}</div>
          </div>
        ))}
      </div>

      {msg ? <div className="mt-4"><Feedback msg={msg} /></div> : null}

      {/* COUNTDOWN */}
      {ts ? (
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border border-line bg-panel p-5">
          <CountdownBlocks to={ts} label={t(CD_KEY[battle.status])} />
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {t(`status.${battle.status}`)}
          </div>
        </div>
      ) : null}

      {/* PHASE PANEL */}
      <div className="mt-6">
        {battle.status === STATUS.ANNOUNCED && (
          <PhaseBox title={t('battleDetail.announced.title')} sub={t('battleDetail.announced.sub')}>
            <p className="font-mono text-[12px] leading-relaxed text-muted">
              {t('battleDetail.announced.bodyBefore')}
              <span className="text-ink">{attending ? t('battleDetail.attending') : t('battleDetail.attend')}</span>
              {t(`battleDetail.announced.bodyAfter.${battle.kind}`)}
            </p>
          </PhaseBox>
        )}

        {battle.status === STATUS.OPEN_FOR_SIGNUP && (
          <PhaseBox
            title={t('battleDetail.signup.title')}
            sub={t('battleDetail.signup.sub', {
              left: battle.maxProducers - battle.signups.length,
              max: battle.maxProducers,
            })}
          >
            <p className="mb-4 font-mono text-[12px] leading-relaxed text-muted">
              {t(`battleDetail.signup.brief.${battle.kind}`)}
            </p>
            {isRegistered ? (
              <div className="border border-ink px-4 py-3 font-mono text-[12px] text-ink">
                {t('battleDetail.signup.registered')}
              </div>
            ) : (
              <Btn onClick={onRegister} variant="solid" size="lg">
                {t(`battleDetail.signup.claim.${battle.kind}`)}
              </Btn>
            )}
            {currentUser && currentUser.role !== c.competitor && !isRegistered ? (
              <p className="mt-3 font-mono text-[10px] text-muted">
                {t(`battleDetail.signup.listenersNote.${battle.kind}`)}
              </p>
            ) : null}
          </PhaseBox>
        )}

        {battle.status === STATUS.SUBMISSION_PHASE && (
          <PhaseBox
            title={t('battleDetail.submission.title')}
            sub={t(`battleDetail.submission.sub.${battle.kind}`, { n: approvedSubs.length })}
          >
            {isRegistered ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="font-mono text-[12px] leading-relaxed text-muted">
                  {t(`battleDetail.submission.brief.${battle.kind}`)}
                </p>
                <Field label={t('battleDetail.submission.field.audio')} hint={t('battleDetail.submission.hint.optional')}>
                  <input
                    className={inputCls}
                    placeholder="https://…"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('battleDetail.submission.field.soundcloud')} hint={t('battleDetail.submission.hint.optional')}>
                    <input
                      className={inputCls}
                      placeholder="soundcloud.com/…"
                      value={form.soundcloudUrl}
                      onChange={(e) => setForm({ ...form, soundcloudUrl: e.target.value })}
                    />
                  </Field>
                  <Field label={t('battleDetail.submission.field.youtube')} hint={t('battleDetail.submission.hint.optional')}>
                    <input
                      className={inputCls}
                      placeholder="youtu.be/…"
                      value={form.youtubeUrl}
                      onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                    />
                  </Field>
                </div>
                <Btn type="submit" variant="solid" size="lg">{t(`battleDetail.submission.submit.${battle.kind}`)}</Btn>
              </form>
            ) : (
              <p className="font-mono text-[12px] leading-relaxed text-muted">
                {t(`battleDetail.submission.waiting.${battle.kind}`)}
              </p>
            )}
          </PhaseBox>
        )}

        {battle.status === STATUS.VOTING_PHASE && (
          <PhaseBox
            title={t('battleDetail.voting.title')}
            sub={t('battleDetail.voting.sub')}
          >
            {!currentUser ? (
              <div className="mb-4 border border-line-bright px-4 py-3 font-mono text-[11px] text-ink">
                {t('battleDetail.voting.loginToVote')} <Link to="/login" className="underline">{t('battleDetail.voting.loginLink')}</Link>
              </div>
            ) : myVote ? (
              <div className="mb-4 border border-ink px-4 py-3 font-mono text-[11px] text-ink">
                {t('battleDetail.voting.voteIn')}
              </div>
            ) : null}

            <div className="space-y-3">
              {shuffled.map((s, i) => {
                const index = i + 1
                const meta = beatMeta(s, index, false)
                const isOwn = s.mine
                const votedThis = myVote && myVote.submissionId === s.id
                let btn
                if (votedThis) {
                  btn = (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                      {t('common.voted')}
                    </span>
                  )
                } else if (isOwn) {
                  btn = (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {t('battleDetail.voting.yourBeat')}
                    </span>
                  )
                } else {
                  btn = (
                    <button
                      onClick={() => onVote(s.id)}
                      disabled={!!myVote}
                      className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        myVote
                          ? 'border-line text-muted opacity-40 pointer-events-none'
                          : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
                      }`}
                    >
                      {t('common.vote')}
                    </button>
                  )
                }
                return (
                  <BeatPlayer key={s.id} meta={meta} index={index} noun={c.drop.toUpperCase()} rightSlot={btn} />
                )
              })}
              {!shuffled.length ? (
                <p className="font-mono text-[12px] text-muted">{t('battleDetail.voting.empty')}</p>
              ) : null}
            </div>
          </PhaseBox>
        )}

        {battle.status === STATUS.WINNER_DECLARED && (
          <PhaseBox title={t('battleDetail.winner.title')} sub={t('battleDetail.winner.sub')}>
            <div className="space-y-3">
              {rankedSubmissions(battle.id).map((s, i) => {
                const rank = i + 1
                const meta = beatMeta(s, rank, true)
                const isWinner = battle.winnerSubmissionId
                  ? s.id === battle.winnerSubmissionId
                  : rank === 1
                return (
                  <BeatPlayer
                    key={s.id}
                    meta={meta}
                    index={rank}
                    noun={c.drop.toUpperCase()}
                    rank={rank}
                    revealed
                    alias={getUser(s.producerId)?.alias}
                    votes={voteCount(s.id)}
                    showVotes
                    isWinner={isWinner}
                  />
                )
              })}
            </div>
          </PhaseBox>
        )}
      </div>
    </div>
  )
}

function PhaseBox({ title, sub, children }) {
  return (
    <div className="border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
        <h2 className="font-sans text-lg font-semibold uppercase tracking-tight">{title}</h2>
        {sub ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{sub}</span> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}
