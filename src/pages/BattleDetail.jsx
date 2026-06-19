import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import BeatPlayer from '../components/BeatPlayer.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import ShareButton from '../components/ShareButton.jsx'
import ShareToDM from '../components/ShareToDM.jsx'
import { ReportButton } from '../components/Safety.jsx'
import CommentThread from '../components/CommentThread.jsx'
import CrateButton from '../components/CrateButton.jsx'
import BattleRulesModal from '../components/BattleRulesModal.jsx'
import WaveformVideo from '../components/WaveformVideo.jsx'
import { IconPoster } from '../components/icons.jsx'
import { CountdownBlocks } from '../components/Countdown.jsx'
import { BattleTour } from '../components/Tour.jsx'
import { Btn, Label, Field, inputCls } from '../components/ui.jsx'
import { STATUS, STATUS_ORDER, STATUS_INDEX, countdownTarget } from '../data/status.js'
import { shuffleSeeded, fmtDate } from '../utils/wave.js'
import { mediaUrl } from '../api.js'
import { kindCopy } from '../data/kind.js'
import KindBadge from '../components/KindBadge.jsx'
import { useT, useI18n } from '../i18n/index.jsx'

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
    mailConfigured,
    isCurator,
    disqualifySubmission,
  } = app

  const battle = getBattle(id)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ audioUrl: '', soundcloudUrl: '', youtubeUrl: '' })
  const [beatName, setBeatName] = useState('')
  const [uploadingBeat, setUploadingBeat] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [waveVideo, setWaveVideo] = useState(null)

  const approvedSubs = useMemo(
    () => (battle ? battleSubmissions(battle.id).filter((s) => s.approved) : []),
    [battle, battleSubmissions],
  )

  // Stable anonymised order for the voting phase.
  const shuffled = useMemo(
    () => (battle ? shuffleSeeded(approvedSubs, `vote-${battle.id}`) : []),
    [approvedSubs, battle],
  )

  // The competitor's own entry, if they already submitted — lets them replace
  // it while the submission phase is still open.
  const mySubmission = useMemo(
    () => (battle && currentUser ? battleSubmissions(battle.id).find((s) => s.mine) : null),
    [battle, currentUser, battleSubmissions],
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
  const isOwner = !!currentUser && battle.curatorId === currentUser.id
  const isCommunity = !!curator && curator.role !== 'curator'
  const c = kindCopy(battle.kind)
  const attending = currentUser && battle.attendees.includes(currentUser.id)
  const isRegistered = currentUser && battle.signups.includes(currentUser.id)
  const myVote = currentUser ? userVoteInBattle(battle.id, currentUser.id) : null
  // Competitors download the source to work on it: producers get the sample
  // (BEATS), artists get the beat (VERSES), curators get either.
  const canDownloadSource =
    !!currentUser &&
    battle.sampleRevealed &&
    playableAudio(battle.sampleUrl) &&
    (currentUser.role === 'curator' ||
      (battle.kind === 'BEATS' && currentUser.role === 'producer') ||
      (battle.kind === 'VERSES' && currentUser.role === 'artist'))
  const sourceExt = (battle.sampleUrl?.match(/\.(\w+)$/) || [])[1] || 'mp3'

  const sampleMeta = {
    id: `sample-${battle.id}`,
    label: battle.sampleRevealed ? `${battle.sampleArtist}, ${battle.sampleSong}` : t('battleDetail.sealedSample'),
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
    src: playableAudio(s.audioUrl) ? s.audioUrl : undefined,
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

  const openRules = () => {
    if (!currentUser) return requireLogin('slot')
    setRulesOpen(true)
  }
  const onRegister = async () => {
    const r = await registerProducer(battle.id)
    setRulesOpen(false)
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

  const onPickBeat = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 30 * 1024 * 1024) {
      setMsg({ ok: false, text: t('submit.tooLarge') })
      e.target.value = ''
      return
    }
    setUploadingBeat(true)
    const r = await app.uploadAudio(file)
    setUploadingBeat(false)
    e.target.value = ''
    if (r.ok) {
      setForm((f) => ({ ...f, audioUrl: r.url }))
      setBeatName(file.name)
      setMsg({ ok: true, text: t('submit.uploaded', { name: file.name }) })
    } else {
      setMsg({ ok: false, text: r.error || 'Upload failed.' })
    }
  }

  const onVote = async (submissionId) => {
    if (!currentUser) return requireLogin('vote')
    const r = await castVote(battle.id, submissionId)
    setMsg(r.ok ? { ok: true, text: t('battleDetail.fb.voteCast') } : { ok: false, text: r.error })
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <BattleTour />
      <Link to="/battles" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
        {t('battleDetail.allBattles')}
      </Link>

      {/* HEADER */}
      <div className="relative mt-6 border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusBadge status={battle.status} size="lg" />
            <KindBadge kind={battle.kind} size="md" />
            {battle.blind ? (
              <span className="border border-line-bright px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                ◈ {t('battleDetail.blindBadge')}
              </span>
            ) : null}
            {isCommunity ? (
              <span className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {t('host.community')}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('battleDetail.hereNow')}</div>
              <div className="font-mono text-lg tnum leading-none">{battle.attendees.length}</div>
            </div>
            <button
              data-tour="battle-attend"
              onClick={onAttend}
              className={`border px-4 h-10 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                attending ? 'bg-ink text-bg border-ink' : 'border-line-bright text-ink hover:border-ink'
              }`}
            >
              {attending ? t('battleDetail.attending') : t('battleDetail.attend')}
            </button>
            <Link
              data-tour="battle-share"
              to={battle.status === STATUS.WINNER_DECLARED ? `/share/win/${battle.id}` : `/share/battle/${battle.id}`}
              aria-label={t('share.title')}
              title={t('share.title')}
              className="flex h-10 w-10 items-center justify-center border border-line-bright text-ink transition-colors hover:border-ink"
            >
              <IconPoster size={18} />
            </Link>
            <ShareToDM battleId={battle.id} className="h-10 w-10" />
            <ShareButton
              iconOnly
              className="h-10 w-10"
              title={t('battleDetail.shareTitle', { title: battle.title })}
              text={t('battleDetail.shareText', { title: battle.title })}
            />
          </div>
        </div>

        <div className="px-6 py-9 sm:px-8 sm:py-12">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            <span>SMPL·{battle.id.toUpperCase()}</span>
            <span className="h-px w-8 bg-line-bright" />
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
              {t('battleDetail.curatedBy', { alias: curator?.alias || 'SMPL' })}
              {curator?.verified ? <VerifiedBadge size={11} /> : null}
            </span>
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
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label>{t(`battleDetail.sampleCaption.${battle.kind}`)}</Label>
          {canDownloadSource ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                data-tour="battle-sample"
                href={mediaUrl(battle.sampleUrl)}
                download={`SMPL-${(battle.title || 'source').replace(/[^\w]+/g, '_')}.${sourceExt}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                ↓ {t(`battleDetail.downloadSource.${battle.kind}`)}
              </a>
              {mailConfigured ? <EmailSourceButton battleId={battle.id} /> : null}
            </div>
          ) : null}
        </div>
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
        <div data-tour="battle-countdown" className="mt-6 flex flex-wrap items-end justify-between gap-4 border border-line bg-panel p-5">
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
            tour="battle-action"
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
              <Btn onClick={openRules} variant="solid" size="lg">
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

        {rulesOpen ? <BattleRulesModal onAgree={onRegister} onClose={() => setRulesOpen(false)} /> : null}

        {battle.status === STATUS.SUBMISSION_PHASE && (
          <PhaseBox
            tour="battle-action"
            title={t('battleDetail.submission.title')}
            sub={t(`battleDetail.submission.sub.${battle.kind}`, { n: approvedSubs.length })}
          >
            {isRegistered ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="font-mono text-[12px] leading-relaxed text-muted">
                  {t(`battleDetail.submission.brief.${battle.kind}`)}
                </p>
                {mySubmission ? (
                  <div className="border border-line-bright bg-bg px-4 py-3">
                    <div className="font-mono text-[11px] text-ink">
                      <span className="text-muted">✓ </span>
                      {t(`battleDetail.submission.current.${battle.kind}`)}
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted">
                      {t('battleDetail.submission.replaceHint')}
                    </p>
                  </div>
                ) : null}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <Label>{t(`submit.upload.${battle.kind}`)}</Label>
                    <span className="font-mono text-[10px] text-muted">{t('submit.anonHint')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label
                      className={`cursor-pointer border border-line-bright px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg ${
                        uploadingBeat ? 'pointer-events-none opacity-40' : ''
                      }`}
                    >
                      {uploadingBeat
                        ? t('submit.uploading')
                        : beatName
                          ? t('submit.replace')
                          : t(`submit.upload.${battle.kind}`)}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.aif,.aiff"
                        className="hidden"
                        onChange={onPickBeat}
                        disabled={uploadingBeat}
                      />
                    </label>
                    {beatName ? (
                      <span className="flex items-center gap-2 font-mono text-[11px] text-ink">
                        <span className="text-muted">✓</span>
                        <span className="max-w-[170px] truncate">{beatName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, audioUrl: '' }))
                            setBeatName('')
                          }}
                          className="text-muted hover:text-ink"
                          aria-label={t('submit.remove')}
                        >
                          ✕
                        </button>
                      </span>
                    ) : null}
                  </div>
                </div>
                <Btn type="submit" variant="solid" size="lg" disabled={!form.audioUrl}>
                  {mySubmission ? t('battleDetail.submission.update') : t(`battleDetail.submission.submit.${battle.kind}`)}
                </Btn>
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
            tour="battle-action"
            title={t('battleDetail.voting.title')}
            sub={t(battle.blind ? 'battleDetail.voting.subBlind' : 'battleDetail.voting.sub')}
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
                const meta = beatMeta(s, index, !battle.blind)
                const isOwn = s.mine
                const votedThis = myVote && myVote.submissionId === s.id
                let btn
                if (s.disqualified) {
                  btn = (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-verified">
                      {t('battle.disqualified')}
                    </span>
                  )
                } else if (votedThis) {
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
                  <div key={s.id}>
                    <BeatPlayer
                      meta={meta}
                      index={index}
                      noun={c.drop.toUpperCase()}
                      revealed={!battle.blind}
                      alias={battle.blind ? undefined : getUser(s.producerId)?.alias}
                      verified={!battle.blind && !!getUser(s.producerId)?.verified}
                      rightSlot={btn}
                    />
                    <div className="flex flex-wrap items-center gap-2 border border-t-0 border-line bg-panel px-3 py-2">
                      <CrateButton submissionId={s.id} />
                    </div>
                    {isOwner ? (
                      <div className="flex items-center gap-3 border border-t-0 border-line bg-panel px-3 py-2">
                        <button
                          onClick={() => disqualifySubmission(s.id)}
                          className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                        >
                          {s.disqualified ? `↩ ${t('battle.reinstate')}` : `⊘ ${t('battle.disqualify')}`}
                        </button>
                      </div>
                    ) : null}
                    {s.mine && s.audioUrl ? (
                      <div className="flex items-center gap-3 border border-t-0 border-line bg-panel px-3 py-2">
                        <button
                          onClick={() =>
                            setWaveVideo({
                              audioUrl: mediaUrl(s.audioUrl),
                              producer: currentUser?.alias || '',
                              tag: `${battle.title} · ${c.drop.toUpperCase()} ${index}/${shuffled.length}`,
                              battleId: battle.id,
                            })
                          }
                          className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                        >
                          Waveform video
                        </button>
                      </div>
                    ) : null}
                    {!battle.blind ? <CommentThread submissionId={s.id} producerId={s.producerId} /> : null}
                  </div>
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
                  <div key={s.id}>
                    <BeatPlayer
                      meta={meta}
                      index={rank}
                      noun={c.drop.toUpperCase()}
                      rank={rank}
                      revealed
                      alias={getUser(s.producerId)?.alias}
                      verified={!!getUser(s.producerId)?.verified}
                      votes={voteCount(s.id)}
                      showVotes
                      isWinner={isWinner}
                    />
                    <div className="flex flex-wrap items-center gap-2 border border-t-0 border-line bg-panel px-3 py-2">
                      <CrateButton submissionId={s.id} />
                    </div>
                    <CommentThread submissionId={s.id} producerId={s.producerId} />
                  </div>
                )
              })}
            </div>
          </PhaseBox>
        )}
      </div>

      <div className="mt-10 flex justify-center border-t border-line pt-6">
        <ReportButton targetType="battle" targetId={battle.id} label={battle.title} />
      </div>

      {waveVideo ? <WaveformVideo {...waveVideo} onClose={() => setWaveVideo(null)} /> : null}
    </div>
  )
}

function EmailSourceButton({ battleId }) {
  const { emailSource } = useApp()
  const { lang } = useI18n()
  const t = useT()
  const [state, setState] = useState('idle') // idle | busy | sent | err

  const send = async () => {
    setState('busy')
    const r = await emailSource(battleId, lang)
    if (r.ok) {
      setState('sent')
      setTimeout(() => setState('idle'), 3500)
    } else {
      setState('err')
      setTimeout(() => setState('idle'), 3500)
    }
  }

  return (
    <button
      onClick={send}
      disabled={state === 'busy' || state === 'sent'}
      className="inline-flex items-center gap-1.5 border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink"
    >
      {state === 'sent'
        ? t('battleDetail.emailSent')
        : state === 'busy'
          ? t('battleDetail.emailSending')
          : `✉ ${t('battleDetail.emailSource')}`}
    </button>
  )
}

function PhaseBox({ title, sub, children, tour }) {
  return (
    <div data-tour={tour} className="border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
        <h2 className="font-sans text-lg font-semibold uppercase tracking-tight">{title}</h2>
        {sub ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{sub}</span> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}
