import webpush from 'web-push'
import { db } from './db.js'

// Web push is configured purely through env (set in Coolify). Generate a keypair
// once with `npx web-push generate-vapid-keys` and store both halves; with
// nothing set, push degrades to a no-op (subscriptions just never fire).
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

export const pushConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
export const vapidPublicKey = VAPID_PUBLIC_KEY || null

if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:info@artnomad.nl', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

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
  if (!pushConfigured || !userId) return
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE userId=?').all(userId)
  if (!subs.length) return
  const body = JSON.stringify(payload)
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
