import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './db.js'

const DB_PATH = process.env.SMPL_DB_PATH || fileURLToPath(new URL('./data.db', import.meta.url))
// Backups live next to the DB — same persistent volume in production
// (/app/data/backups). Off-volume copies are a separate host-level concern.
const BACKUP_DIR = process.env.SMPL_BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups')
const KEEP = Number(process.env.SMPL_BACKUP_KEEP) || 14

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

// A consistent snapshot even with WAL active — VACUUM INTO copies committed
// state into a fresh, fully-valid SQLite file (restore = copy it back).
export function runBackup() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
  const file = path.join(BACKUP_DIR, `smpl-${stamp()}.db`)
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`)
  rotate()
  const { size } = statSync(file)
  console.log(`[backup] wrote ${path.basename(file)} (${Math.round(size / 1024)} KB)`)
  return { file, size }
}

function rotate() {
  for (const f of listBackups().slice(KEEP)) {
    try {
      unlinkSync(path.join(BACKUP_DIR, f.name))
    } catch {
      /* ignore */
    }
  }
}

export function listBackups() {
  if (!existsSync(BACKUP_DIR)) return []
  return readdirSync(BACKUP_DIR)
    .filter((n) => n.startsWith('smpl-') && n.endsWith('.db'))
    .map((name) => {
      const st = statSync(path.join(BACKUP_DIR, name))
      return { name, size: st.size, at: st.mtimeMs }
    })
    .sort((a, b) => b.at - a.at)
}

// One snapshot ~10s after boot, then every `intervalMs`. unref() so the timer
// never holds the process open on its own.
export function scheduleBackups(intervalMs = 24 * 60 * 60 * 1000) {
  const run = () => {
    try {
      runBackup()
    } catch (e) {
      console.error('[backup] failed:', e.message)
    }
  }
  const boot = setTimeout(run, 10_000)
  const tick = setInterval(run, intervalMs)
  boot.unref?.()
  tick.unref?.()
  console.log(`[backup] scheduled every ${Math.round(intervalMs / 3_600_000)}h → ${BACKUP_DIR} (keep ${KEEP})`)
}
