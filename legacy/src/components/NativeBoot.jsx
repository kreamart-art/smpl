import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { isNative } from '../lib/native.js'
import { initNativePush } from '../lib/pushNative.js'

// Registers the native device for push once a user is logged in (native only).
// Renders nothing; lives inside the Router so it can deep-link on tap.
export default function NativeBoot() {
  const { currentUser, registerDevice } = useApp()
  const navigate = useNavigate()
  // the id, not the object: registering re-fetches the bootstrap, which hands
  // back a new currentUser object (keyed on that, it would register forever)
  const uid = currentUser?.id

  useEffect(() => {
    if (!isNative || !uid) return
    initNativePush(registerDevice, (url) => navigate(url))
  }, [uid, registerDevice, navigate])

  return null
}
