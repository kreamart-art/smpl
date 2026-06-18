import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import {
  seedUsers,
  seedBattles,
  seedSubmissions,
  seedVotes,
  seedFollows,
} from '../src/data/mock.js'
import { hashPassword } from './auth.js'

const dbPath = process.env.SMPL_DB_PATH || fileURLToPath(new URL('./data.db', import.meta.url))
export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  alias TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT,
  name TEXT,
  dob TEXT,
  bio TEXT,
  location TEXT,
  links TEXT,
  genres TEXT,
  pastHistory TEXT,
  avatar TEXT,
  joinedAt INTEGER,
  lastSeenAt INTEGER,
  passwordHash TEXT,
  contactEmail TEXT
);
CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  kind TEXT,
  title TEXT, sampleUrl TEXT, sampleArtist TEXT, sampleSong TEXT,
  sampleDuration INTEGER, sampleRevealed INTEGER, description TEXT, curatorId TEXT,
  maxProducers INTEGER, signupStart INTEGER, signupEnd INTEGER, submitStart INTEGER,
  submitEnd INTEGER, voteStart INTEGER, voteEnd INTEGER, status TEXT,
  attendees TEXT, signups TEXT, winnerSubmissionId TEXT, blind INTEGER, scheduled INTEGER, genre TEXT
);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY, battleId TEXT, producerId TEXT, audioUrl TEXT,
  soundcloudUrl TEXT, youtubeUrl TEXT, duration INTEGER, createdAt INTEGER, approved INTEGER
);
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY, battleId TEXT, submissionId TEXT, userId TEXT
);
CREATE TABLE IF NOT EXISTS follows (
  followerId TEXT, followeeId TEXT, PRIMARY KEY (followerId, followeeId)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, fromId TEXT, toId TEXT, body TEXT, createdAt INTEGER, readAt INTEGER, battleId TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages (fromId, toId);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages (toId, readAt);
CREATE TABLE IF NOT EXISTS blocks (
  blockerId TEXT, blockedId TEXT, createdAt INTEGER, PRIMARY KEY (blockerId, blockedId)
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, reporterId TEXT, targetType TEXT, targetId TEXT, reason TEXT,
  context TEXT, createdAt INTEGER, resolved INTEGER
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY, userId TEXT, p256dh TEXT, auth TEXT, createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS message_reactions (
  messageId TEXT, userId TEXT, emoji TEXT, createdAt INTEGER, PRIMARY KEY (messageId, userId)
);
CREATE TABLE IF NOT EXISTS device_tokens (
  token TEXT PRIMARY KEY, userId TEXT, platform TEXT, createdAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (userId);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, submissionId TEXT, battleId TEXT, userId TEXT, body TEXT, createdAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_comments_sub ON comments (submissionId, createdAt);
CREATE TABLE IF NOT EXISTS samples (
  id TEXT PRIMARY KEY, makerId TEXT, genre TEXT, name TEXT, bpm INTEGER, sampleKey TEXT, url TEXT, status TEXT, createdAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples (status, genre);
`)

const J = (v) => JSON.stringify(v ?? [])
const P = (v, d = []) => {
  try {
    return JSON.parse(v) ?? d
  } catch {
    return d
  }
}

// ----- row mappers -----------------------------------------------------------
export function pubUser(r) {
  if (!r) return null
  return {
    id: r.id,
    alias: r.alias,
    // the public never sees the "admin" tier — admins read as curators
    role: r.role === 'admin' ? 'curator' : r.role,
    dualRole: !!r.dualRole, // competes in both beats + verses
    bio: r.bio || '',
    location: r.location || '',
    links: P(r.links),
    genres: P(r.genres),
    pastHistory: P(r.pastHistory),
    avatar: r.avatar || '',
    joinedAt: r.joinedAt,
    contactEmail: r.contactEmail || '', // optional, public — distinct from the private login email
    verified: !!r.verified, // admin-granted badge
  }
}

// Full record incl. private fields — only ever returned to the owner.
// Exposes whether 2FA is on, never the secret or backup codes.
export function meUser(r) {
  if (!r) return null
  return {
    ...pubUser(r),
    role: r.role, // the owner sees their real role (incl. admin) for gating
    name: r.name || '',
    dob: r.dob || '',
    email: r.email,
    phone: r.phone || '',
    country: r.country || '',
    city: r.city || '',
    gender: r.gender || '', // private; never in pubUser
    genderText: r.genderText || '', // free text when gender = 'self'
    lastSeenAt: r.lastSeenAt || 0,
    twoFactor: !!r.totpEnabled,
    emailVerified: !!r.emailVerified,
    curatorCompetes: !!r.curatorCompetes,
    sampleMakerStatus: r.sampleMakerStatus || null,
    sampleMakerModel: r.sampleMakerModel || null,
  }
}

export function rowToBattle(r) {
  if (!r) return null
  return {
    ...r,
    kind: r.kind || 'BEATS',
    sampleRevealed: !!r.sampleRevealed,
    blind: !!r.blind,
    scheduled: !!r.scheduled,
    attendees: P(r.attendees),
    signups: P(r.signups),
  }
}

export function rowToSubmission(r) {
  if (!r) return null
  return { ...r, approved: !!r.approved }
}

// ----- one-time seed from the shared mock data -------------------------------
export function seedIfEmpty() {
  const n = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (n > 0) return false
  const seenAt = Date.now()
  const demoHash = hashPassword('smpl') // every seed account uses the demo password

  const insU = db.prepare(
    `INSERT INTO users (id,alias,email,role,name,dob,bio,location,links,genres,pastHistory,avatar,joinedAt,lastSeenAt,passwordHash)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  for (const u of seedUsers) {
    insU.run(
      u.id, u.alias, u.email, u.role, u.name ?? null, u.dob ?? null,
      u.bio || '', u.location || '', J(u.links), J(u.genres), J(u.pastHistory),
      u.avatar || '', u.joinedAt ?? null, seenAt, demoHash,
    )
  }

  const insB = db.prepare(
    `INSERT INTO battles (id,kind,title,sampleUrl,sampleArtist,sampleSong,sampleDuration,sampleRevealed,description,curatorId,maxProducers,signupStart,signupEnd,submitStart,submitEnd,voteStart,voteEnd,status,attendees,signups,winnerSubmissionId)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  for (const b of seedBattles) {
    insB.run(
      b.id, b.kind || 'BEATS', b.title, b.sampleUrl || '', b.sampleArtist || '', b.sampleSong || '',
      b.sampleDuration || 10, b.sampleRevealed ? 1 : 0, b.description || '', b.curatorId,
      b.maxProducers || 8, b.signupStart, b.signupEnd, b.submitStart, b.submitEnd,
      b.voteStart, b.voteEnd, b.status, J(b.attendees), J(b.signups), b.winnerSubmissionId ?? null,
    )
  }

  const insS = db.prepare(
    `INSERT INTO submissions (id,battleId,producerId,audioUrl,soundcloudUrl,youtubeUrl,duration,createdAt,approved)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  )
  for (const s of seedSubmissions) {
    insS.run(
      s.id, s.battleId, s.producerId, s.audioUrl || '', s.soundcloudUrl || '',
      s.youtubeUrl || '', s.duration || 15, s.createdAt, s.approved ? 1 : 0,
    )
  }

  const insV = db.prepare(`INSERT INTO votes (id,battleId,submissionId,userId) VALUES (?,?,?,?)`)
  for (const v of seedVotes) insV.run(v.id, v.battleId, v.submissionId, v.userId)

  const insF = db.prepare(`INSERT OR IGNORE INTO follows (followerId,followeeId) VALUES (?,?)`)
  for (const f of seedFollows) insF.run(f.followerId, f.followeeId)

  return true
}

function addColumn(table, col, decl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`)
}

// Idempotent migrations applied on every boot (safe to re-run on an existing db).
// Handles are normalised to ALL CAPS with no spaces or odd characters: only
// A-Z, 0-9, dot, underscore and hyphen, max 20 chars (Instagram-style, upper).
export function normalizeHandle(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 20)
}

export function migrate() {
  // 2026-06-12: the verses-competitor role "vocalist" was renamed to "artist".
  db.exec("UPDATE users SET role = 'artist' WHERE role = 'vocalist'")
  // 2026-06-12: opt-in TOTP two-factor auth.
  addColumn('users', 'totpSecret', 'TEXT')
  addColumn('users', 'totpEnabled', 'INTEGER')
  addColumn('users', 'backupCodes', 'TEXT')
  // 2026-06-12: a DM can reference a shared battle.
  addColumn('messages', 'battleId', 'TEXT')
  // 2026-06-12: rich DMs — quote-replies, image/voice attachments, unsend.
  addColumn('messages', 'replyTo', 'TEXT')
  addColumn('messages', 'imageUrl', 'TEXT')
  addColumn('messages', 'audioUrl', 'TEXT')
  addColumn('messages', 'deletedAt', 'INTEGER')
  // 2026-06-13: timestamp follows so a new follower surfaces as a notification.
  addColumn('follows', 'createdAt', 'INTEGER')
  // 2026-06-13: richer, self-editable personal data (contact / identity).
  addColumn('users', 'phone', 'TEXT')
  addColumn('users', 'country', 'TEXT')
  addColumn('users', 'city', 'TEXT')
  addColumn('users', 'gender', 'TEXT')
  addColumn('users', 'genderText', 'TEXT')
  // 2026-06-13: share a profile/battle/event into a DM as a card.
  addColumn('messages', 'shareKind', 'TEXT')
  addColumn('messages', 'shareRef', 'TEXT')
  // 2026-06-13: record consent to Terms + Privacy at signup (AVG/GDPR).
  addColumn('users', 'acceptedTerms', 'INTEGER')
  // 2026-06-13: a competitor who does BOTH beats + verses (joins both battle types).
  addColumn('users', 'dualRole', 'INTEGER')
  // 2026-06-13: a curator can disqualify a submission that breaks the rules.
  addColumn('submissions', 'disqualified', 'INTEGER')
  // 2026-06-12: optional public contact email on a profile.
  addColumn('users', 'contactEmail', 'TEXT')
  // 2026-06-13: emoji "stickers" stamped onto a DM photo (JSON: [{id,emoji,x,y,by}]).
  addColumn('messages', 'photoStamps', 'TEXT')
  // 2026-06-14: a curator who opted to also compete in battles (never their own).
  addColumn('users', 'curatorCompetes', 'INTEGER')
  // 2026-06-14: community sample makers — apply, get reviewed, submit samples.
  addColumn('users', 'sampleMakerStatus', 'TEXT') // null | pending | approved | rejected
  addColumn('users', 'sampleMakerModel', 'TEXT') // license | royalty | both
  addColumn('users', 'sampleMakerAt', 'INTEGER')
  // 2026-06-12: per-battle blind voting + curator-set auto-running schedule.
  addColumn('battles', 'blind', 'INTEGER')
  addColumn('battles', 'scheduled', 'INTEGER')
  // 2026-06-12: a battle genre (shown on the share card to pull makers in).
  addColumn('battles', 'genre', 'TEXT')
  // 2026-06-12: email verification flag.
  addColumn('users', 'emailVerified', 'INTEGER')
  // 2026-06-12: admin-granted verified badge.
  addColumn('users', 'verified', 'INTEGER')
  // 2026-06-12: the founder account is the platform ADMIN (a tier above curator).
  // Override the email with SMPL_ADMIN_EMAIL if it ever changes.
  const adminEmail = (process.env.SMPL_ADMIN_EMAIL || 'info.kreamix@gmail.com').toLowerCase()
  db.prepare("UPDATE users SET role = 'admin' WHERE lower(email) = ?").run(adminEmail)
  // admins are masked as curators publicly, so give them the verified badge
  // explicitly (the badge now keys off `verified`, not the hidden role).
  db.prepare("UPDATE users SET verified = 1 WHERE role = 'admin'").run()
  // 2026-06-17: producer-saved waveform share clips, shown on the profile.
  db.exec(
    'CREATE TABLE IF NOT EXISTS waveform_videos (id TEXT PRIMARY KEY, userId TEXT, battleId TEXT, url TEXT, tag TEXT, createdAt INTEGER)',
  )
  // 2026-06-18: curator battle drafts — save a partly-set-up battle, finish later.
  db.exec(
    'CREATE TABLE IF NOT EXISTS battle_drafts (id TEXT PRIMARY KEY, curatorId TEXT, data TEXT, createdAt INTEGER, updatedAt INTEGER)',
  )
  // 2026-06-18: crate — save beats/verses from battles to your profile. NOT a
  // like: no public per-beat counter, never touches voting. One row per save.
  db.exec(
    'CREATE TABLE IF NOT EXISTS crate_items (id TEXT PRIMARY KEY, userId TEXT, submissionId TEXT, battleId TEXT, createdAt INTEGER)',
  )
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS crate_uniq ON crate_items (userId, submissionId)')
  // 2026-06-18: submission-deadline reminders. Optional one-off custom reminder
  // time per battle + a dedup table so each reminder fires only once.
  addColumn('battles', 'reminderAt', 'INTEGER')
  db.exec(
    'CREATE TABLE IF NOT EXISTS reminders_sent (battleId TEXT, kind TEXT, sentAt INTEGER, PRIMARY KEY (battleId, kind))',
  )
  // 2026-06-16: handles are ALL CAPS, no spaces or odd chars (A-Z 0-9 . _ -).
  for (const u of db.prepare('SELECT id, alias FROM users').all()) {
    const norm = normalizeHandle(u.alias)
    if (norm && norm !== u.alias) {
      try {
        db.prepare('UPDATE users SET alias = ? WHERE id = ?').run(norm, u.id)
      } catch {
        /* unique collision: keep the original handle rather than crash */
      }
    }
  }
}
