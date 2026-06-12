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
