import { useTheme } from '../context/ThemeContext.jsx'
import { useT } from '../i18n/index.jsx'

// Dark / Light switch — square, mono, matches the SMPL chrome.
export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()
  const t = useT()
  return (
    <div className={`inline-flex items-center border border-line ${className}`} role="group" aria-label="theme">
      {['dark', 'light'].map((m) => (
        <button
          key={m}
          onClick={() => setTheme(m)}
          aria-pressed={theme === m}
          className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            theme === m ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
          }`}
        >
          {t(`theme.${m}`)}
        </button>
      ))}
    </div>
  )
}
