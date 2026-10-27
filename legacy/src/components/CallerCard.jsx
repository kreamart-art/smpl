import { useT } from '../i18n/index.jsx'

// A user's prediction-game reputation: calls, hit rate, current streak, points.
// Renders nothing until they've made at least one resolved call.
export default function CallerCard({ user, className = '' }) {
  const t = useT()
  const c = user.caller || { calls: 0, correct: 0, points: 0, streak: 0 }
  if (!c.calls) return null
  const hitRate = Math.round((c.correct / c.calls) * 100)
  const metrics = [
    { label: t('caller.calls'), val: c.calls },
    { label: t('caller.hitRate'), val: `${hitRate}%` },
    { label: t('caller.streak'), val: c.streak, accent: c.streak > 0 },
    { label: t('caller.points'), val: c.points },
  ]
  return (
    <section className={className}>
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="font-sans text-lg font-bold uppercase tracking-tight">{t('caller.title')}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('caller.sub')}</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="border border-line bg-panel p-3 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{m.label}</div>
            <div className={`mt-1 font-sans text-2xl font-bold ${m.accent ? 'text-accent' : 'text-ink'}`}>{m.val}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
