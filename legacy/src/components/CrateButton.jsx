// "Crate" a beat/verse — save it to your profile crate. NOT a like: there is no
// public counter here, it never affects voting. Shown on beats you can hear
// (voting onward). Crate-digging language, not a heart.
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { IconCrate } from './icons.jsx'
import { useT } from '../i18n/index.jsx'

export default function CrateButton({ submissionId, className = '' }) {
  const { currentUser, isCrated, crateBeat, uncrateBeat } = useApp()
  const t = useT()
  const [busy, setBusy] = useState(false)
  if (!currentUser) return null
  const on = isCrated(submissionId)
  const toggle = async () => {
    setBusy(true)
    if (on) await uncrateBeat(submissionId)
    else await crateBeat(submissionId)
    setBusy(false)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      title={on ? t('crate.remove') : t('crate.add')}
      className={`flex h-11 touch-manipulation items-center gap-1.5 border px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
        on ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
      } ${className}`}
    >
      <IconCrate size={14} />
      <span>{on ? t('crate.saved') : t('crate.save')}</span>
    </button>
  )
}
