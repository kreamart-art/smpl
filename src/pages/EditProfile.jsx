import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Editor } from './Profile.jsx'

// Dedicated full page for editing your own profile (avatar, bio, location,
// genres, contact email, links). Reached from the profile's "Edit" button.
export default function EditProfile() {
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const t = useT()
  if (!currentUser) return <Navigate to="/login" replace />
  const toProfile = () => navigate(`/profile/${encodeURIComponent(currentUser.alias)}`)
  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={toProfile}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {t('common.profile')}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
          {t('profile.editProfile')}
        </span>
      </div>
      <Editor user={currentUser} onClose={toProfile} />
    </div>
  )
}
