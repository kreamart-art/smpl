import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import Vinyl from '../components/Vinyl.jsx'
import Avatar from '../components/Avatar.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import TopCallers from '../components/TopCallers.jsx'
import { PlayTour } from '../components/Tour.jsx'
import { Btn } from '../components/ui.jsx'
import { STATUS } from '../data/status.js'

// "Play" — the listener-games hub. One place for both games (Guess the Sample +
// Predict the winner) and both weekly boards, so they cross-feed each other.
export default function Play() {
  const t = useT()
  const { battles } = useApp()
  const [gameBoard, setGameBoard] = useState(null)

  useEffect(() => {
    api.get('/api/game/leaderboard').then((r) => r.ok && setGameBoard(r))
  }, [])

  const livePredict = battles.find((b) => b.status === STATUS.VOTING_PHASE)
  const top = gameBoard?.top || []

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-14 sm:px-6 sm:py-20">
      <PlayTour />
      <div className="border-b border-line pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('play.eyebrow')}</div>
        <h1 className="mt-3 font-sans text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-none tracking-tighter">
          {t('play.title')}
        </h1>
        <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-muted">{t('play.sub')}</p>
      </div>

      {/* the two games */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div data-tour="play-game" className="group relative flex flex-col overflow-hidden border border-line bg-panel p-6">
          <span className="hover-bloom" aria-hidden="true" />
          <div className="relative">
            <Vinyl size={64} spin />
          </div>
          <h2 className="relative mt-5 font-sans text-xl font-bold uppercase tracking-tight">{t('game.title')}</h2>
          <p className="relative mt-2 flex-1 font-mono text-[12px] leading-relaxed text-muted">{t('play.gameSub')}</p>
          <div className="relative mt-5">
            <Btn to="/game" variant="accent">
              {t('play.playGame')}
            </Btn>
          </div>
        </div>

        <div data-tour="play-predict" className="group relative flex flex-col overflow-hidden border border-line bg-panel p-6">
          <span className="hover-bloom" aria-hidden="true" />
          <div className="relative flex items-center gap-2">
            <span className="block h-1.5 w-1.5 bg-accent pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('play.predictTag')}</span>
          </div>
          <h2 className="relative mt-4 font-sans text-xl font-bold uppercase tracking-tight">{t('predict.title')}</h2>
          <p className="relative mt-2 flex-1 font-mono text-[12px] leading-relaxed text-muted">{t('play.predictSub')}</p>
          <div className="relative mt-5">
            <Btn to={livePredict ? `/battles/${livePredict.id}` : '/battles'} variant="accent">
              {livePredict ? t('play.predictCta') : t('play.predictBrowse')}
            </Btn>
          </div>
        </div>
      </div>

      {/* the two boards, side by side */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <TopCallers limit={8} />

        <section>
          <div className="flex items-end justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-sans text-lg font-bold uppercase tracking-tight">{t('play.topPlayers')}</h2>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('callers.sub')}</div>
            </div>
            <Link to="/game" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
              {t('play.playGame')} ▸
            </Link>
          </div>
          {top.length ? (
            <div className="mt-2">
              {top.slice(0, 8).map((row) => (
                <div key={row.alias} className="flex items-center gap-3 border-b border-line py-2.5 font-mono text-[12px] last:border-b-0">
                  <span className={`w-6 font-sans text-sm font-bold ${row.rank <= 3 ? 'text-accent' : 'text-muted'}`}>
                    {String(row.rank).padStart(2, '0')}
                  </span>
                  <Link to={`/profile/${encodeURIComponent(row.alias)}`} className="flex flex-1 items-center gap-2.5 overflow-hidden hover:underline">
                    <Avatar alias={row.alias} src={row.avatar} size={24} />
                    <span className="truncate text-ink">@{row.alias}</span>
                    {row.verified ? <VerifiedBadge size={11} /> : null}
                  </Link>
                  <span className="w-12 text-right font-sans text-sm font-bold text-ink tnum">{row.best}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-line bg-panel px-5 py-8 text-center font-mono text-[12px] text-muted">
              {t('play.boardEmpty')}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
