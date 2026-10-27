import { api } from '../api.js'

// Web-push client helpers. All no-op gracefully on unsupported browsers.
export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export const pushPermission = () => (pushSupported() ? Notification.permission : 'denied')

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// The SW is only auto-registered in prod; register on demand so opting into
// push works everywhere.
async function ensureRegistration() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return navigator.serviceWorker.ready
  await navigator.serviceWorker.register('/sw.js')
  return navigator.serviceWorker.ready
}

// Request permission + subscribe. Returns { ok, permission, error }.
export async function enablePush() {
  if (!pushSupported()) return { ok: false, error: 'unsupported' }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, permission }
  const keyResp = await api.get('/api/push/key')
  if (!keyResp.configured || !keyResp.key) return { ok: false, permission, error: 'not-configured' }
  const reg = await ensureRegistration()
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyResp.key),
    })
  }
  const r = await api.post('/api/push/subscribe', { subscription: sub.toJSON() })
  return { ok: !!r.ok, permission }
}

export async function disablePush() {
  if (!pushSupported()) return { ok: true }
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (sub) {
    await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint })
    await sub.unsubscribe()
  }
  return { ok: true }
}

export async function isPushSubscribed() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  return !!(await reg.pushManager.getSubscription())
}
