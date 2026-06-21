import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import VerifiedBadge from './VerifiedBadge.jsx'

// Listener "call the winner" game. During voting, eligible viewers (not the
// competitors, not the house) call who they think wins; the call locks when
// voting closes. After the winner is declared, the panel shows whether the
// call was right (+10). Predictions are private — only your own call is shown.
export default function PredictPanel({ battle, submissions }) {
  const { currentUser, myPrediction, predict, getUser } = useApp()
  const t = useT()

  // everyone predicts — listeners, producers + artists, even competitors in this
  // battle (it's a guess, never touches the result). Only @SMPL is barred.
  if (!currentUser || currentUser.alias === 'SMPL') return null

  const subs = (submissions || []).filter((s) => !s.disqualified)
  if (!subs.length) return null
  const myPick = myPrediction(battle.id)
  const aliasOf = (s, i) =>
    !battle.blind && getUser(s.producerId)?.alias ? `@${getUser(s.producerId).alias}` : t('predict.beat', { n: i + 1 })

  // ---- voting phase: the picker ----
  if (battle.status === STATUS.VOTING_PHASE) {
    const pickedSub = subs.find((s) => s.id === myPick)
    return (
      <div className="border border-line bg-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="font-sans text-lg font-semibold uppercase tracking-tight">{t('predict.title')}</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">{t('predict.locks')}</span>
        </div>
        <div className="px-5 py-4">
          <p className="mb-3 font-mono text-[11px] leading-relaxed text-muted">{t('predict.sub')}</p>
          <div className="space-y-2">
            {subs.map((s, i) => {
              const sel = myPick === s.id
              const verified = !battle.blind && !!getUser(s.producerId)?.verified
              return (
                <button
                  key={s.id}
                  onClick={() => predict(battle.id, s.id)}
                  className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left font-mono text-[12px] transition-colors ${
                    sel ? 'border-accent text-ink' : 'border-line text-ink hover:border-line-bright'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                      sel ? 'border-accent bg-accent' : 'border-line-bright'
                    }`}
                  >
                    {sel ? <span className="block h-1.5 w-1.5 bg-accent-ink" /> : null}
                  </span>
                  <span className="truncate uppercase tracking-[0.1em]">{aliasOf(s, i)}</span>
                  {verified ? <VerifiedBadge size={11} /> : null}
                </button>
              )
            })}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {pickedSub
              ? t('predict.yourCall', { alias: aliasOf(pickedSub, subs.indexOf(pickedSub)) })
              : t('predict.tapToCall')}
          </p>
        </div>
      </div>
    )
  }

  // ---- winner declared: your result ----
  if (battle.status === STATUS.WINNER_DECLARED && myPick) {
    const correct = myPick === battle.winnerSubmissionId
    const pickedSub = subs.find((s) => s.id === myPick)
    const calledAlias = pickedSub ? aliasOf(pickedSub, subs.indexOf(pickedSub)) : '—'
    return (
      <div
        className={`flex items-center gap-3 border px-4 py-3 font-mono text-[11px] ${
          correct ? 'border-good bg-good/10 text-ink' : 'border-accent bg-accent/5 text-muted'
        }`}
      >
        {correct ? (
          <span className="bg-good px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-bg">
            {t('predict.correctTag')}
          </span>
        ) : (
          <span className="border border-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-accent">
            {t('predict.missTag')}
          </span>
        )}
        <span>{t('predict.youCalled', { alias: calledAlias })}</span>
        {correct ? <span className="ml-auto font-sans text-base font-bold text-good">+10</span> : null}
      </div>
    )
  }

  return null
}
