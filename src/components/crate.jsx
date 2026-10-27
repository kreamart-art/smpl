// Crate building blocks: the record-store / zine layer on top of the base UI
// (ui.jsx). Paper, sleeves, tape and stamps are physical materials, so they
// look the same in both themes.
import { Link } from 'react-router-dom'
import { mediaUrl } from '../api.js'
import { IconChevronRight, IconPlay, IconPause } from './icons.jsx'

export const catalogNo = (id) => `SMPL·${String(id || '').toUpperCase()}`

// Section header: mono kicker left, optional "see all" right, hairline below.
export function SectionHead({ title, to, more, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b border-line pb-2 ${className}`}>
      <h2 className="t-kicker text-ink">{title}</h2>
      {to && more ? (
        <Link to={to} className="t-kicker inline-flex items-center gap-1 text-muted transition-colors hover:text-ink">
          {more}
          <IconChevronRight size={12} />
        </Link>
      ) : null}
    </div>
  )
}

export function Kicker({ children, className = '' }) {
  return <div className={`t-kicker text-muted ${className}`}>{children}</div>
}

const DISPLAY_SIZES = {
  xl: 'text-[clamp(3.2rem,14vw,7.5rem)]',
  lg: 'text-[clamp(2.7rem,11vw,5.6rem)]',
  md: 'text-[clamp(2.1rem,8vw,3.6rem)]',
  sm: 'text-[clamp(1.6rem,6vw,2.4rem)]',
  xs: 'text-[1.35rem]',
}
export function DisplayTitle({ as: Tag = 'h1', size = 'lg', className = '', children }) {
  return <Tag className={`t-display ${DISPLAY_SIZES[size]} ${className}`}>{children}</Tag>
}

// Square artwork. Real artwork when there is some; otherwise a typographic
// sleeve (catalogue no., title, kind) so nothing pretends to be a photo.
export function Cover({ src, alt = '', title, id, kind, label, treatment, className = '', titleSize = 'sm' }) {
  if (src) {
    const tone = treatment === 'duo' ? 'duo-red' : ''
    return (
      <div className={`relative aspect-square overflow-hidden bg-panel ${tone} ${className}`}>
        <img
          src={mediaUrl(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${treatment === 'copy' ? 'photocopy' : ''}`}
        />
      </div>
    )
  }
  return <Sleeve title={title} id={id} kind={kind} label={label} titleSize={titleSize} className={className} />
}

export function Sleeve({ title, id, kind, label, titleSize = 'sm', className = '' }) {
  const sizes = { lg: 'text-[2.1rem]', md: 'text-[1.6rem]', sm: 'text-[1.15rem]', xs: 'text-[0.85rem]' }
  // thumbnail size: the title can't be read at this scale, so the sleeve shows
  // its initials large instead (still typographic, still distinct per release)
  if (titleSize === 'xs') {
    const initials = String(title || 'SMPL')
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
    return (
      <div
        className={`sleeve-grid relative flex aspect-square items-center justify-center overflow-hidden border border-line bg-panel-2 ${className}`}
        role="img"
        aria-label={title || 'SMPL'}
      >
        <span className="t-display text-[1.9rem] text-ink-dim">{initials || 'S'}</span>
      </div>
    )
  }
  return (
    <div
      className={`sleeve-grid relative flex aspect-square flex-col justify-between overflow-hidden border border-line bg-panel-2 p-[8%] ${className}`}
      role="img"
      aria-label={title || 'SMPL'}
    >
      <div className="flex items-start justify-between gap-2 font-mono text-[9px] uppercase leading-tight tracking-[0.12em] text-muted">
        <span className="truncate">{id ? catalogNo(id) : 'SMPL'}</span>
        {kind ? <span className="shrink-0 text-ink-dim">{label || kind}</span> : null}
      </div>
      <div className={`t-display line-clamp-3 break-words text-ink ${sizes[titleSize]}`}>{title || 'SMPL'}</div>
    </div>
  )
}

export function Tape({ className = '', rotate = -4, style }) {
  return <span aria-hidden="true" className={`tape ${className}`} style={{ '--tape-rot': `${rotate}deg`, ...style }} />
}

const STAMP_TONES = { accent: 'text-accent', oxblood: 'text-oxblood', ink: 'text-ink', paper: 'text-paper' }
export function Stamp({ children, tone = 'accent', rotate = -3, className = '' }) {
  return (
    <span className={`stamp text-[11px] ${STAMP_TONES[tone]} ${className}`} style={{ '--stamp-rot': `${rotate}deg` }}>
      {children}
    </span>
  )
}

export function PaperCard({ as: Tag = 'div', torn = false, className = '', children, ...rest }) {
  return (
    <Tag className={`paper relative ${torn ? 'torn-b pb-5' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

// Square play/pause. Paper fill is the default (the one bright control on a
// dark crate page); "line" sits quietly inside lists.
export function PlayButton({ playing, onClick, size = 44, label, variant = 'paper', disabled = false, className = '' }) {
  const look =
    variant === 'paper'
      ? 'bg-paper text-paper-ink hover:bg-bright'
      : 'border border-line-bright text-ink hover:bg-ink hover:text-bg'
  const icon = Math.round(size * 0.36)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label || (playing ? 'Pause' : 'Play')}
      className={`flex shrink-0 touch-manipulation items-center justify-center transition-colors disabled:opacity-35 ${look} ${className}`}
      style={{ width: size, height: size }}
    >
      {playing ? <IconPause size={icon} /> : <IconPlay size={icon} />}
    </button>
  )
}

// A small mono tag (genre, bpm, key). Plain text in a hairline box.
export function MetaTag({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center border border-line-bright px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim ${className}`}>
      {children}
    </span>
  )
}

// An honest empty state: what's missing and, optionally, the way to fill it.
export function EmptyState({ title, body, action, className = '' }) {
  return (
    <div className={`border border-dashed border-line-bright px-5 py-8 text-center ${className}`}>
      <div className="font-sans text-[15px] font-medium text-ink">{title}</div>
      {body ? <p className="mx-auto mt-2 max-w-sm font-sans text-[14px] leading-relaxed text-muted">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
