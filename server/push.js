import webpush from 'web-push'
import { db } from './db.js'
import { sendNative } from './nativepush.js'

// Web push is configured purely through env (set in Coolify). Generate a keypair
// once with `npx web-push generate-vapid-keys` and store both halves; with
// nothing set, push degrades to a no-op (subscriptions just never fire).
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

// Only enable push if the VAPID keys are VALID. setVapidDetails throws on a
// malformed/truncated key — never let that crash the whole server; just log it
// and run with push disabled.
let ready = false
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:info@artnomad.nl', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    ready = true
  } catch (e) {
    console.error('[push] invalid VAPID config — push disabled:', e.message)
  }
}

export const pushConfigured = ready
export const vapidPublicKey = ready ? VAPID_PUBLIC_KEY : null

export function saveSubscription(userId, sub) {
  if (!sub?.endpoint) return
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint, userId, p256dh, auth, createdAt)
     VALUES (?,?,?,?,?)
     ON CONFLICT(endpoint) DO UPDATE SET userId=excluded.userId, p256dh=excluded.p256dh, auth=excluded.auth`,
  ).run(sub.endpoint, userId, sub.keys?.p256dh || '', sub.keys?.auth || '', Date.now())
}

export function removeSubscription(endpoint) {
  if (endpoint) db.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').run(endpoint)
}

// Fire-and-forget push to every device a user has registered. Dead endpoints
// (410 Gone / 404) are pruned so the table self-heals.
export async function sendPush(userId, payload) {
  if (!userId) return
  // Attach the recipient's unread-DM count so the service worker can set the
  // home-screen app-icon badge (number on the icon), even with the app closed.
  let full = payload
  try {
    const badgeCount = db
      .prepare('SELECT COUNT(*) AS c FROM messages WHERE toId = ? AND readAt IS NULL')
      .get(userId).c
    full = { ...payload, badgeCount }
  } catch {
    /* messages table unavailable — send without a badge count */
  }
  // native devices (iOS/Android via the app) — graceful no-op if unconfigured
  sendNative(userId, full).catch(() => {})
  // web push (installed PWA / desktop browsers)
  if (!pushConfigured) return
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE userId=?').all(userId)
  if (!subs.length) return
  const body = JSON.stringify(full)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) removeSubscription(s.endpoint)
      }
    }),
  )
}
