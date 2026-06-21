import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { IconSend } from './icons.jsx'

// Inbox shortcut with an unread dot — used in the nav + app top bar. Boxless,
// sized to match the alerts bell on the other side of the header.
export default function MessagesLink({ className = '' }) {
  const { currentUser, unreadMessages } = useApp()
  if (!currentUser) return null
  return (
    <Link
      to="/messages"
      aria-label="messages"
      title="Messages"
      className={`relative inline-flex items-center text-ink transition-colors hover:text-accent ${className}`}
    >
      <IconSend size={20} />
      {unreadMessages > 0 ? (
        <span
          className="absolute -right-1.5 -top-1 h-2.5 w-2.5 border border-bg bg-accent"
          aria-label="unread messages"
        />
      ) : null}
    </Link>
  )
}
