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

  useEffect(() => {
    if (!isNative || !currentUser) return
    initNativePush(registerDevice, (url) => navigate(url))
  }, [currentUser, registerDevice, navigate])

  return null
}
