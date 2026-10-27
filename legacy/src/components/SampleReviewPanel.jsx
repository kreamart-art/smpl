import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'

// Admin-only: approve/reject sample-maker applications + submitted samples.
export default function SampleReviewPanel() {
  const { fetchSampleReview, reviewSampleMaker, reviewSample } = useApp()
  const [data, setData] = useState({ applicants: [], samples: [] })
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => {
    fetchSampleReview().then((r) => r?.ok && setData({ applicants: r.applicants || [], samples: r.samples || [] }))
  }, [fetchSampleReview])
  useEffect(() => {
    load()
  }, [load])

  const act = async (kind, id, status) => {
    setBusy(kind + id)
    if (kind === 'maker') await reviewSampleMaker(id, status)
    else await reviewSample(id, status)
    setBusy(null)
    load()
  }

  const { applicants, samples } = data
  const Approve = ({ kind, id }) => (
    <button
      disabled={busy === kind + id}
      onClick={() => act(kind, id, 'approved')}
      className="shrink-0 border border-line-bright px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
    >
      Approve
    </button>
  )
  const Reject = ({ kind, id }) => (
    <button
      disabled={busy === kind + id}
      onClick={() => act(kind, id, 'rejected')}
      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink disabled:opacity-40"
    >
      Reject
    </button>
  )

  return (
    <div className="border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="font-sans text-lg font-bold uppercase tracking-tight">Sample makers</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {applicants.length + samples.length} pending
        </span>
      </div>
      {!applicants.length && !samples.length ? (
        <p className="px-6 py-6 font-mono text-[12px] text-muted">Nothing to review.</p>
      ) : (
        <div className="divide-y divide-line">
          {applicants.length ? (
            <div className="px-6 py-4">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Applications</div>
              <div className="space-y-2.5">
                {applicants.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[12px] text-ink">@{a.alias}</span>
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        {a.role} · {a.model}
                      </span>
                    </div>
                    <Approve kind="maker" id={a.id} />
                    <Reject kind="maker" id={a.id} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {samples.length ? (
            <div className="px-6 py-4">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Submitted samples</div>
              <div className="space-y-3">
                {samples.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3">
                    <audio src={s.file} controls preload="none" className="h-8 w-44" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[12px] text-ink">{s.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        {s.genre}
                        {s.bpm ? ` · ${s.bpm}bpm` : ''}
                        {s.key ? ` · ${s.key}` : ''} · @{s.maker}
                      </div>
                    </div>
                    <Approve kind="sample" id={s.id} />
                    <Reject kind="sample" id={s.id} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
