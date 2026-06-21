import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import Vinyl from '../components/Vinyl.jsx'
import LeagueBoard from '../components/LeagueBoard.jsx'
import { Btn, Label } from '../components/ui.jsx'
import { IconPlay, IconPause, IconLock, IconCheck } from '../components/icons.jsx'

// ---- audio: official ~30s previews from the iTunes catalogue, capped to 15s.
// We resolve the preview URL through OUR server (/api/game/preview) instead of
// calling itunes.apple.com from the page: the in-app webview / iOS content
// blockers / some networks silently kill that cross-origin lookup, which showed
// up as "no preview" on iPhone. Cache per search term across the whole session.
const CLIP_MS = 15000
const previewCache = {} // term -> url | null (resolved, definitive)

async function findPreview(term) {
  if (term in previewCache) return previewCache[term]
  let r
  try {
    r = await api.get('/api/game/preview?term=' + encodeURIComponent(term))
  } catch {
    return null // transient: leave uncached so a later tap can retry
  }
  if (!r || !r.ok || r.transient) return null // transient: allow retry
  const url = r.url || null
  previewCache[term] = url // definitive: a real URL, or a genuine no-preview
  return url
}

// A single mono "play 15s" pill with its own audio element + lifecycle. `term`
// is the search string; `label` the idle text. iOS/Safari only allow audio that
// STARTS synchronously inside the tap gesture, so we warm the preview URL on
// mount and, on tap, play straight from the cache with no await in between.
function PlayClip({ term, label }) {
  const { t } = useI18n()
  const [state, setState] = useState('idle') // idle | loading | playing | na
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const liveRef = useRef(true)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const stop = useCallback(() => {
    clearTimer()
    const a = audioRef.current
    if (a) {
      a.pause()
      try {
        a.currentTime = 0
      } catch {
        /* ignore */
      }
    }
    setState((s) => (s === 'na' ? 'na' : 'idle'))
  }, [])

  // warm the preview URL on mount; tear down on unmount / term change
  useEffect(() => {
    liveRef.current = true
    findPreview(term)
    return () => {
      liveRef.current = false
      clearTimer()
      const a = audioRef.current
      if (a) {
        a.pause()
        a.src = ''
      }
    }
  }, [term])

  // play on an element already unlocked by the current tap gesture
  const begin = (a, url) => {
    a.src = url
    a.play()
      .then(() => {
        if (!liveRef.current) return
        setState('playing')
        clearTimer()
        timerRef.current = setTimeout(stop, CLIP_MS)
      })
      .catch(() => liveRef.current && setState('na'))
  }

  const toggle = () => {
    if (state === 'playing') return stop()
    if (state === 'loading') return
    // one persistent element: the first in-gesture play() unlocks it on iOS
    const a = audioRef.current || (audioRef.current = new Audio())
    a.onended = stop
    // common path: URL is already warmed, so play synchronously inside the tap
    if (term in previewCache) {
      const url = previewCache[term]
      if (!url) return setState('na')
      return begin(a, url)
    }
    // not warmed yet (fast tap / slow net): resolve then play. On iOS this may
    // need a second tap, by which point the URL is cached and playback is sync.
    setState('loading')
    findPreview(term).then((url) => {
      if (!liveRef.current) return
      if (!url) return setState('na')
      begin(a, url)
    })
  }

  const text =
    state === 'loading'
      ? t('game.loading')
      : state === 'playing'
        ? t('game.stop')
        : state === 'na'
          ? t('game.noPreview')
          : label
  const live = state === 'playing'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === 'na'}
      aria-label={text}
      className={[
        'inline-flex items-center gap-2.5 border px-4 h-10 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-200',
        state === 'na'
          ? 'border-line text-faint opacity-50 cursor-default'
          : live
            ? 'border-accent text-accent'
            : 'border-line-bright text-ink hover:border-ink hover:bg-panel',
      ].join(' ')}
    >
      {live ? <IconPause size={13} /> : <IconPlay size={13} />}
      {live ? (
        <span className="flex items-end gap-[2px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="wave-bar block w-[2px] bg-accent" style={{ height: 11, animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
      ) : null}
      <span>{text}</span>
    </button>
  )
}

const srcTerm = (answer) => {
  const [artist, title = ''] = answer.split('—')
  return artist.trim() + ' ' + title.replace(/["“”]/g, '').trim()
}

function rankFor(score, total) {
  const r = total ? score / total : 0
  if (r >= 1) return 4
  if (r >= 0.8) return 3
  if (r >= 0.6) return 2
  if (r >= 0.4) return 1
  return 0
}

export default function Game() {
  const { t, lang } = useI18n()
  const { currentUser } = useApp()

  const [phase, setPhase] = useState('start') // start | select | play | end
  const [progress, setProgress] = useState(null) // { levelCount, clearMin, unlocked, authed, levels[] }
  const [starting, setStarting] = useState(false)
  const [sid, setSid] = useState(null)
  const [level, setLevel] = useState(1)
  const [levelCount, setLevelCount] = useState(1)
  const [clearMin, setClearMin] = useState(10)
  const [total, setTotal] = useState(14)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [picked, setPicked] = useState(null) // index chosen this round
  const [reveal, setReveal] = useState(null) // { correctIndex, answer, fact }
  const [cleared, setCleared] = useState(false) // did the just-finished level clear
  const [leagueKey, setLeagueKey] = useState(0)

  const loadProgress = useCallback(async () => {
    const r = await api.get('/api/game/progress')
    if (r.ok) {
      setProgress(r)
      setLevelCount(r.levelCount)
      setClearMin(r.clearMin)
    }
  }, [])
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  async function start(lvl) {
    setStarting(true)
    const r = await api.post('/api/game/start', { level: lvl })
    setStarting(false)
    if (!r.ok) {
      loadProgress()
      setPhase('select')
      return
    }
    setSid(r.sid)
    setLevel(r.level)
    setLevelCount(r.levelCount)
    setClearMin(r.clearMin)
    setTotal(r.total)
    setQuestions(r.questions)
    setIdx(0)
    setScore(0)
    setStreak(0)
    setBest(0)
    setPicked(null)
    setReveal(null)
    setCleared(false)
    setPhase('play')
  }

  function openLevels() {
    loadProgress()
    setPhase('select')
  }

  async function choose(pick) {
    if (picked !== null) return
    setPicked(pick)
    const r = await api.post('/api/game/answer', { sid, q: idx, pick, lang })
    if (!r.ok) {
      setPhase('select')
      setPicked(null)
      loadProgress()
      return
    }
    setScore(r.score)
    setStreak(r.streak)
    setBest((b) => Math.max(b, r.streak))
    setReveal({ correctIndex: r.correctIndex, answer: r.answer, fact: r.fact })
    if (r.done) {
      setCleared(!!r.cleared)
      if (currentUser) {
        loadProgress()
        setLeagueKey((k) => k + 1)
      }
    }
  }

  function next() {
    if (idx + 1 < total) {
      setIdx(idx + 1)
      setPicked(null)
      setReveal(null)
    } else {
      setPhase('end')
    }
  }

  const q = questions[idx]
  const modTerm = q ? `${q.artist} ${q.track}` : ''

  // ---------------- START (intro) ----------------
  if (phase === 'start') {
    return (
      <Shell leagueKey={leagueKey} t={t}>
        <div className="border border-line bg-panel">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <span className="block h-1.5 w-1.5 bg-accent pulse-dot" />
            <Label>{t('game.eyebrow')}</Label>
          </div>
          <div className="px-5 py-10 sm:px-8 sm:py-14">
            <div className="flex flex-col items-center gap-9 sm:flex-row sm:items-center sm:gap-10">
              {/* de Plaat — the spinning record */}
              <div className="relative shrink-0">
                <Vinyl size={172} spin={!starting} />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="font-sans text-[clamp(2.4rem,9vw,5rem)] font-bold uppercase leading-[0.9] tracking-tighter">
                  {t('game.title')}
                </h1>
                <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-ink-dim">{t('game.tagline')}</p>
                <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-muted">
                  {t('game.howLevels', { size: total, min: clearMin, levels: levelCount })}
                </p>
                <div className="mt-9">
                  <Btn variant="accent" size="lg" onClick={openLevels} disabled={starting}>
                    {t('game.start')}
                  </Btn>
                </div>
              </div>
            </div>
            <div className="mt-9 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t('game.audioNote')}</div>
          </div>
        </div>
      </Shell>
    )
  }

  // ---------------- SELECT (level map) ----------------
  if (phase === 'select') {
    const levels = progress?.levels || [{ level: 1, unlocked: true, cleared: false, bestScore: 0 }]
    const current = levels.find((l) => l.unlocked && !l.cleared)?.level
    return (
      <Shell leagueKey={leagueKey} t={t}>
        <div className="border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <Label>{t('game.levels')}</Label>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint tnum">
              {(progress?.unlocked ?? 1)} / {levelCount}
            </span>
          </div>
          <div className="px-5 py-7 sm:px-8">
            <p className="mb-5 font-mono text-[12px] leading-relaxed text-muted">{t('game.pickLevelSub', { min: clearMin })}</p>
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
              {levels.map((lv) => {
                const locked = !lv.unlocked
                const isCur = lv.level === current
                let cls = 'border-line-bright bg-panel-2 text-ink hover:border-ink'
                if (locked) cls = 'border-line bg-bg text-faint opacity-50 cursor-default'
                else if (lv.cleared) cls = 'border-accent/50 bg-accent/5 text-ink hover:border-accent'
                if (isCur) cls += ' border-accent'
                return (
                  <button
                    key={lv.level}
                    type="button"
                    disabled={locked || starting}
                    onClick={() => start(lv.level)}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-1 border transition-colors duration-150 ${cls}`}
                  >
                    {locked ? (
                      <IconLock size={16} />
                    ) : (
                      <span className="font-sans text-lg font-bold leading-none tnum">{lv.level}</span>
                    )}
                    {lv.cleared ? (
                      <span className="absolute right-1 top-1 text-accent" aria-hidden>
                        <IconCheck size={11} />
                      </span>
                    ) : null}
                    {!locked && lv.bestScore ? (
                      <span className="font-mono text-[8px] text-muted tnum">
                        {lv.bestScore}/{total}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
            {progress && !progress.authed ? (
              <p className="mt-6 border border-line bg-bg px-4 py-3 font-mono text-[11px] leading-relaxed text-muted">
                {t('game.signInToClimb')}{' '}
                <Link to="/login" className="text-ink underline underline-offset-4 hover:text-accent">
                  {t('common.login')}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </Shell>
    )
  }

  // ---------------- END ----------------
  if (phase === 'end') {
    const ri = rankFor(score, total)
    const hasNext = level < levelCount
    return (
      <Shell leagueKey={leagueKey} t={t}>
        <div className="border border-line bg-panel px-5 py-10 text-center sm:px-8 sm:py-14">
          <div className="mb-7 flex justify-center">
            <Vinyl size={120} spin={false} />
          </div>
          <Label className="!tracking-[0.28em]">
            {t('game.level')} {level} · {t('game.finalScore')}
          </Label>
          <div className="mt-3 font-sans text-[clamp(4rem,20vw,9rem)] font-bold leading-[0.82] tracking-tighter text-accent tnum">
            {score}
            <span className="text-muted">/{total}</span>
          </div>
          <div className={`mt-4 font-sans text-2xl font-bold uppercase tracking-tight ${cleared ? 'text-accent' : 'text-ink'}`}>
            {cleared ? t('game.levelCleared') : t(`game.rank.${ri}.name`)}
          </div>
          <p className="mx-auto mt-3 max-w-md font-sans text-[14px] leading-relaxed text-ink-dim">
            {cleared
              ? hasNext
                ? t('game.clearedNext')
                : t('game.clearedAll')
              : t('game.notCleared', { min: clearMin })}
          </p>
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {t('game.longestStreak')}: <span className="text-ink tnum">{best}</span>
          </div>
          {!currentUser ? (
            <div className="mt-5 font-mono text-[11px] tracking-[0.04em] text-muted">
              {t('game.signInToSave')}{' '}
              <Link to="/login" className="text-ink underline underline-offset-4 hover:text-accent">
                {t('common.login')}
              </Link>
            </div>
          ) : null}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {cleared && hasNext ? (
              <Btn variant="accent" size="lg" onClick={() => start(level + 1)} disabled={starting}>
                {t('game.nextLevel')}
              </Btn>
            ) : (
              <Btn variant="accent" size="lg" onClick={() => start(level)} disabled={starting}>
                {t('game.again')}
              </Btn>
            )}
            <Btn variant="ghost" size="lg" onClick={openLevels}>
              {t('game.levels')}
            </Btn>
          </div>
        </div>
      </Shell>
    )
  }

  // ---------------- PLAY ----------------
  const letters = ['A', 'B', 'C', 'D']
  const pct = Math.round(((idx + (reveal ? 1 : 0)) / total) * 100)
  const correct = reveal && picked === reveal.correctIndex

  return (
    <Shell leagueKey={leagueKey} t={t}>
      <div className="border border-line bg-panel">
        {/* level strip */}
        <div className="flex items-center justify-between border-b border-line px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span className="text-accent">
            {t('game.level')} {level}
            <span className="text-faint"> / {levelCount}</span>
          </span>
          <button
            type="button"
            onClick={openLevels}
            className="text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            {t('game.levels')}
          </button>
        </div>
        {/* HUD */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <span>
            {t('game.round')} <span className="text-ink tnum">{String(idx + 1).padStart(2, '0')}</span> / {total}
          </span>
          <span className={streak > 0 ? 'text-accent' : ''}>
            {t('game.streak')} <span className="tnum">{streak}</span>
          </span>
          <span>
            {t('game.score')} <span className="text-ink tnum">{score}</span>
          </span>
        </div>
        {/* progress */}
        <div className="h-[3px] w-full bg-line">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="px-5 py-7 sm:px-8">
          <Label className="!tracking-[0.28em] text-accent">{t('game.nowPlaying')}</Label>
          <div className="mt-2 font-sans text-[clamp(1.8rem,6vw,2.6rem)] font-bold uppercase leading-none tracking-tight">
            {q.track}
          </div>
          <div className="mt-1.5 font-mono text-[13px] text-muted">
            {q.artist} <span className="text-faint">· {q.year}</span>
          </div>
          <div className="mt-4">
            <PlayClip term={modTerm} label={t('game.play')} />
          </div>

          <div className="mt-7 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">{t('game.prompt')}</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              let cls = 'border-line bg-bg text-ink hover:border-line-bright hover:bg-panel-2'
              if (reveal) {
                if (i === reveal.correctIndex) cls = 'border-accent bg-accent/10 text-ink'
                else if (i === picked) cls = 'border-line-bright bg-panel-2 text-muted line-through'
                else cls = 'border-line bg-bg text-faint opacity-50'
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!reveal}
                  onClick={() => choose(i)}
                  className={`flex items-start gap-3 border px-4 py-3.5 text-left font-mono text-[13px] leading-snug transition-colors duration-150 ${cls} ${
                    reveal ? 'cursor-default' : ''
                  }`}
                >
                  <span className={`font-bold ${reveal && i === reveal.correctIndex ? 'text-accent' : 'text-muted'}`}>
                    {letters[i]}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>

          {/* reveal */}
          {reveal ? (
            <div className="mt-6 border-l-2 border-accent bg-bg px-5 py-4">
              <div className={`font-sans text-base font-bold uppercase tracking-tight ${correct ? 'text-accent' : 'text-ink'}`}>
                {correct ? t('game.niceEar') : t('game.notQuite')}
              </div>
              <div className="mt-2 font-mono text-[12px] text-muted">
                {t('game.source')}: <span className="text-ink-dim">{reveal.answer}</span>
              </div>
              <div className="mt-3">
                <PlayClip term={srcTerm(reveal.answer)} label={t('game.hearOriginal')} />
              </div>
              <p className="mt-4 font-sans text-[13px] leading-relaxed text-ink-dim">{reveal.fact}</p>
              <div className="mt-5">
                <Btn variant="accent" onClick={next} full>
                  {idx + 1 < total ? t('game.next') : t('game.seeResults')}
                </Btn>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}

// Shared page shell: header + the game slot + the league underneath.
function Shell({ children, leagueKey, t }) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b border-line pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('game.eyebrow')}</div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="font-sans text-[clamp(1.8rem,6vw,3rem)] font-bold uppercase leading-none tracking-tighter">
            {t('game.title')}
          </h1>
          <Link
            to="/battles"
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
          >
            {t('common.battles')} →
          </Link>
        </div>
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-12">
        <LeagueBoard refreshKey={leagueKey} />
      </div>
    </div>
  )
}
