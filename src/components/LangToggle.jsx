import { useI18n } from '../i18n/index.jsx'

// EN / NL switch — square, mono, fits the SMPL chrome.
export default function LangToggle({ className = '' }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={`inline-flex items-center border border-line ${className}`} role="group" aria-label="language">
      {['en', 'nl'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            lang === l ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
