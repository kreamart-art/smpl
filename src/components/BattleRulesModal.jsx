import { useState } from 'react'
import Portal from './Portal.jsx'
import { useT } from '../i18n/index.jsx'

const RULES = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']

// Shown before a producer/artist claims a battle slot — they must tick the
// rules to enter (the server also enforces it). Breaking them → disqualification.
export default function BattleRulesModal({ onAgree, onClose }) {
  const t = useT()
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    if (!agree || busy) return
    setBusy(true)
    await onAgree()
    setBusy(false)
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[85vh] w-full max-w-[480px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('battle.rules.title')}</span>
            <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
              {t('common.close')} ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="font-mono text-[11px] leading-relaxed text-muted">{t('battle.rules.intro')}</p>
            <ol className="mt-3 space-y-2.5">
              {RULES.map((r, i) => (
                <li key={r} className="flex gap-2.5 font-mono text-[12px] leading-relaxed text-ink-dim">
                  <span className="shrink-0 text-faint tnum">{i + 1}</span>
                  <span>{t(`battle.rules.${r}`)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border border-line bg-bg px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink">
              ⚠ {t('battle.rules.dq')}
            </p>
          </div>

          <div className="border-t border-line px-5 py-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#f0eee9]"
              />
              <span className="font-mono text-[11px] leading-relaxed text-muted">{t('battle.rules.agree')}</span>
            </label>
            <button
              onClick={confirm}
              disabled={!agree || busy}
              className="mt-3 w-full border border-ink bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright disabled:opacity-40"
            >
              {t('battle.rules.confirm')}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
