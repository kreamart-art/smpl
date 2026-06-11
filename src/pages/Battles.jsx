import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import BattleCard from '../components/BattleCard.jsx'
import Reveal from '../components/Reveal.jsx'
import { STATUS_GROUP, STATUS_INDEX } from '../data/status.js'

const FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'active', label: 'ACTIVE' },
  { key: 'upcoming', label: 'UPCOMING' },
  { key: 'past', label: 'PAST' },
]

// Active battles first, then upcoming, then past.
const GROUP_RANK = { active: 0, upcoming: 1, past: 2 }

export default function Battles() {
  const { battles } = useApp()
  const [filter, setFilter] = useState('all')
  const [kind, setKind] = useState('all')

  const counts = useMemo(() => {
    const c = { all: battles.length, active: 0, upcoming: 0, past: 0 }
    for (const b of battles) c[STATUS_GROUP[b.status]]++
    return c
  }, [battles])

  const sorted = useMemo(() => {
    const list = battles.filter(
      (b) =>
        (filter === 'all' || STATUS_GROUP[b.status] === filter) &&
        (kind === 'all' || (b.kind || 'BEATS') === kind),
    )
    return [...list].sort((a, b) => {
      const ga = GROUP_RANK[STATUS_GROUP[a.status]]
      const gb = GROUP_RANK[STATUS_GROUP[b.status]]
      if (ga !== gb) return ga - gb
      // within a group, later phase first
      return STATUS_INDEX[b.status] - STATUS_INDEX[a.status]
    })
  }, [battles, filter, kind])

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono text-[13px] text-faint tnum">A1</span>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
              The archive
            </div>
            <h1 className="font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Battles
            </h1>
          </div>
        </div>
        <div className="flex w-full items-stretch border border-line sm:w-auto sm:items-center">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 whitespace-nowrap px-2 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-300 sm:flex-none sm:px-4 sm:text-[11px] sm:tracking-[0.18em] ${
                filter === f.key ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-50 tnum">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Type</span>
        {[
          { k: 'all', label: 'ALL' },
          { k: 'BEATS', label: '≋ BEATS' },
          { k: 'VERSES', label: '✎ VERSES' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setKind(t.k)}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
              kind === t.k
                ? 'border-ink bg-ink text-bg'
                : 'border-line text-muted hover:border-line-bright hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sorted.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b, i) => (
            <Reveal key={b.id} delay={i * 60}>
              <BattleCard battle={b} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="mt-12 font-mono text-sm text-muted">Nothing in this bucket yet.</p>
      )}
    </div>
  )
}
