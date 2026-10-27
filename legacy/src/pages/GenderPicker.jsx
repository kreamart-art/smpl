// Dedicated page for setting gender. Reached from the "Gender" bar in Settings →
// Personal data. Private: stored with personal data, never shown on the public
// profile. Picking a non-text option saves immediately; "self-describe" adds a
// free-text field with its own save.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Field, inputCls } from '../components/ui.jsx'
import { useT } from '../i18n/index.jsx'

const GENDER_OPTIONS = ['woman', 'man', 'nonbinary', 'self', 'undisclosed']

export default function GenderPicker() {
  const { currentUser, updateProfile } = useApp()
  const navigate = useNavigate()
  const t = useT()
  const [gender, setGender] = useState(currentUser?.gender || '')
  const [text, setText] = useState(currentUser?.genderText || '')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!currentUser) return <Navigate to="/login" replace />

  const save = async (g, txt) => {
    setBusy(true)
    setSaved(false)
    const r = await updateProfile({ gender: g, genderText: g === 'self' ? txt : '' })
    setBusy(false)
    if (r.ok) setSaved(true)
  }
  const pick = (g) => {
    setGender(g)
    if (g === 'self') setSaved(false)
    else {
      setText('')
      save(g, '') // non-text options save on tap
    }
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/settings')}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {t('common.settings')}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">{t('profile.gender.label')}</span>
      </div>

      <div className="border border-line-bright bg-panel">
        <div className="divide-y divide-line">
          {GENDER_OPTIONS.map((opt) => {
            const on = gender === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(opt)}
                disabled={busy}
                className={`flex w-full items-center justify-between px-5 py-4 text-left font-mono text-[12px] uppercase tracking-[0.1em] transition-colors hover:bg-bg disabled:opacity-60 ${
                  on ? 'text-ink' : 'text-ink-dim'
                }`}
              >
                <span>{t(`profile.gender.${opt}`)}</span>
                <span className={on ? 'text-ink' : 'text-faint'}>{on ? '●' : '○'}</span>
              </button>
            )
          })}
        </div>

        {gender === 'self' ? (
          <div className="space-y-3 border-t border-line p-5">
            <Field label={t('profile.gender.selfLabel')}>
              <input
                className={inputCls}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setSaved(false)
                }}
                placeholder={t('profile.gender.selfPlaceholder')}
                maxLength={60}
              />
            </Field>
            <button
              onClick={() => save('self', text)}
              disabled={busy}
              className="border border-line-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
            >
              {busy ? t('profile.saving') : t('common.save')}
            </button>
          </div>
        ) : null}

        <div className="border-t border-line px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">
          {saved ? `✓ ${t('profile.saved')}` : t('profile.gender.privateNote')}
        </div>
      </div>
    </div>
  )
}
