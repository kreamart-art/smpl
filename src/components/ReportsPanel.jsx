import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { fmtDate } from '../utils/wave.js'

// Curator-only moderation queue. Lists submitted reports; a curator marks each
// resolved once handled. Stays invisible (renders nothing) for non-curators —
// the API returns 403 and `reports` never loads.
export default function ReportsPanel() {
  const t = useT()
  const { fetchReports, resolveReport, getUser } = useApp()
  const [reports, setReports] = useState(null)
  const [tab, setTab] = useState('open')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    const r = await fetchReports()
    if (r.ok) setReports(r.reports)
  }, [fetchReports])

  useEffect(() => {
    load()
  }, [load])

  const onResolve = async (id) => {
    setBusy(id)
    await resolveReport(id)
    await load()
    setBusy('')
  }

  if (reports === null) return null

  const open = reports.filter((r) => !r.resolved)
  const shown = tab === 'open' ? open : reports.filter((r) => r.resolved)

  const targetLink = (r) => {
    if (r.targetType === 'user') {
      const u = getUser(r.targetId)
      return u ? `/profile/${encodeURIComponent(u.alias)}` : null
    }
    if (r.targetType === 'battle') return `/battles/${r.targetId}`
    return null
  }

  return (
    <div className="border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('mod.title')}</span>
          {open.length ? (
            <span className="border border-ink px-2 py-0.5 font-mono text-[10px] tnum text-ink">{open.length}</span>
          ) : null}
        </div>
        <div className="flex gap-px border border-line">
          {['open', 'resolved'].map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                tab === k ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {t(k === 'open' ? 'mod.open' : 'mod.resolvedTab')}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="px-6 py-8 font-mono text-[11px] text-muted">{t('mod.empty')}</p>
      ) : (
        <div className="divide-y divide-line">
          {shown.map((r) => {
            const link = targetLink(r)
            return (
              <div key={r.id} className="flex flex-wrap items-start gap-3 px-6 py-4">
                <span className="shrink-0 border border-line-bright px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
                  {t(`mod.type.${r.targetType}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[12px] text-ink">
                    {link ? (
                      <Link to={link} className="underline-offset-2 hover:underline">
                        {r.context || r.targetId}
                      </Link>
                    ) : (
                      r.context || r.targetId
                    )}
                  </div>
                  <div className="mt-1 break-words font-mono text-[11px] leading-relaxed text-muted">{r.reason || '—'}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                    {t('mod.reportedBy', { alias: r.reporter?.alias || '?' })} · {fmtDate(r.createdAt)}
                  </div>
                </div>
                {!r.resolved ? (
                  <button
                    onClick={() => onResolve(r.id)}
                    disabled={busy === r.id}
                    className="shrink-0 border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-40"
                  >
                    {t('mod.resolve')}
                  </button>
                ) : (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    ✓ {t('mod.resolved')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
