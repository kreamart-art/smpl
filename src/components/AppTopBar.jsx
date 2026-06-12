import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { STATUS } from '../data/status.js'
import LangToggle from './LangToggle.jsx'

// Minimal app header (standalone mode): just the wordmark + a quiet live count.
// No login/logout chrome — that lives under Profile.
export default function AppTopBar() {
  const { battles } = useApp()
  const live = battles.filter(
    (b) => b.status === STATUS.VOTING_PHASE || b.status === STATUS.SUBMISSION_PHASE,
  ).length

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center justify-between px-4">
        <LangToggle />
        <Link to="/battles" aria-label="SMPL — home">
          <img src="/logo.png" alt="SMPL" className="h-5 w-auto" />
        </Link>
        <span className="flex w-12 items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span className="block h-1.5 w-1.5 bg-ink pulse-dot" />
          {live}
        </span>
      </div>
    </header>
  )
}
