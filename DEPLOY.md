# Deploying SMPL

One service. The Express server (`server/index.js`) serves the JSON API under
`/api/*` **and** the built React SPA (from `dist/`). In dev, Vite runs separately
and proxies `/api` to the server; in production there is no Vite — the server
serves everything on one port.

## Build & run

```sh
npm ci
npm run build        # → dist/
npm start            # NODE_ENV=production node server/index.js
```

The server listens on `PORT` (default `5191`).

## Environment

| var            | default          | purpose                                   |
| -------------- | ---------------- | ----------------------------------------- |
| `PORT`         | `5191`           | HTTP port                                 |
| `SMPL_SECRET`  | dev secret       | HMAC secret for auth tokens — **set this**|
| `SMPL_DB_PATH` | `server/data.db` | SQLite file location                      |

## Docker

```sh
docker build -t smpl .
docker run -p 5191:5191 \
  -e SMPL_SECRET="$(openssl rand -hex 32)" \
  -v smpl-data:/app/server \
  smpl
```

Mount a volume for the SQLite file so accounts, battles, votes and follows survive
redeploys (`-v smpl-data:/app/server`, or point `SMPL_DB_PATH` at a mounted path).

## Coolify / Hetzner (same shape as the Kings setup)

- Single service, Dockerfile build.
- Set `SMPL_SECRET` and attach a **persistent volume** at `/app/server` (the db).
- Coolify injects `PORT`; the server already honours it.

## Notes

- **Node ≥ 22.5** required (built-in `node:sqlite`). The image uses `node:24-alpine`.
- Auth: 30-day HMAC bearer tokens. Passwords are scrypt-hashed.
- Seed/demo accounts all use the password **`smpl`** (shown on the login page).
  Real signups set their own password (min 4 chars).
- To reset to clean seed data, delete `server/data.db*` and restart.
