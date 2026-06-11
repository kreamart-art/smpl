// SMPL service worker — makes the app installable + offline-resilient.
// Network-first for GET (so the app shell updates), cache as fallback.
// API + non-GET always go straight to the network (never cached).
const CACHE = 'smpl-shell-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    return // let it hit the network normally
  }
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone()
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {})
        return resp
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/')),
      ),
  )
})
