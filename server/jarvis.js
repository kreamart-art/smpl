// How SMPL is doing, for JARVIS (the owner's desktop app). Counts only: people, sign-ups, who was
// around, battles, beats and votes. No names, no e-mail, no ids leave. Off until JARVIS_STATS_KEY is
// set; JARVIS sends that key as a bearer token. The house accounts (admin, @SMPL) and the demo
// accounts of the seed are not counted as people.
import { timingSafeEqual } from 'node:crypto'
import { seedUsers } from '../src/data/mock.js'

export const DAYS = 30
const DAY = 86_400_000

/** null: the endpoint is off. Else whether the key matches (compared in constant time). */
export function keyOk(header) {
  const want = String(process.env.JARVIS_STATS_KEY || '').trim()
  if (!want) return null
  const got = String(header || '').replace(/^Bearer\s+/i, '').trim()
  if (!got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** midnight in Amsterdam on the day `t` falls on, as a timestamp */
function amsterdamMidnight(t) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(t))
  const p = Object.fromEntries(parts.map((x) => [x.type, Number(x.value)]))
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000
  return Date.UTC(p.year, p.month - 1, p.day) - offset
}

export function stats(db, now = Date.now()) {
  const t0 = amsterdamMidnight(now) - (DAYS - 1) * DAY
  const seed = seedUsers.map((u) => u.id)
  // real people: not the house accounts, not the demo accounts of the seed
  const people = `COALESCE(role, '') != 'admin' AND COALESCE(alias, '') != 'SMPL'${seed.length ? ` AND id NOT IN (${seed.map(() => '?').join(',')})` : ''}`
  const one = (sql, ...args) => Number(db.prepare(sql).get(...args)?.n ?? 0)
  const perDay = (sql, ...args) => {
    const out = Array(DAYS).fill(0)
    for (const r of db.prepare(sql).all(...args)) {
      const i = Number(r.d)
      if (i >= 0 && i < DAYS) out[i] = Number(r.n)
    }
    return out
  }
  const ix = `CAST((ts - ${t0}) / ${DAY} AS INTEGER)`
  const signups = perDay(`SELECT ${ix} AS d, COUNT(*) AS n FROM (SELECT joinedAt AS ts FROM users WHERE joinedAt >= ? AND ${people}) GROUP BY d`, t0, ...seed)
  const beats = perDay(`SELECT ${ix} AS d, COUNT(*) AS n FROM (SELECT createdAt AS ts FROM submissions WHERE createdAt >= ?) GROUP BY d`, t0)
  const total = one(`SELECT COUNT(*) AS n FROM users WHERE ${people}`, ...seed)
  let running = one(`SELECT COUNT(*) AS n FROM users WHERE COALESCE(joinedAt, 0) < ? AND ${people}`, t0, ...seed)
  const users = signups.map((n) => (running += n))
  const active = (days) => one(`SELECT COUNT(*) AS n FROM users WHERE lastSeenAt >= ? AND ${people}`, now - days * DAY, ...seed)
  return {
    platform: 'SMPL',
    at: now,
    from: new Date(t0 + 12 * 3_600_000).toISOString().slice(0, 10),
    users: { total, new7: signups.slice(-7).reduce((a, b) => a + b, 0), new30: signups.reduce((a, b) => a + b, 0), active1: active(1), active7: active(7), active30: active(30) },
    battles: { total: one('SELECT COUNT(*) AS n FROM battles'), running: one("SELECT COUNT(*) AS n FROM battles WHERE status != 'WINNER_DECLARED'") },
    beats: { total: one('SELECT COUNT(*) AS n FROM submissions'), last30: beats.reduce((a, b) => a + b, 0), producers: one('SELECT COUNT(DISTINCT producerId) AS n FROM submissions') },
    votes: { total: one('SELECT COUNT(*) AS n FROM votes') },
    series: { users, signups, beats },
  }
}
