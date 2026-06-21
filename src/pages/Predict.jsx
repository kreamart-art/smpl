import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import BeatPlayer from '../components/BeatPlayer.jsx'
import { CountdownInline } from '../components/Countdown.jsx'
import { Btn } from '../components/ui.jsx'
import { STATUS, countdownTarget } from '../data/status.js'
import { shuffleSeeded } from '../utils/wave.js'
import { kindCopy } from '../data/kind.js'

// Only drive the <audio> from real playable files (our uploads / direct links).
const playableAudio = (u) =>
  !!u && (u.startsWith('/api/uploads/') || /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(u))

// ---------- /predict : the list of live battles you can call ----------
export function PredictHub() {
  const t = useT()
  const { battles } = useApp()
  const live = (battles || []).filter((b) => b.status === STATUS.VOTING_PHASE)

  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b border-line pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">SMPL · {t('predict.title')}</div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="font-sans text-[clamp(1.8rem,6vw,3rem)] font-bold uppercase leading-none tracking-tighter">
            {t('predict.title')}
          </h1>
          <Link to="/play" className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
            {t('play.title')} →
          </Link>
        </div>
        <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-muted">{t('predict.hubSub')}</p>
      </div>

      {live.length === 0 ? (
        <p className="mt-8 border border-line bg-panel px-5 py-10 text-center font-mono text-[12px] text-muted">
          {t('predict.empty')}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {live.map((b) => {
            const c = kindCopy(b.kind)
            const { ts } = countdownTarget(b)
            return (
              <Link
                key={b.id}
                to={`/predict/${b.id}`}
                className="group flex items-center gap-4 border border-line bg-panel px-5 py-4 transition-colors hover:border-line-bright"
              >
                <span className="block h-1.5 w-1.5 shrink-0 bg-accent pulse-dot" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-base font-bold uppercase tracking-tight">{b.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {c.label} · {t('predict.votingNow')}
                  </div>
                </div>
                {ts ? <CountdownInline to={ts} className="shrink-0 text-[11px] text-muted" /> : null}
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-ink">
                  {t('predict.callIt')} ▸
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- /predict/:id : listen to the entries + call the winner ----------
export function PredictBattle() {
  const t = useT()
  const { id } = useParams()
  const { getBattle, battleSubmissions, currentUser, predict, myPrediction, getUser } = useApp()

  const battle = getBattle(id)
  const subs = useMemo(
    () => (battle ? battleSubmissions(battle.id).filter((s) => s.approved && !s.disqualified) : []),
    [battle, battleSubmissions],
  )
  const shuffled = useMemo(() => (battle ? shuffleSeeded(subs, `vote-${battle.id}`) : []), [subs, battle])

  if (!battle) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-24 text-center sm:px-6">
        <div className="font-mono text-sm text-muted">{t('predict.empty')}</div>
        <div className="mt-6">
          <Btn to="/predict" variant="ghost">
            {t('predict.title')}
          </Btn>
        </div>
      </div>
    )
  }

  const c = kindCopy(battle.kind)
  const voting = battle.status === STATUS.VOTING_PHASE
  const declared = battle.status === STATUS.WINNER_DECLARED
  const revealed = declared || !battle.blind
  const myPick = myPrediction(battle.id)
  const canPredict = !!currentUser && currentUser.alias !== 'SMPL'

  const beatMeta = (s, idx) => ({
    id: `beat-${s.id}`,
    label: revealed ? getUser(s.producerId)?.alias || t('battleDetail.unknown') : `${c.drop.toUpperCase()} #${idx}`,
    sub: battle.title,
    duration: s.duration || battle.sampleDuration || 15,
    seed: s.id,
    src: playableAudio(s.audioUrl) ? s.audioUrl : undefined,
  })

  const pickedSub = shuffled.find((s) => s.id === myPick)
  const correct = declared && !!myPick && myPick === battle.winnerSubmissionId
  const calledAlias = pickedSub
    ? revealed
      ? `@${getUser(pickedSub.producerId)?.alias || ''}`
      : t('predict.beat', { n: shuffled.indexOf(pickedSub) + 1 })
    : '—'

  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b border-line pb-5">
        <Link to="/predict" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
          ◂ {t('predict.title')}
        </Link>
        <h1 className="mt-3 font-sans text-[clamp(1.6rem,5vw,2.4rem)] font-bold uppercase leading-none tracking-tight">
          {battle.title}
        </h1>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {c.label} · {voting ? t('predict.locks') : declared ? t('predict.closed') : t('predict.notOpen')}
        </div>
      </div>

      {/* result, or the call-to-action */}
      {declared && myPick ? (
        <div
          className={`mt-6 flex items-center gap-3 border px-4 py-3 font-mono text-[11px] ${
            correct ? 'border-good bg-good/10 text-ink' : 'border-accent bg-accent/5 text-muted'
          }`}
        >
          {correct ? (
            <span className="bg-good px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-bg">{t('predict.correctTag')}</span>
          ) : (
            <span className="border border-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-accent">
              {t('predict.missTag')}
            </span>
          )}
          <span>{t('predict.youCalled', { alias: calledAlias })}</span>
          {correct ? <span className="ml-auto font-sans text-base font-bold text-good">+10</span> : null}
        </div>
      ) : voting ? (
        <p className="mt-6 font-mono text-[12px] leading-relaxed text-muted">{t('predict.sub')}</p>
      ) : (
        <p className="mt-6 font-mono text-[12px] leading-relaxed text-muted">{t('predict.notOpenSub')}</p>
      )}

      {/* not signed in / @SMPL: a quiet note */}
      {voting && !canPredict ? (
        <p className="mt-4 border border-line bg-bg px-4 py-3 font-mono text-[11px] leading-relaxed text-muted">
          {currentUser ? (
            t('predict.houseNote')
          ) : (
            <>
              {t('predict.signIn')}{' '}
              <Link to="/login" className="text-ink underline underline-offset-4 hover:text-accent">
                {t('common.login')}
              </Link>
            </>
          )}
        </p>
      ) : null}

      {/* the entries: listen, then call one */}
      <div className="mt-6 space-y-3">
        {shuffled.map((s, i) => {
          const idx = i + 1
          const sel = myPick === s.id
          const isWinner = declared && s.id === battle.winnerSubmissionId
          const u = revealed ? getUser(s.producerId) : null
          return (
            <div key={s.id}>
              <BeatPlayer
                meta={beatMeta(s, idx)}
                index={idx}
                noun={c.drop.toUpperCase()}
                revealed={revealed}
                alias={u?.alias}
                verified={!!u?.verified}
                isWinner={isWinner}
              />
              {voting && canPredict ? (
                <button
                  onClick={() => predict(battle.id, s.id)}
                  className={`mt-1.5 h-10 w-full border font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    sel ? 'border-accent bg-accent text-accent-ink' : 'border-line-bright text-ink hover:bg-ink hover:text-bg'
                  }`}
                >
                  {sel ? `✓ ${t('predict.yourPick')}` : t('predict.pickThis')}
                </button>
              ) : null}
            </div>
          )
        })}
        {shuffled.length === 0 ? (
          <p className="border border-line bg-panel px-5 py-8 text-center font-mono text-[12px] text-muted">{t('predict.noEntries')}</p>
        ) : null}
      </div>
    </div>
  )
}
