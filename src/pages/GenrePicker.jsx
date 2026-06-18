// Dedicated page for choosing the genres shown on your profile. Reached from the
// genres bar in the editor. Browse / search the catalogue and tap to toggle,
// multiple allowed up to MAX_GENRES. Each change saves straight away. Genres are
// public (they show on the profile) — this just makes them pickable, not typed.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { inputCls } from '../components/ui.jsx'
import { GENRES, MAX_GENRES } from '../data/genres.js'
import { useT } from '../i18n/index.jsx'

export default function GenrePicker() {
  const { currentUser, updateProfile } = useApp()
  const navigate = useNavigate()
  const t = useT()
  const [selected, setSelected] = useState(() => (currentUser?.genres || []).filter(Boolean))
  const [q, setQ] = useState('')

  if (!currentUser) return <Navigate to="/login" replace />

  const selLower = new Set(selected.map((s) => s.toLowerCase()))
  const isOn = (g) => selLower.has(g.toLowerCase())

  const toggle = (g) => {
    const lower = g.toLowerCase()
    let next
    if (isOn(g)) next = selected.filter((s) => s.toLowerCase() !== lower)
    else if (selected.length >= MAX_GENRES) return // at the cap
    else next = [...selected, g] // store the catalogue's canonical casing
    setSelected(next)
    updateProfile({ genres: next }) // persist immediately
  }

  const query = q.trim().toLowerCase()
  // selected genres not in the catalogue (e.g. older free-text ones) sit on top,
  // matched case-insensitively so catalogue entries never show up twice
  const catalogueLower = new Set(GENRES.map((g) => g.toLowerCase()))
  const custom = selected.filter((s) => !catalogueLower.has(s.toLowerCase()))
  const list = [...custom, ...GENRES].filter((g) => g.toLowerCase().includes(query))
  const full = selected.length >= MAX_GENRES

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/edit-profile')}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {t('profile.editProfile')}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">{t('profile.field.genres')}</span>
      </div>

      <div className="border border-line-bright bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t('profile.genrePick')}</span>
          <span className="font-mono text-[11px] tnum text-muted">
            {selected.length} / {MAX_GENRES}
          </span>
        </div>
        <p className="px-5 pt-3 font-mono text-[10px] leading-relaxed text-muted">
          {t('profile.genreHint', { max: MAX_GENRES })}
        </p>

        <div className="p-5 pt-3">
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('profile.genreSearch')}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="max-h-[58vh] overflow-y-auto border-t border-line">
          {list.length ? (
            list.map((g) => {
              const on = isOn(g)
              const disabled = full && !on
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle(g)}
                  disabled={disabled}
                  className={`flex w-full items-center justify-between border-b border-line px-5 py-3.5 text-left font-mono text-[12px] uppercase tracking-[0.1em] transition-colors last:border-b-0 ${
                    on ? 'bg-ink text-bg' : disabled ? 'text-faint' : 'text-ink-dim hover:bg-bg'
                  }`}
                >
                  <span>{g}</span>
                  <span>{on ? '✓' : disabled ? '' : '+'}</span>
                </button>
              )
            })
          ) : (
            <div className="px-5 py-6 font-mono text-[11px] text-muted">{t('profile.genreNone')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
