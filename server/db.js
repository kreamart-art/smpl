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
    role: r.role,
    bio: r.bio || '',
    location: r.location || '',
    links: P(r.links),
    genres: P(r.genres),
    pastHistory: P(r.pastHistory),
    avatar: r.avatar || '',
    joinedAt: r.joinedAt,
    contactEmail: r.contactEmail || '', // optional, public — distinct from the private login email
  }
}

// Full record incl. private fields — only ever returned to the owner.
// Exposes whether 2FA is on, never the secret or backup codes.
export function meUser(r) {
  if (!r) return null
  return {
    ...pubUser(r),
    name: r.name || '',
    dob: r.dob || '',
    email: r.email,
    lastSeenAt: r.lastSeenAt || 0,
    twoFactor: !!r.totpEnabled,
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
export function migrate() {
  // 2026-06-12: the verses-competitor role "vocalist" was renamed to "artist".
  db.exec("UPDATE users SET role = 'artist' WHERE role = 'vocalist'")
  // 2026-06-12: opt-in TOTP two-factor auth.
  addColumn('users', 'totpSecret', 'TEXT')
  addColumn('users', 'totpEnabled', 'INTEGER')
  addColumn('users', 'backupCodes', 'TEXT')
  // 2026-06-12: a DM can reference a shared battle.
  addColumn('messages', 'battleId', 'TEXT')
  // 2026-06-12: optional public contact email on a profile.
  addColumn('users', 'contactEmail', 'TEXT')
  // 2026-06-12: per-battle blind voting + curator-set auto-running schedule.
  addColumn('battles', 'blind', 'INTEGER')
  addColumn('battles', 'scheduled', 'INTEGER')
  // 2026-06-12: a battle genre (shown on the share card to pull makers in).
  addColumn('battles', 'genre', 'TEXT')
}
