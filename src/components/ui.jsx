import { Link } from 'react-router-dom'

export function Btn({
  to,
  href,
  onClick,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  disabled = false,
  type = 'button',
  full = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.18em] border transition-all duration-300 select-none whitespace-nowrap'
  const sizes = {
    sm: 'text-[10px] px-3 h-8',
    md: 'text-[11px] px-4 h-10',
    lg: 'text-[12px] px-7 h-13',
  }
  const variants = {
    solid: 'bg-ink text-bg border-ink hover:bg-bright hover:border-bright',
    ghost: 'bg-transparent text-ink border-line-bright hover:border-ink hover:bg-panel',
    dim: 'bg-transparent text-muted border-line hover:text-ink hover:border-line-bright',
  }
  const cls = [
    base,
    sizes[size],
    variants[variant],
    full ? 'w-full' : '',
    disabled ? 'opacity-35 pointer-events-none' : '',
    className,
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
      {children}
    </button>
  )
}

export function Tag({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-line px-2 py-1 ${className}`}
    >
      {children}
    </span>
  )
}

export function Label({ children, className = '' }) {
  return (
    <div
      className={`font-mono text-[10px] uppercase tracking-[0.22em] text-muted ${className}`}
    >
      {children}
    </div>
  )
}

export function Stat({ label, value, sub }) {
  return (
    <div className="border border-line p-4">
      <Label>{label}</Label>
      <div className="mt-2 font-mono text-3xl text-ink tnum leading-none">{value}</div>
      {sub ? <div className="mt-1 font-mono text-[10px] text-muted">{sub}</div> : null}
    </div>
  )
}

export function Panel({ children, className = '' }) {
  return <div className={`border border-line bg-panel ${className}`}>{children}</div>
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint ? <span className="font-mono text-[10px] text-muted">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  )
}

export const inputCls =
  'w-full bg-bg border border-line text-ink font-mono text-sm px-3 h-11 outline-none focus:border-ink placeholder:text-muted'
export const textareaCls =
  'w-full bg-bg border border-line text-ink font-sans text-sm px-3 py-3 outline-none focus:border-ink placeholder:text-muted resize-none'

export function SectionTitle({ index, title, right }) {
  return (
    <div className="flex items-end justify-between border-b border-line pb-3 mb-6">
      <div className="flex items-baseline gap-3">
        {index ? <span className="font-mono text-[11px] text-muted">{index}</span> : null}
        <h2 className="font-sans font-semibold uppercase tracking-wide text-lg">{title}</h2>
      </div>
      {right}
    </div>
  )
}
