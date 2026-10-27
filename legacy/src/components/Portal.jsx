import { createPortal } from 'react-dom'

// Render children at <body> level, escaping any transformed/filtered ancestor
// (e.g. the .fadein route wrapper) that would otherwise become the containing
// block for position:fixed overlays and push them off-screen.
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
