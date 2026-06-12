import crypto from 'node:crypto'

// Prototype secret — override with SMPL_SECRET in any real deployment.
const SECRET = process.env.SMPL_SECRET || 'smpl-dev-secret-change-me'

export function hashPassword(pw) {
  if (!pw) return null
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

// Real check: a stored hash requires the right password. Accounts with no hash
// (legacy) are still allowed so the platform never hard-locks anyone out.
export function verifyPassword(pw, stored) {
  if (!stored) return true
  if (!pw) return false
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(test, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

export function signToken(payload, ttl = TTL) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttl })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (data.exp && data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

// ===========================================================================
// TOTP (RFC 6238) — authenticator-app 2FA. No SMS, no third party: the secret
// lives in the user's row and is verified here with node:crypto only.
// ===========================================================================
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function randomBase32(bytes = 20) {
  const buf = crypto.randomBytes(bytes)
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, '0')
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function hotp(secretBuf, counter) {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return code % 1_000_000
}

// Accept the current 30s window ± `window` steps (clock-skew tolerance).
export function verifyTotp(secretB32, token, window = 1) {
  const t = String(token || '').replace(/\D/g, '')
  if (t.length !== 6) return false
  const secret = base32Decode(secretB32)
  if (!secret.length) return false
  const counter = Math.floor(Date.now() / 1000 / 30)
  for (let w = -window; w <= window; w++) {
    const expect = String(hotp(secret, counter + w)).padStart(6, '0')
    if (crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(t))) return true
  }
  return false
}

export function otpauthURL(secretB32, account, issuer = 'SMPL') {
  const params = new URLSearchParams({
    secret: secretB32,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?${params.toString()}`
}

// One-time backup codes, shown once and stored only as sha256 hashes.
export function makeBackupCodes(n = 8) {
  const codes = []
  for (let i = 0; i < n; i++) {
    const raw = randomBase32(7).slice(0, 10)
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`)
  }
  return codes
}

export function hashBackup(code) {
  const norm = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return crypto.createHash('sha256').update(norm).digest('hex')
}
