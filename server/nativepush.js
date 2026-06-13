import crypto from 'node:crypto'
import http2 from 'node:http2'
import { db } from './db.js'

// ===========================================================================
// Native push (Capacitor app): APNs for iOS, FCM for Android. Uses only Node's
// built-in crypto/http2/fetch — no SDKs. Entirely graceful: if the relevant
// credentials aren't set, sending is a no-op (just like web push).
// ===========================================================================

export function saveDeviceToken(userId, token, platform) {
  if (!token || !userId) return
  const p = platform === 'ios' ? 'ios' : 'android'
  db.prepare(
    `INSERT INTO device_tokens (token, userId, platform, createdAt) VALUES (?,?,?,?)
     ON CONFLICT(token) DO UPDATE SET userId = excluded.userId, platform = excluded.platform`,
  ).run(token, userId, p, Date.now())
}
export function removeDeviceToken(token) {
  if (token) db.prepare('DELETE FROM device_tokens WHERE token = ?').run(token)
}
const dropToken = (token) => db.prepare('DELETE FROM device_tokens WHERE token = ?').run(token)

// ----- APNs (iOS), token-based (.p8) over HTTP/2 -----------------------------
const APNS = {
  key: process.env.APNS_KEY, // contents of the AuthKey_XXXX.p8
  keyId: process.env.APNS_KEY_ID,
  teamId: process.env.APNS_TEAM_ID,
  bundleId: process.env.APNS_BUNDLE_ID || 'nl.artnomad.smpl',
  host: process.env.APNS_HOST || 'api.push.apple.com', // sandbox: api.sandbox.push.apple.com
}
const apnsConfigured = !!(APNS.key && APNS.keyId && APNS.teamId)
let apnsJwt = { token: null, at: 0 }
function apnsToken() {
  const now = Math.floor(Date.now() / 1000)
  if (apnsJwt.token && now - apnsJwt.at < 2400) return apnsJwt.token // refresh ~40 min
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: APNS.keyId })).toString('base64url')
  const claims = Buffer.from(JSON.stringify({ iss: APNS.teamId, iat: now })).toString('base64url')
  const signer = crypto.createSign('SHA256')
  signer.update(`${header}.${claims}`)
  const sig = signer.sign({ key: APNS.key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
  apnsJwt = { token: `${header}.${claims}.${sig}`, at: now }
  return apnsJwt.token
}
function sendApns(deviceToken, payload) {
  return new Promise((resolve) => {
    let jwt
    try {
      jwt = apnsToken()
    } catch {
      return resolve(false)
    }
    let session
    try {
      session = http2.connect(`https://${APNS.host}`)
    } catch {
      return resolve(false)
    }
    session.on('error', () => resolve(false))
    const body = JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' },
      url: payload.url || '/',
    })
    const req = session.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': APNS.bundleId,
      'apns-push-type': 'alert',
      'content-type': 'application/json',
    })
    let status = 0
    let data = ''
    req.on('response', (h) => {
      status = h[':status']
    })
    req.on('data', (c) => {
      data += c
    })
    req.on('end', () => {
      if (status === 410 || (status === 400 && /BadDeviceToken/.test(data))) dropToken(deviceToken)
      try {
        session.close()
      } catch {
        /* ignore */
      }
      resolve(status === 200)
    })
    req.on('error', () => {
      try {
        session.close()
      } catch {
        /* ignore */
      }
      resolve(false)
    })
    req.end(body)
  })
}

// ----- FCM (Android), HTTP v1 with a service account -------------------------
let FCM = null
try {
  if (process.env.FCM_SERVICE_ACCOUNT) FCM = JSON.parse(process.env.FCM_SERVICE_ACCOUNT)
} catch {
  FCM = null
}
const fcmConfigured = !!(FCM && FCM.client_email && FCM.private_key && FCM.project_id)
let fcmJwt = { token: null, at: 0 }
async function fcmAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  if (fcmJwt.token && now - fcmJwt.at < 3000) return fcmJwt.token
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claims = Buffer.from(
    JSON.stringify({
      iss: FCM.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url')
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const sig = signer.sign(FCM.private_key).toString('base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${claims}.${sig}`,
  })
  const j = await res.json()
  if (!j.access_token) throw new Error('FCM token exchange failed')
  fcmJwt = { token: j.access_token, at: now }
  return j.access_token
}
async function sendFcm(deviceToken, payload) {
  try {
    const at = await fcmAccessToken()
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM.project_id}/messages:send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: payload.title, body: payload.body },
          data: { url: String(payload.url || '/') },
        },
      }),
    })
    if (res.status === 404 || res.status === 400) {
      const txt = await res.text().catch(() => '')
      if (/UNREGISTERED|INVALID_ARGUMENT/.test(txt)) dropToken(deviceToken)
    }
    return res.ok
  } catch {
    return false
  }
}

export const nativeConfigured = apnsConfigured || fcmConfigured

// Best-effort push to every native device a user has registered.
export async function sendNative(userId, payload) {
  if (!nativeConfigured) return
  const rows = db.prepare('SELECT token, platform FROM device_tokens WHERE userId = ?').all(userId)
  for (const r of rows) {
    try {
      if (r.platform === 'ios' && apnsConfigured) await sendApns(r.token, payload)
      else if (r.platform === 'android' && fcmConfigured) await sendFcm(r.token, payload)
    } catch {
      /* best-effort */
    }
  }
}
