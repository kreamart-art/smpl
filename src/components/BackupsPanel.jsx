import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { fmtDate } from '../utils/wave.js'

// Curator-only view on the automated DB snapshots, with a manual "back up now".
// Renders nothing for non-curators (the API 403s and `backups` never loads).
export default function BackupsPanel() {
  const t = useT()
  const { fetchBackups, triggerBackup } = useApp()
  const [backups, setBackups] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const r = await fetchBackups()
    if (r.ok) setBackups(r.backups)
  }, [fetchBackups])

  useEffect(() => {
    load()
  }, [load])

  if (backups === null) return null

  const latest = backups[0]
  const run = async () => {
    setBusy(true)
    setMsg('')
    const r = await triggerBackup()
    setBusy(false)
    setMsg(r.ok ? t('backup.done') : r.error || t('backup.failed'))
    if (r.ok) await load()
  }

  return (
    <div className="border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{t('backup.title')}</span>
        <button
          onClick={run}
          disabled={busy}
          className="border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          {busy ? t('backup.running') : t('backup.runNow')}
        </button>
      </div>
      <div className="px-6 py-4">
        {backups.length === 0 ? (
          <p className="font-mono text-[11px] leading-relaxed text-muted">{t('backup.none')}</p>
        ) : (
          <>
            <div className="font-mono text-[12px] text-ink">
              {fmtDate(latest.at)} · {Math.round(latest.size / 1024)} KB
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {t('backup.latest')} · {t('backup.kept', { n: backups.length })}
            </div>
          </>
        )}
        {msg ? <p className="mt-3 font-mono text-[11px] text-ink">{msg}</p> : null}
      </div>
    </div>
  )
}
