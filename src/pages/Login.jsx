import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Waveform from '../components/Waveform.jsx'
import { Btn, Field, inputCls, Label } from '../components/ui.jsx'

const QUICK = [
  { email: 'curator@smpl.app', label: 'Curator', sub: 'manage battles' },
  { email: 'koder@smpl.app', label: 'KODER', sub: 'producer' },
  { email: 'listener@smpl.app', label: 'earwitness', sub: 'listener' },
]

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const go = async (mail, pw) => {
    const r = await login(mail, pw)
    if (!r.ok) {
      setError(r.error)
      return
    }
    navigate(r.me?.role === 'curator' ? '/dashboard' : '/battles')
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Access</div>
        <div className="mt-4 font-sans text-[clamp(2.5rem,6vw,5rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          Log
          <br />
          in.
        </div>
        <p className="mt-6 max-w-sm font-mono text-[12px] leading-relaxed text-muted">
          Mock auth — no password is checked. Use a quick-login chip or any seeded email to enter
          the room.
        </p>
        <div className="mt-10">
          <Waveform seed="login-wave" bars={96} height={56} baseClass="bg-line-bright" />
        </div>
      </div>

      <div className="border border-line bg-panel p-6 sm:p-8">
        <h1 className="font-sans text-2xl font-bold uppercase tracking-tight">Login</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            go(email, password)
          }}
          className="mt-6 space-y-4"
        >
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              placeholder="you@smpl.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Password" hint="required">
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error ? (
            <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
          ) : null}
          <Btn type="submit" variant="solid" size="lg" full>Enter</Btn>
        </form>

        <div className="mt-8">
          <Label>Quick login</Label>
          <p className="mt-1 font-mono text-[10px] text-faint">All demo accounts · password “smpl”</p>
          <div className="mt-3 grid gap-2">
            {QUICK.map((q) => (
              <button
                key={q.email}
                onClick={() => {
                  setError('')
                  go(q.email, 'smpl')
                }}
                className="flex items-center justify-between border border-line px-4 py-3 text-left transition-colors hover:border-ink"
              >
                <div>
                  <div className="font-mono text-[12px] text-ink">{q.label}</div>
                  <div className="font-mono text-[10px] text-muted">{q.email}</div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{q.sub} ▸</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 font-mono text-[11px] text-muted">
          No account?{' '}
          <Link to="/signup" className="text-ink underline underline-offset-4">Sign up ▸</Link>
        </p>
      </div>
    </div>
  )
}
