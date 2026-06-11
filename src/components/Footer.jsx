import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mt-28 border-t border-line">
      <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">
          SMPL — Vol. 001 / Beats &amp; verses · anonymous battles
        </div>
        <div className="mt-8 font-sans text-[clamp(2.6rem,11vw,9rem)] font-bold uppercase leading-[0.82] tracking-tighter">
          Same sample.
          <br />
          <span className="text-ink-dim">Different soul.</span>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-8 border-t border-line pt-8 sm:grid-cols-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Platform</div>
            <div className="mt-4 flex flex-col gap-2.5 font-mono text-xs">
              <Link to="/battles" className="text-ink-dim transition-colors hover:text-ink">Battles</Link>
              <Link to="/people" className="text-ink-dim transition-colors hover:text-ink">People</Link>
              <Link to="/signup" className="text-ink-dim transition-colors hover:text-ink">Sign up</Link>
              <Link to="/login" className="text-ink-dim transition-colors hover:text-ink">Login</Link>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Phases</div>
            <div className="mt-4 flex flex-col gap-2.5 font-mono text-xs text-muted">
              <span>01 / Announced</span>
              <span>02 / Signup</span>
              <span>03 / Submission</span>
              <span>04 / Voting</span>
              <span>05 / Winner</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Ethos</div>
            <div className="mt-4 font-mono text-xs leading-relaxed text-muted">
              Anonymous votes. No names until the room has spoken. The work stands alone.
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Colophon</div>
            <div className="mt-4 font-mono text-xs leading-relaxed text-muted">
              SMPL v1.0
              <br />
              Prototype build
              <br />
              Black / off-white / mono
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
