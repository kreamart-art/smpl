// Minimal monochrome line icons (square, brutalist) for the app tab bar etc.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
}

function Svg({ size = 22, className = '', children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      {children}
    </svg>
  )
}

export function IconBattles(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </Svg>
  )
}

// trophy — the Battles tab
export function IconTrophy(props) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1.5a3 3 0 0 0 3 3" />
      <path d="M17 5h3v1.5a3 3 0 0 1-3 3" />
      <line x1="12" y1="13" x2="12" y2="16" />
      <path d="M10 16l-.5 4M14 16l.5 4" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </Svg>
  )
}

// game controller (joy-con) — the Play tab
export function IconGamepad(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="8" width="18" height="9" rx="4.5" />
      <line x1="7" y1="10.6" x2="7" y2="14.4" />
      <line x1="5.1" y1="12.5" x2="8.9" y2="12.5" />
      <circle cx="16" cy="11.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.6" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconCrate(props) {
  return (
    <Svg {...props}>
      <path d="M3 7h18l-1.4 13H4.4L3 7Z" />
      <path d="M3 7l2-3h14l2 3" />
      <line x1="9.5" y1="11.5" x2="14.5" y2="11.5" />
    </Svg>
  )
}

export function IconPause(props) {
  return (
    <Svg {...props}>
      <rect x="6" y="5" width="3.5" height="14" fill="currentColor" stroke="none" />
      <rect x="14.5" y="5" width="3.5" height="14" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconStats(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="12" width="4" height="8" />
      <rect x="10" y="7" width="4" height="13" />
      <rect x="16" y="4" width="4" height="16" />
    </Svg>
  )
}

export function IconPeople(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.1" />
      <path d="M3 19c0-3 2.6-4.8 6-4.8s6 1.8 6 4.8" />
      <path d="M16 5.1a3.1 3.1 0 0 1 0 5.8" />
      <path d="M17.6 14.4c2.2.5 3.8 1.9 3.8 4.5" />
    </Svg>
  )
}

export function IconImage(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M3 17l5-5 4 4 3-3 6 6" />
    </Svg>
  )
}

export function IconMic(props) {
  return (
    <Svg {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </Svg>
  )
}

export function IconVolume(props) {
  return (
    <Svg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </Svg>
  )
}

export function IconMuted(props) {
  return (
    <Svg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 9l5 6" />
      <path d="M21 9l-5 6" />
    </Svg>
  )
}

export function IconPlay(props) {
  return (
    <Svg {...props}>
      <path d="M7 4.8l12 7.2-12 7.2Z" fill="currentColor" stroke="currentColor" />
    </Svg>
  )
}

export function IconFeed(props) {
  return (
    <Svg {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </Svg>
  )
}

export function IconBell(props) {
  return (
    <Svg {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  )
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.4 3-5.4 7-5.4s7 2 7 5.4" />
    </Svg>
  )
}

export function IconSettings(props) {
  return (
    <Svg {...props}>
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <rect x="13" y="6" width="4" height="4" />
      <rect x="7" y="14" width="4" height="4" />
    </Svg>
  )
}

export function IconLogout(props) {
  return (
    <Svg {...props}>
      <path d="M14 4H6v16h8" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <path d="M18 9l3 3-3 3" />
    </Svg>
  )
}

export function IconDownload(props) {
  return (
    <Svg {...props}>
      <line x1="12" y1="3" x2="12" y2="15" />
      <path d="M7 11l5 5 5-5" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </Svg>
  )
}

export function IconShare(props) {
  return (
    <Svg {...props}>
      <line x1="12" y1="3" x2="12" y2="15" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v8h14v-8" />
    </Svg>
  )
}

export function IconPoster(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="3" width="16" height="18" />
      <path d="M4 15l4-4 3 3 4-5 5 6" />
      <circle cx="9.5" cy="8" r="1.4" />
    </Svg>
  )
}

export function IconMessage(props) {
  return (
    <Svg {...props}>
      <path d="M4 5h16v11H9l-4 4v-4H4z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="12.5" x2="13" y2="12.5" />
    </Svg>
  )
}

export function IconGlobe(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </Svg>
  )
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  )
}

export function IconTrash(props) {
  return (
    <Svg {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 7V4h4v3" />
    </Svg>
  )
}
