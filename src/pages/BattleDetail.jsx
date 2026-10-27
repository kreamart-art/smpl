import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import BeatPlayer from '../components/BeatPlayer.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import ShareSheet from '../components/ShareSheet.jsx'
import { ReportButton } from '../components/Safety.jsx'
import CommentThread from '../components/CommentThread.jsx'
import CrateButton from '../components/CrateButton.jsx'
import BattleRulesModal, { RULES } from '../components/BattleRulesModal.jsx'
import WaveformVideo from '../components/WaveformVideo.jsx'
import WinnerCard from '../components/WinnerCard.jsx'
import BattleRoom from '../components/BattleRoom.jsx'
import WinnerStamp from '../components/WinnerStamp.jsx'
import TopCallers from '../components/TopCallers.jsx'
import { CountdownBlocks } from '../components/Countdown.jsx'
import { BattleTour } from '../components/Tour.jsx'
import { Btn, Label, Field, inputCls } from '../components/ui.jsx'
import { STATUS, STATUS_ORDER, STATUS_INDEX, countdownTarget } from '../data/status.js'
import { shuffleSeeded, fmtDate } from '../utils/wave.js'
import { mediaUrl } from '../api.js'
import { kindCopy, canEnter } from '../data/kind.js'
import { useT, useI18n } from '../i18n/index.jsx'
import { playableAudio } from '../utils/audio.js'
import { Kicker, DisplayTitle, MetaTag, Stamp, catalogNo } from '../components/crate.jsx'
import { When, kindKey } from '../components/BattleRow.jsx'
import { IconBack } from '../components/icons.jsx'

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
            className={`px-2 py-2 text-center ${active ? 'bg-accent text-accent-ink' : 'bg-bg'}`}
          >
            <div className={`font-mono text-[9px] tnum ${done ? 'text-ink' : active ? 'text-accent-ink' : 'text-muted'}`}>
              {String(idx).padStart(2, '0')}
            </div>
            <div
              className={`mt-1 font-mono text-[8px] uppercase leading-tight tracking-[0.1em] ${
                active ? 'text-accent-ink' : done ? 'text-ink' : 'text-muted'
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
    isHouse,
    disqualifySubmission,
    isCrated,
    publishEntry,
  } = app

  const battle = getBattle(id)
  const [msg, setMsg] = useState(null)
  const [winReplay, setWinReplay] = useState(0)
  const [form, setForm] = useState({ audioUrl: '', soundcloudUrl: '', youtubeUrl: '' })
  const [beatName, setBeatName] = useState('')
  const [uploadingBeat, setUploadingBeat] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [waveVideo, setWaveVideo] = useState(null)
  const [winnerCard, setWinnerCard] = useState(null)
  const [tab, setTab] = useState('entries')
  const [sort, setSort] = useState(null)
  const [published, setPublished] = useState({}) // submissionId -> trackId

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

  const { ts, manual } = countdownTarget(battle)
  const curator = getUser(battle.curatorId)
  const isOwner = !!currentUser && battle.curatorId === currentUser.id
  const isCommunity = !!curator && curator.role !== 'curator'
  const c = kindCopy(battle.kind)
  const attending = currentUser && battle.attendees.includes(currentUser.id)
  const isRegistered = currentUser && battle.signups.includes(currentUser.id)
  // Only the official @SMPL account is barred from voting — not the founder's
  // admin (@KREAM). isHouse stays for the waveform-clip tooling below.
  const isSmpl = currentUser?.alias === 'SMPL'
  const myVote = currentUser ? userVoteInBattle(battle.id, currentUser.id) : null
  // Competitors download the source to work on it: producers get the sample
  // (BEATS), artists get the beat (VERSES), curators get either.
  const isStaffUser = currentUser?.role === 'curator' || currentUser?.role === 'admin'
  const canDownloadSource =
    !!currentUser &&
    battle.sampleRevealed &&
    playableAudio(battle.sampleUrl) &&
    (isRegistered || isStaffUser || canEnter(currentUser, battle))
  // the claim CTA only for people the server will actually let in (or anyone
  // logged out, who gets the login prompt)
  const mayEnter = !currentUser || canEnter(currentUser, battle)
  const slotsLeft = battle.maxProducers - battle.signups.length
  const showClaim = battle.status === STATUS.OPEN_FOR_SIGNUP && !isRegistered && slotsLeft > 0 && mayEnter
  const sourceExt = (battle.sampleUrl?.match(/\.(\w+)$/) || [])[1] || 'mp3'

  const sampleMeta = {
    id: `sample-${battle.id}`,
    label: battle.sampleRevealed ? `${battle.sampleArtist}, ${battle.sampleSong}` : t('battleDetail.sealedSample'),
    sub: battle.title,
    duration: battle.sampleDuration || 10,
    seed: `sample-${battle.id}`,
    src: battle.sampleRevealed && playableAudio(battle.sampleUrl) ? battle.sampleUrl : undefined,
    href: `/battles/${battle.id}`,
  }

  const beatMeta = (s, idx, revealed) => ({
    id: `beat-${s.id}`,
    label: revealed ? getUser(s.producerId)?.alias || t('battleDetail.unknown') : `${c.drop.toUpperCase()} #${idx}`,
    sub: battle.title,
    duration: s.duration || battle.sampleDuration || 15,
    seed: s.id,
    src: playableAudio(s.audioUrl) ? s.audioUrl : undefined,
    href: `/battles/${battle.id}`,
  })
  const activeSort = sort || (battle.status === STATUS.VOTING_PHASE ? 'shuffled' : 'top')
  const votingList = activeSort === 'crate' ? shuffled.filter((s) => isCrated(s.id)) : shuffled
  const entryNo = (s) => shuffled.findIndex((x) => x.id === s.id) + 1
  // the voting list plays as one queue, in the same order people see
  const votingQueue = votingList.map((s) => beatMeta(s, entryNo(s), !battle.blind))
  const SortBar = ({ options }) => (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {options.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setSort(k)}
          className={`h-8 border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
            activeSort === k ? 'border-ink bg-ink text-bg' : 'border-line-bright text-muted hover:text-ink'
          }`}
        >
          {t(`entries.sort.${k}`)}
        </button>
      ))}
    </div>
  )

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
    if (myVote && myVote.submissionId === submissionId) return // already on this beat
    const changing = !!myVote
    const r = await castVote(battle.id, submissionId)
    setMsg(
      r.ok
        ? { ok: true, text: t(changing ? 'battleDetail.fb.voteChanged' : 'battleDetail.fb.voteCast') }
        : { ok: false, text: r.error },
    )
  }

  // The official @SMPL / house account can spin up a promo waveform for any
  // entry; a producer can still make one of their own. Names stay hidden on a
  // live blind battle so the format isn't spoiled.
  const canMakeWave = (s) => !!s.audioUrl && (s.mine || isHouse)
  const waveProducer = (s) => {
    if (s.mine) return currentUser?.alias || ''
    if (battle.blind && battle.status !== STATUS.WINNER_DECLARED) return ''
    return getUser(s.producerId)?.alias || ''
  }
  const waveRow = (s, tag) =>
    canMakeWave(s) ? (
      <div className="flex items-center gap-3 border border-t-0 border-line bg-panel px-3 py-2">
        <button
          onClick={() =>
            setWaveVideo({
              audioUrl: mediaUrl(s.audioUrl),
              producer: waveProducer(s),
              tag,
              battleId: battle.id,
            })
          }
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          {t('battleDetail.waveform.make')}
        </button>
      </div>
    ) : null

  const TABS = ['entries', 'details', 'rules']
  const fmtWhen = (ms) => (ms ? fmtDate(ms) : '')

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      <BattleTour />
      <Link
        to="/battles"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-ink"
      >
        <IconBack size={14} />
        {t('nav.arena')}
      </Link>

      {/* HEADER: sleeve, title, host, tags and the one action for this phase */}
      <header className="relative mt-4 overflow-hidden border border-line-bright bg-panel">
        {battle.cover ? (
          <>
            <img
              src={mediaUrl(battle.cover)}
              alt=""
              className="photocopy absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/20" aria-hidden="true" />
          </>
        ) : (
          <div className="sleeve-grid absolute inset-0" aria-hidden="true" />
        )}
        <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Kicker className="text-ink-dim">{t(kindKey(battle.kind))}</Kicker>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{catalogNo(battle.id)}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {battle.status === STATUS.VOTING_PHASE ? (
                <Stamp tone="accent" rotate={4}>
                  {t('home.live')}
                </Stamp>
              ) : null}
              <ShareSheet
                data-tour="battle-share"
                className="h-10 w-10 bg-bg/60"
                cardTo={battle.status === STATUS.WINNER_DECLARED ? `/share/win/${battle.id}` : `/share/battle/${battle.id}`}
                dm={{ battleId: battle.id }}
                title={t('battleDetail.shareTitle', { title: battle.title })}
                text={t('battleDetail.shareText', { title: battle.title })}
              />
            </div>
          </div>

          <DisplayTitle size="lg" className="mt-12 text-ink sm:mt-16">
            {battle.title}
          </DisplayTitle>
          <Link
            to={`/profile/${encodeURIComponent(curator?.alias || 'SMPL')}`}
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-dim transition-colors hover:text-ink"
          >
            {t('battleDetail.curatedBy', { alias: curator?.alias || 'SMPL' })}
            {curator?.verified ? <VerifiedBadge size={12} /> : null}
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            {battle.genre ? <MetaTag>{battle.genre}</MetaTag> : null}
            {battle.bpm ? <MetaTag>{battle.bpm} BPM</MetaTag> : null}
            {battle.musicalKey ? <MetaTag>{battle.musicalKey}</MetaTag> : null}
            {battle.blind ? <MetaTag>{t('battleDetail.blindBadge')}</MetaTag> : null}
            {isCommunity ? <MetaTag>{t('host.community')}</MetaTag> : null}
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <div data-tour="battle-countdown" className="font-mono text-[12px]">
              <StatusBadge status={battle.status} size="sm" />
              <div className="mt-2">
                {battle.status !== STATUS.WINNER_DECLARED ? (
                  <>
                    <When battle={battle} />
                    <span className="text-muted"> · </span>
                  </>
                ) : null}
                <span className="text-muted">{t('home.inRoom', { n: battle.attendees.length })}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showClaim ? (
                <button
                  onClick={openRules}
                  className="h-11 touch-manipulation border border-accent bg-accent px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-ink transition-colors hover:border-accent-hover hover:bg-accent-hover"
                >
                  {t('battleDetail.claimSlot')}
                </button>
              ) : null}
              <button
                data-tour="battle-attend"
                onClick={onAttend}
                className={`h-11 touch-manipulation border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  attending ? 'border-ink bg-ink text-bg' : 'border-line-bright bg-bg/60 text-ink hover:border-ink'
                }`}
              >
                {attending ? t('battleDetail.attending') : t('battleDetail.attend')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SAMPLE: always visible, the thing everyone flips */}
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
                {t(`battleDetail.downloadSource.${battle.kind}`)}
              </a>
              {mailConfigured ? <EmailSourceButton battleId={battle.id} /> : null}
            </div>
          ) : null}
        </div>
        <AudioPlayer meta={sampleMeta} sealed={!battle.sampleRevealed} />
      </div>

      {/* TABS */}
      <div role="tablist" aria-label={battle.title} className="mt-8 flex gap-1 border-b border-line">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              tab === k ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t(`battleDetail.tab.${k}`)}
            {k === 'entries' && approvedSubs.length ? <span className="ml-1.5 text-faint tnum">{approvedSubs.length}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'entries' ? (
        <div>
          {/* the entry form shows its own feedback next to its button */}
          {msg && !(battle.status === STATUS.SUBMISSION_PHASE && isRegistered) ? (
            <div className="mt-6">
              <Feedback msg={msg} />
            </div>
          ) : null}
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
            ) : mayEnter ? (
              <Btn onClick={openRules} variant="accent" size="lg">
                {t(`battleDetail.signup.claim.${battle.kind}`)}
              </Btn>
            ) : null}
            {currentUser && !mayEnter && !isRegistered ? (
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
                <Btn type="submit" variant="accent" size="lg" disabled={!form.audioUrl}>
                  {mySubmission ? t('battleDetail.submission.update') : t(`battleDetail.submission.submit.${battle.kind}`)}
                </Btn>
                {/* confirmation right where the button is, so it's never off-screen */}
                {msg ? <Feedback msg={msg} /> : null}
              </form>
            ) : (
              <p className="font-mono text-[12px] leading-relaxed text-muted">
                {t(`battleDetail.submission.waiting.${battle.kind}`)}
              </p>
            )}
          </PhaseBox>
        )}

        {battle.status === STATUS.VOTING_PHASE && !isSmpl ? (
          <Link
            to={`/predict/${battle.id}`}
            className="flex items-center gap-3 border border-line bg-panel px-4 py-3 transition-colors hover:border-line-bright"
          >
            <span className="block h-1.5 w-1.5 shrink-0 bg-accent pulse-dot" />
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">{t('predict.title')}</div>
              <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted">{t('predict.fromBattle')}</div>
            </div>
            <span className="ml-auto shrink-0 font-mono text-[12px] text-muted">▸</span>
          </Link>
        ) : null}

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
            ) : isSmpl ? (
              <div className="mb-4 border border-line-bright px-4 py-3 font-mono text-[11px] text-ink">
                {t('battleDetail.voting.house')}
              </div>
            ) : myVote ? (
              <div className="mb-4 border border-ink px-4 py-3 font-mono text-[11px] text-ink">
                {t('battleDetail.voting.voteIn')}
              </div>
            ) : null}

            <div className="space-y-3">
              <SortBar options={['shuffled', 'crate']} />
              {activeSort === 'shuffled' ? (
                <p className="-mt-1 mb-3 font-sans text-[13px] text-muted">{t('entries.shuffledHint')}</p>
              ) : null}
              {votingList.map((s, i) => {
                const index = entryNo(s)
                const meta = votingQueue[i]
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
                  // your pick — the single accent on the voting screen
                  btn = (
                    <span className="bg-accent px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-ink">
                      {t('common.voted')}
                    </span>
                  )
                } else if (isOwn) {
                  btn = (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {t('battleDetail.voting.yourBeat')}
                    </span>
                  )
                } else if (isSmpl) {
                  // @SMPL stays neutral — no vote button, just a quiet label
                  btn = (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {t('battleDetail.voting.houseTag')}
                    </span>
                  )
                } else {
                  // everyone else votes, including competitors (just not their own
                  // beat, which is handled by the isOwn branch above).
                  // neutral CTA per beat (keeps the accent to the single picked
                  // one); 44px tap target.
                  btn = (
                    <button
                      onClick={() => onVote(s.id)}
                      className="touch-manipulation flex min-h-[44px] items-center border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg"
                    >
                      {t(myVote ? 'common.switchVote' : 'common.vote')}
                    </button>
                  )
                }
                return (
                  <div key={s.id}>
                    <BeatPlayer
                      meta={meta}
                      queue={votingQueue}
                      queueIndex={i}
                      index={index}
                      noun={c.drop.toUpperCase()}
                      revealed={!battle.blind}
                      alias={battle.blind ? undefined : getUser(s.producerId)?.alias}
                      verified={!battle.blind && !!getUser(s.producerId)?.verified}
                      rightSlot={btn}
                    />
                    {votedThis ? (
                      <div className="flex items-center gap-2 border border-t-0 border-ink bg-ink/5 px-3 py-2 font-mono text-[11px] text-ink">
                        ✓ {t('battleDetail.fb.voteCast')}
                      </div>
                    ) : null}
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
                    {waveRow(s, `${battle.title} · ${c.drop.toUpperCase()} ${index}/${shuffled.length}`)}
                    {!battle.blind ? <CommentThread submissionId={s.id} producerId={s.producerId} /> : null}
                  </div>
                )
              })}
              {!shuffled.length ? (
                <p className="font-mono text-[12px] text-muted">{t('battleDetail.voting.empty')}</p>
              ) : !votingList.length ? (
                <p className="font-sans text-[14px] text-muted">{t('entries.crateEmpty')}</p>
              ) : null}
            </div>
          </PhaseBox>
        )}

        {battle.status === STATUS.WINNER_DECLARED && (
          <PhaseBox
            title={t(battle.winnerSubmissionId ? 'battleDetail.winner.title' : 'battleDetail.winner.closedTitle')}
            sub={t('battleDetail.winner.sub')}
          >
            {(() => {
              const ranked = rankedSubmissions(battle.id)
              const declared = !!battle.winnerSubmissionId
              const winSub = declared ? ranked.find((x) => x.id === battle.winnerSubmissionId) : null
              const winAlias = winSub ? getUser(winSub.producerId)?.alias : null
              // a curator-broken tie can crown an entry that isn't first by votes
              const order = winSub ? [winSub, ...ranked.filter((x) => x.id !== winSub.id)] : ranked
              const noVotes = ranked.every((x) => !x.votes)
              const shownOrder =
                activeSort === 'latest'
                  ? [...order].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  : activeSort === 'crate'
                    ? order.filter((x) => isCrated(x.id))
                    : order
              const rankOf = (x) => order.findIndex((y) => y.id === x.id) + 1
              const winQueue = shownOrder.map((x) => beatMeta(x, rankOf(x), true))
              const topTie = ranked.length > 1 && ranked[0].votes === ranked[1].votes
              const pendingKey = noVotes
                ? 'battleDetail.winner.noVotes'
                : topTie
                  ? 'battleDetail.winner.pendingTie'
                  : 'battleDetail.winner.pending'
              return (
                <>
                  {!declared ? (
                    <div className="mb-3 border border-line bg-panel px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-dim">
                      {t(pendingKey)}
                    </div>
                  ) : null}
                  {winAlias ? (
                    <button
                      type="button"
                      onClick={() => setWinnerCard({ alias: winAlias, flips: ranked.length })}
                      className="mb-3 w-full border border-line-bright bg-panel px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-bg"
                    >
                      {t('battleDetail.winner.share')}
                    </button>
                  ) : null}
                  <SortBar options={['top', 'latest', 'crate']} />
                  {!shownOrder.length && order.length ? (
                    <p className="font-sans text-[14px] text-muted">{t('entries.crateEmpty')}</p>
                  ) : null}
                  <div className="space-y-3">
                    {shownOrder.map((s, i) => {
                const rank = rankOf(s)
                const meta = winQueue[i]
                // only a declared winner is ever marked as one
                const isWinner = declared && s.id === battle.winnerSubmissionId
                const iWon = isWinner && !!s.mine
                return (
                  <div key={s.id}>
                    <BeatPlayer
                      meta={meta}
                      queue={winQueue}
                      queueIndex={i}
                      index={rank}
                      noun={c.drop.toUpperCase()}
                      rank={rank}
                      revealed
                      alias={getUser(s.producerId)?.alias}
                      verified={!!getUser(s.producerId)?.verified}
                      votes={voteCount(s.id)}
                      showVotes
                      isWinner={isWinner}
                      seal={declared && isWinner ? 'FIRST PRESSING' : undefined}
                    />
                    {iWon ? (
                      <>
                        <WinnerStamp
                          battle={battle}
                          alias={getUser(s.producerId)?.alias}
                          votes={voteCount(s.id)}
                          replay={winReplay}
                        />
                        <div className="flex items-center justify-between border border-t-0 border-line bg-panel px-3 py-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                            {t('battleDetail.winner.youTook')}
                          </span>
                          <button
                            onClick={() => setWinReplay((n) => n + 1)}
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                          >
                            ↻ {t('battleDetail.winner.replay')}
                          </button>
                        </div>
                      </>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 border border-t-0 border-line bg-panel px-3 py-2">
                      <CrateButton submissionId={s.id} />
                      {/* your finished entry can live on as a track, same file, no copy */}
                      {s.mine && playableAudio(s.audioUrl) ? (
                        published[s.id] ? (
                          <Link
                            to={`/track/${published[s.id]}`}
                            className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                          >
                            {t('publishEntry.done')}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await publishEntry(s.id, { title: battle.title })
                              if (r.ok) setPublished((p) => ({ ...p, [s.id]: r.track.id }))
                              else setMsg({ ok: false, text: r.error })
                            }}
                            className="ml-auto h-8 border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-bg"
                          >
                            {t('publishEntry.cta')}
                          </button>
                        )
                      ) : null}
                    </div>
                    {waveRow(s, `${battle.title} · #${rank} · ${getUser(s.producerId)?.alias || ''}`)}
                    <CommentThread submissionId={s.id} producerId={s.producerId} />
                  </div>
                )
                    })}
                  </div>
                </>
              )
            })()}
          </PhaseBox>
        )}

        {battle.status === STATUS.WINNER_DECLARED ? (
          <div className="border border-line bg-panel px-5 py-5">
            <TopCallers />
          </div>
        ) : null}
      </div>

        </div>
      ) : null}

      {tab === 'details' ? (
        <div className="mt-6 space-y-6">
          {battle.description ? (
            <p className="max-w-prose whitespace-pre-line font-sans text-[16px] leading-relaxed text-ink-dim">
              {battle.description}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {[
              [t('battleDetail.meta.curator'), curator?.alias || 'SMPL'],
              [t('battleDetail.meta.slots'), `${battle.signups.length} / ${battle.maxProducers}`],
              [
                battle.kind === 'VERSES' ? t('battleDetail.meta.versesIn') : t('battleDetail.meta.beatsIn'),
                String(approvedSubs.length),
              ],
              manual
                ? [t('battles.card.cd.manualLabel'), t('battles.card.cd.manualValue')]
                : [t(CD_KEY[battle.status]), ts ? fmtDate(ts) : t('battleDetail.meta.closed')],
            ].map(([k, v]) => (
              <div key={k} className="bg-bg px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">{k}</div>
                <div className="mt-1 truncate font-mono text-sm text-ink">{v}</div>
              </div>
            ))}
          </div>
          <PhasePipeline status={battle.status} />
          {ts ? (
            <div className="flex flex-wrap items-end justify-between gap-4 border border-line bg-panel p-5">
              <CountdownBlocks to={ts} label={t(CD_KEY[battle.status])} />
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t(`status.${battle.status}`)}</div>
            </div>
          ) : manual ? (
            <div className="border border-line bg-panel px-5 py-4 font-sans text-[14px] leading-relaxed text-ink-dim">
              {t('battleDetail.cd.manual')}
            </div>
          ) : null}
          <BattleRoom attendees={battle.attendees} />
        </div>
      ) : null}

      {tab === 'rules' ? (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="t-kicker text-ink">{t('rules.winner.title')}</h2>
            <p className="mt-2 max-w-prose font-sans text-[15px] leading-relaxed text-ink-dim">{t('rules.winner.body')}</p>
            <p className="mt-2 max-w-prose font-sans text-[15px] leading-relaxed text-ink-dim">
              {t(battle.tieBreak === 'curator' ? 'rules.tie.curator' : 'rules.tie.earliest')}
            </p>
            <p className="mt-2 max-w-prose font-sans text-[15px] leading-relaxed text-ink-dim">
              {t(battle.blind ? 'rules.blind' : 'rules.open')}
            </p>
          </section>
          <section>
            <h2 className="t-kicker text-ink">{t('rules.house')}</h2>
            <ol className="mt-3 space-y-2.5">
              {RULES.map((r, i) => (
                <li key={r} className="flex gap-3 font-sans text-[15px] leading-relaxed text-ink-dim">
                  <span className="shrink-0 font-mono text-[12px] text-faint tnum">{i + 1}</span>
                  <span>{t(`battle.rules.${r}`)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border border-line bg-panel px-4 py-3 font-sans text-[14px] leading-relaxed text-ink">
              {t('battle.rules.dq')}
            </p>
          </section>
          <section>
            <h2 className="t-kicker text-ink">{t('rules.timeline')}</h2>
            {battle.scheduled ? (
              <dl className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                {[
                  ['rules.t.signup', battle.signupStart],
                  ['rules.t.submit', battle.signupEnd],
                  ['rules.t.vote', battle.submitEnd],
                  ['rules.t.close', battle.voteEnd],
                ].map(([k, ms]) => (
                  <div key={k} className="bg-bg px-4 py-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{t(k)}</dt>
                    <dd className="mt-1 font-mono text-[13px] text-ink">{fmtWhen(ms)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 max-w-prose font-sans text-[15px] leading-relaxed text-ink-dim">{t('rules.manual')}</p>
            )}
          </section>
        </div>
      ) : null}

      <div className="mt-10 flex justify-center border-t border-line pt-6">
        <ReportButton targetType="battle" targetId={battle.id} label={battle.title} />
      </div>

      {waveVideo ? <WaveformVideo {...waveVideo} onClose={() => setWaveVideo(null)} /> : null}
      {winnerCard ? (
        <WinnerCard {...winnerCard} kind={battle.kind} battleTitle={battle.title} seed={battle.id} onClose={() => setWinnerCard(null)} />
      ) : null}
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
