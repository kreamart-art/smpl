import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { IconMessage } from './icons.jsx'

// Inbox shortcut with an unread badge — used in the nav + app top bar.
export default function MessagesLink({ className = '' }) {
  const { currentUser, unreadMessages } = useApp()
  if (!currentUser) return null
  return (
    <Link
      to="/messages"
      aria-label="messages"
      className={`relative flex h-9 w-9 items-center justify-center border border-line text-muted transition-colors hover:border-line-bright hover:text-ink ${className}`}
    >
      <IconMessage size={15} />
      {unreadMessages > 0 ? (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 border border-bg bg-verified"
          aria-label="unread messages"
        />
      ) : null}
    </Link>
  )
}
