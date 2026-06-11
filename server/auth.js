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

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TTL })).toString('base64url')
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
